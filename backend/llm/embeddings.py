"""Embedding generation via Ollama nomic-embed-text (with parallel batch processing)."""

import requests
from typing import List, Callable, Optional
from pathlib import Path
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, str(Path(__file__).parent.parent))

from config import OLLAMA_BASE_URL, OLLAMA_MODEL


class EmbeddingGenerator:
    """Generate embeddings using Ollama nomic-embed-text model with parallel batching."""

    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = "nomic-embed-text", max_workers: int = 1):
        self.base_url = base_url
        self.model = model
        self.embedding_dim = 768  # nomic-embed-text produces 768D vectors
        self.max_workers = max_workers  # Number of parallel workers (reduced to 1 to avoid Ollama overload)

    def embed(self, text: str) -> List[float]:
        """Generate embedding for a single text."""
        try:
            response = requests.post(
                f"{self.base_url}/api/embed",
                json={
                    "model": self.model,
                    "input": text,
                },
                timeout=120,
            )
            response.raise_for_status()
            data = response.json()

            # Handle both single and multiple embeddings
            if "embeddings" in data:
                embeddings = data["embeddings"]
                if isinstance(embeddings, list) and len(embeddings) > 0:
                    return embeddings[0]

            raise ValueError(f"Unexpected response format: {data}")
        except requests.RequestException as e:
            raise RuntimeError(f"Embedding request failed: {e}. Is Ollama running at {self.base_url}?")
        except Exception as e:
            raise RuntimeError(f"Embedding generation failed: {e}")

    def embed_batch(self, texts: List[str], progress_callback: Optional[Callable] = None) -> List[List[float]]:
        """Generate embeddings for multiple texts in parallel batches."""
        embeddings = [None] * len(texts)
        completed = 0

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all tasks
            future_to_index = {
                executor.submit(self.embed, text): idx
                for idx, text in enumerate(texts)
            }

            # Process as they complete
            for future in as_completed(future_to_index):
                idx = future_to_index[future]
                try:
                    embedding = future.result()
                    embeddings[idx] = embedding
                except Exception as e:
                    print(f"[Warning] Failed to embed text {idx}: {e}")
                    embeddings[idx] = [0.0] * self.embedding_dim

                completed += 1
                if progress_callback:
                    progress_callback(completed, len(texts))

        return embeddings

    def get_model_name(self) -> str:
        """Return model name."""
        return self.model

    def get_embedding_dimension(self) -> int:
        """Return embedding dimension."""
        return self.embedding_dim
