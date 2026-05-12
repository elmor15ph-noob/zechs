import os
import json
import glob
import hashlib
from dotenv import load_dotenv

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

# Load environment variables
load_dotenv()

# Configuration
RAW_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "chroma_db")
COLLECTION_NAME = "sap_s4hana_docs"

class KnowledgeBaseIndexer:
    def __init__(self):
        # Initialize embeddings
        self.embeddings = OllamaEmbeddings(model=os.getenv("OLLAMA_MODEL", "llama3"), base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"))

        # Initialize Chroma DB
        self.vector_store = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=self.embeddings,
            persist_directory=CHROMA_DB_DIR
        )

        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            is_separator_regex=False,
        )

    def get_processed_files(self):
        """Get a list of already processed file hashes from the vector store to handle incremental updates."""
        try:
            # We store the file hash in the metadata to track changes
            # Retrieve all distinct file_hashes or source URLs from Chroma
            # Chroma doesn't have a direct "get all metadata" easily without returning everything,
            # but we can query it or we can keep a local manifest.
            # A simpler approach: load existing metadata using vector_store.get()
            existing_data = self.vector_store.get(include=["metadatas"])
            if not existing_data or not existing_data['metadatas']:
                return set()

            processed_hashes = set()
            for metadata in existing_data['metadatas']:
                if 'file_hash' in metadata:
                    processed_hashes.add(metadata['file_hash'])
            return processed_hashes
        except Exception as e:
            print(f"Error retrieving processed files: {e}")
            return set()

    def _compute_file_hash(self, filepath: str) -> str:
        """Compute MD5 hash of a file to detect changes."""
        hash_md5 = hashlib.md5()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def process_raw_data(self):
        """Read JSON files, chunk text, and index into ChromaDB incrementally."""
        if not os.path.exists(RAW_DATA_DIR):
            print(f"Directory {RAW_DATA_DIR} does not exist. Run scraper first.")
            return

        json_files = glob.glob(os.path.join(RAW_DATA_DIR, "*.json"))
        print(f"Found {len(json_files)} JSON files in {RAW_DATA_DIR}")

        processed_hashes = self.get_processed_files()

        docs_to_add = []
        files_indexed = 0

        for filepath in json_files:
            file_hash = self._compute_file_hash(filepath)

            # Incremental check: skip if file hasn't changed
            if file_hash in processed_hashes:
                print(f"Skipping unmodified file: {os.path.basename(filepath)}")
                continue

            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                url = data.get("url", "")
                title = data.get("title", "")
                content = data.get("content", "")

                if not content:
                    continue

                # Create a LangChain document
                doc = Document(
                    page_content=content,
                    metadata={"source": url, "title": title, "file_hash": file_hash}
                )

                # Split the document
                chunks = self.text_splitter.split_documents([doc])

                # Assign deterministic IDs to chunks to avoid duplicates if we re-index a modified file
                # In this basic incremental setup, we rely on file_hash to skip unchanged files.
                # If a file changes, its hash changes, and we'd append new chunks.
                # (For full update/delete sync, we'd delete old chunks first, but appending is a simple incremental step).
                docs_to_add.extend(chunks)
                files_indexed += 1
                print(f"Processed {os.path.basename(filepath)} into {len(chunks)} chunks.")

            except Exception as e:
                print(f"Error processing {filepath}: {e}")

        if docs_to_add:
            print(f"Adding {len(docs_to_add)} chunks to ChromaDB...")
            # Chroma handles batching, but if it's very large, we might want to batch it ourselves
            # Langchain's Chroma integration adds them efficiently.
            self.vector_store.add_documents(docs_to_add)
            print("Indexing complete.")
        else:
            print("No new documents to index.")

if __name__ == "__main__":
    print("Starting Knowledge Base Indexer...")
    indexer = KnowledgeBaseIndexer()
    indexer.process_raw_data()
