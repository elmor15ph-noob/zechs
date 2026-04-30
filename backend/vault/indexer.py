"""LanceDB vector indexer for vault notes with caching and parallel embedding."""

import lancedb
import json
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from llm.embeddings import EmbeddingGenerator
from vault.reader import VaultReader


class VaultIndexer:
    """Vector index of vault using LanceDB with caching and parallel batch processing."""

    def __init__(self, vault_path: Path, db_path: Optional[Path] = None):
        self.vault_path = Path(vault_path)
        self.vault = VaultReader(vault_path)
        self.embedder = EmbeddingGenerator(max_workers=3)

        # LanceDB location
        if db_path is None:
            db_path = self.vault_path / ".lancedb"
        self.db_path = Path(db_path)
        self.db_path.mkdir(exist_ok=True)

        # Initialize LanceDB
        self.db = lancedb.connect(str(self.db_path))
        self.table_name = "vault_notes"

        # Embedding cache file
        self._embedding_cache_file = self.db_path / ".embedding_cache.jsonl"
        self._embedding_cache = self._load_embedding_cache()

        # Index state
        self._index_state_file = self.db_path / ".index_state.json"
        self._load_index_state()

        # Progress tracking
        self.last_progress = (0, 0)

    def _load_embedding_cache(self) -> Dict:
        """Load cached embeddings."""
        cache = {}
        if self._embedding_cache_file.exists():
            try:
                with open(self._embedding_cache_file) as f:
                    for line in f:
                        entry = json.loads(line)
                        cache[entry["filename"]] = entry["embedding"]
            except Exception as e:
                print(f"[Warning] Failed to load embedding cache: {e}")
        return cache

    def _save_embedding_cache(self):
        """Save embeddings to cache file."""
        try:
            with open(self._embedding_cache_file, "w") as f:
                for filename, embedding in self._embedding_cache.items():
                    f.write(json.dumps({"filename": filename, "embedding": embedding}) + "\n")
        except Exception as e:
            print(f"[Warning] Failed to save embedding cache: {e}")

    def _load_index_state(self):
        """Load index state (which notes are indexed)."""
        if self._index_state_file.exists():
            with open(self._index_state_file) as f:
                self.index_state = json.load(f)
        else:
            self.index_state = {"indexed_notes": {}, "last_update": None}

    def _save_index_state(self):
        """Save index state."""
        self.index_state["last_update"] = datetime.now().isoformat()
        with open(self._index_state_file, "w") as f:
            json.dump(self.index_state, f, indent=2)

    def _on_progress(self, completed: int, total: int):
        """Progress callback for embedding generation."""
        self.last_progress = (completed, total)
        print(f"[LanceDB] Embedding: {completed}/{total}")

    def build_index(self, force: bool = False):
        """Build vector index of all vault notes with caching and parallel processing."""
        print(f"[LanceDB] Building index for {len(self.vault.notes)} notes...")

        notes_to_index = []
        texts_to_embed = []
        text_to_note_map = {}

        # Identify notes that need embedding
        for note in self.vault.notes:
            filename = note["filename"]

            # Skip if cached and hasn't changed
            if filename in self._embedding_cache:
                if not force and filename in self.index_state["indexed_notes"]:
                    if self.index_state["indexed_notes"][filename] == note.get("timestamp"):
                        continue

            notes_to_index.append(note)
            text_to_embed = note["body"][:500] if note["body"] else note["filename"]
            texts_to_embed.append(text_to_embed)
            text_to_note_map[len(texts_to_embed) - 1] = note

        if not notes_to_index:
            print("[LanceDB] All notes already indexed. Skipping.")
            return

        print(f"[LanceDB] Indexing {len(notes_to_index)} new/updated notes...")

        # Try to generate embeddings, but skip if Ollama is unavailable
        embeddings = []
        try:
            embeddings = self.embedder.embed_batch(texts_to_embed, progress_callback=self._on_progress)
            print(f"[LanceDB] Generated {len(embeddings)} embeddings successfully")
        except Exception as e:
            print(f"[Warning] Embedding generation failed: {e}")
            print(f"[LanceDB] Will use keyword search only (vector search unavailable)")
            # Use zero embeddings as fallback - keyword search will still work
            embeddings = [[0.0] * self.embedder.embedding_dim for _ in texts_to_embed]

        # Prepare data for LanceDB
        data = []
        for idx, embedding in enumerate(embeddings):
            if idx in text_to_note_map:
                note = text_to_note_map[idx]
                filename = note["filename"]
                data.append({
                    "filename": filename,
                    "path": note["path"],
                    "body": note["body"],
                    "embedding": embedding,
                    "timestamp": note.get("timestamp", 0),
                })
                # Cache embedding
                self._embedding_cache[filename] = embedding
                # Update index state
                self.index_state["indexed_notes"][filename] = note.get("timestamp", 0)

        if not data:
            print("[LanceDB] No notes to index.")
            return

        # Create or append to LanceDB table
        try:
            if self.table_name in self.db.table_names():
                # Append to existing table
                table = self.db.open_table(self.table_name)
                table.add(data)
                print(f"[LanceDB] Added {len(data)} notes to index")
            else:
                # Create new table
                table = self.db.create_table(self.table_name, data=data)
                print(f"[LanceDB] Created index with {len(data)} notes")

            # Save cache and state
            self._save_embedding_cache()
            self._save_index_state()
            print(f"[LanceDB] Index complete. Embeddings cached.")
        except Exception as e:
            print(f"[Error] Failed to write to LanceDB: {e}")
            raise

    def search_hybrid(self, query: str, limit: int = 10) -> List[Dict]:
        """Hybrid search: vector similarity + keyword BM25."""
        try:
            # Vector search
            query_embedding = self.embedder.embed(query)

            if self.table_name not in self.db.table_names():
                print("[Warning] Index not built yet. Run build_index() first.")
                return []

            table = self.db.open_table(self.table_name)

            # Vector search with limit
            vector_results = table.search(query_embedding).limit(limit * 2).to_list()

            # BM25 keyword search (simple implementation: check if query words in body)
            keyword_results = self.vault.search_keywords(query, limit=limit * 2)

            # Combine and deduplicate (vector results weighted higher)
            seen = set()
            results = []

            # Add vector results first (better for semantic search)
            for v_result in vector_results:
                filename = v_result["filename"]
                if filename not in seen:
                    results.append({
                        "filename": filename,
                        "path": v_result["path"],
                        "preview": v_result["body"][:200] + "..." if len(v_result["body"]) > 200 else v_result["body"],
                        "score": v_result.get("_distance", 0),
                        "type": "vector",
                    })
                    seen.add(filename)

            # Add keyword results (good for exact matches)
            for k_result in keyword_results:
                filename = k_result["filename"]
                if filename not in seen:
                    results.append({
                        "filename": filename,
                        "path": k_result["path"],
                        "preview": k_result["body"][:200] + "..." if len(k_result["body"]) > 200 else k_result["body"],
                        "score": 1.0,
                        "type": "keyword",
                    })
                    seen.add(filename)

            return results[:limit]
        except Exception as e:
            print(f"[Error] Hybrid search failed: {e}")
            # Fallback to keyword search
            return [
                {
                    "filename": r["filename"],
                    "path": r["path"],
                    "preview": r["body"][:200] + "..." if len(r["body"]) > 200 else r["body"],
                    "score": 1.0,
                    "type": "keyword",
                }
                for r in self.vault.search_keywords(query, limit=limit)
            ]

    def search_vector(self, query: str, limit: int = 10) -> List[Dict]:
        """Pure vector search (semantic)."""
        try:
            query_embedding = self.embedder.embed(query)

            if self.table_name not in self.db.table_names():
                return []

            table = self.db.open_table(self.table_name)
            results = table.search(query_embedding).limit(limit).to_list()

            return [
                {
                    "filename": r["filename"],
                    "path": r["path"],
                    "preview": r["body"][:200] + "..." if len(r["body"]) > 200 else r["body"],
                    "score": r.get("_distance", 0),
                    "type": "vector",
                }
                for r in results
            ]
        except Exception as e:
            print(f"[Error] Vector search failed: {e}")
            return []
