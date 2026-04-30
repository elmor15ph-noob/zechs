"""Vault reader - loads and indexes Obsidian notes."""

import json
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime


class VaultReader:
    """Read and search Obsidian vault."""

    def __init__(self, vault_path: Path):
        self.vault_path = Path(vault_path)
        self.notes = []
        self._load_all_notes()

    def _load_all_notes(self) -> None:
        """Load all .md files from vault."""
        self.notes = []
        for md_file in self.vault_path.rglob("*.md"):
            # Skip BrainApp folder and archives
            if "BrainApp" in str(md_file) or "04-Archives" in str(md_file):
                continue

            try:
                with open(md_file, encoding="utf-8") as f:
                    content = f.read()

                frontmatter, body = self._parse_markdown(content)
                note = {
                    "path": str(md_file.relative_to(self.vault_path)),
                    "filename": md_file.stem,
                    "frontmatter": frontmatter,
                    "body": body,
                    "content": content,
                    "timestamp": md_file.stat().st_mtime,
                }
                self.notes.append(note)
            except Exception as e:
                print(f"[Warning] Failed to load {md_file}: {e}")

        print(f"[VaultReader] Loaded {len(self.notes)} notes")

    def _parse_markdown(self, content: str) -> tuple:
        """Parse frontmatter and body from markdown."""
        if not content.startswith("---"):
            return {}, content

        parts = content.split("---", 2)
        if len(parts) < 3:
            return {}, content

        try:
            import yaml

            frontmatter = yaml.safe_load(parts[1]) or {}
            body = parts[2].strip()
        except Exception:
            frontmatter = {}
            body = content

        return frontmatter, body

    def get_all_notes(self) -> List[Dict]:
        """Get all loaded notes."""
        return self.notes

    def search_by_path(self, path: str) -> Optional[Dict]:
        """Search for a note by path."""
        for note in self.notes:
            if path in note["path"]:
                return note
        return None

    def search_by_filename(self, filename: str) -> Optional[Dict]:
        """Search for a note by filename."""
        for note in self.notes:
            if note["filename"].lower() == filename.lower():
                return note
        return None

    def search_keywords(self, query: str, limit: int = 5) -> List[Dict]:
        """Simple keyword search (case-insensitive)."""
        query_lower = query.lower()
        results = []

        for note in self.notes:
            score = 0
            # Boost if in filename
            if query_lower in note["filename"].lower():
                score += 10
            # Check in body
            if query_lower in note["body"].lower():
                score += 1
            # Check in frontmatter (safely)
            try:
                fm_str = json.dumps(note["frontmatter"], default=str)
                if query_lower in fm_str.lower():
                    score += 5
            except (TypeError, ValueError):
                # If frontmatter can't be JSON serialized, just skip it
                pass

            if score > 0:
                results.append((note, score))

        # Sort by score, return top results
        results.sort(key=lambda x: x[1], reverse=True)
        return [note for note, _ in results[:limit]]

    def get_glidepath(self) -> Optional[Dict]:
        """Get the GLIDEPATH note."""
        return self.search_by_filename("GLIDEPATH-Autonomous-Knowledge-System")

    def get_user_profile(self) -> Optional[Dict]:
        """Get the user profile."""
        return self.search_by_filename("user_profile")

    def get_sap_patterns(self) -> List[Dict]:
        """Get all SAP-related notes."""
        return self.search_keywords("SAP", limit=10)

    def get_persona_traits(self) -> Optional[Dict]:
        """Get persona traits if available."""
        return self.search_by_filename("persona_traits")
