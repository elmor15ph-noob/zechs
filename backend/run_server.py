#!/usr/bin/env python
"""Run the FastAPI server with explicit imports."""

import sys
from pathlib import Path

# Ensure backend is in path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from api.routes import app
import uvicorn

if __name__ == "__main__":
    print("[Server] Starting Brain API...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
