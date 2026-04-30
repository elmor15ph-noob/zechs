"""File watcher for vault directory to auto-reindex on changes."""

import threading
from pathlib import Path
from typing import Optional, Callable
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileModifiedEvent
import time


class VaultFileHandler(FileSystemEventHandler):
    """Handles file system events for vault directory."""

    def __init__(self, callback: Callable[[str], None], vault_path: Path):
        self.callback = callback
        self.vault_path = vault_path
        self.debounce_timer: Optional[threading.Timer] = None
        self.debounce_files = set()
        self.debounce_delay = 2.0  # Seconds to wait before reindexing

    def on_modified(self, event: FileModifiedEvent):
        """Called when a file is modified."""
        if event.is_directory:
            return

        file_path = Path(event.src_path)

        # Only watch markdown files
        if file_path.suffix != ".md":
            return

        # Skip hidden/temp files
        if file_path.name.startswith(".") or file_path.name.startswith("~"):
            return

        print(f"[Watcher] Detected change: {file_path.name}")
        self.debounce_files.add(str(file_path))

        # Reset debounce timer
        if self.debounce_timer:
            self.debounce_timer.cancel()

        self.debounce_timer = threading.Timer(
            self.debounce_delay,
            self._trigger_reindex
        )
        self.debounce_timer.daemon = True
        self.debounce_timer.start()

    def _trigger_reindex(self):
        """Trigger reindex after debounce delay."""
        if not self.debounce_files:
            return

        files = list(self.debounce_files)
        self.debounce_files.clear()

        print(f"[Watcher] Reindexing {len(files)} file(s)...")
        try:
            self.callback(files)
            print(f"[Watcher] Reindex complete")
        except Exception as e:
            print(f"[Watcher] Reindex failed: {e}")


class VaultWatcher:
    """Watches vault directory for changes and triggers reindexing."""

    def __init__(self, vault_path: Path, reindex_callback: Callable[[list], None]):
        """
        Initialize watcher.

        Args:
            vault_path: Path to vault directory
            reindex_callback: Function to call when files change (receives list of file paths)
        """
        self.vault_path = Path(vault_path)
        self.reindex_callback = reindex_callback
        self.observer: Optional[Observer] = None
        self.is_running = False

    def start(self):
        """Start watching vault directory."""
        if self.is_running:
            print("[Watcher] Already running")
            return

        print(f"[Watcher] Starting vault watcher for {self.vault_path}")

        # Create event handler
        event_handler = VaultFileHandler(
            callback=self._handle_changes,
            vault_path=self.vault_path
        )

        # Create observer and start
        self.observer = Observer()
        self.observer.schedule(event_handler, str(self.vault_path), recursive=True)
        self.observer.start()
        self.is_running = True

        print("[Watcher] Vault watcher started")

    def stop(self):
        """Stop watching vault directory."""
        if not self.is_running or not self.observer:
            return

        print("[Watcher] Stopping vault watcher")
        self.observer.stop()
        self.observer.join(timeout=5)
        self.is_running = False
        print("[Watcher] Vault watcher stopped")

    def _handle_changes(self, files: list):
        """Handle file changes by calling reindex callback."""
        try:
            self.reindex_callback(files)
        except Exception as e:
            print(f"[Watcher] Error handling changes: {e}")


# Global watcher instance
_watcher_instance: Optional[VaultWatcher] = None


def initialize_watcher(vault_path: Path, reindex_callback: Callable[[list], None]) -> VaultWatcher:
    """
    Initialize global vault watcher.

    Args:
        vault_path: Path to vault directory
        reindex_callback: Function to call when files change

    Returns:
        VaultWatcher instance
    """
    global _watcher_instance

    if _watcher_instance is not None:
        return _watcher_instance

    _watcher_instance = VaultWatcher(vault_path, reindex_callback)
    _watcher_instance.start()
    return _watcher_instance


def get_watcher() -> Optional[VaultWatcher]:
    """Get global watcher instance."""
    return _watcher_instance


def shutdown_watcher():
    """Shutdown global watcher."""
    global _watcher_instance
    if _watcher_instance:
        _watcher_instance.stop()
        _watcher_instance = None
