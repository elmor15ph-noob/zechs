"""
O2C Application Launcher
Starts FastAPI backend and opens PyWebView window
"""

import webview
import threading
import time
import os
import sys
import socket
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

def find_free_port(start_port=8000):
    """Find an available port"""
    port = start_port
    while port < 9000:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.bind(('127.0.0.1', port))
            sock.close()
            return port
        except OSError:
            port += 1
    raise RuntimeError("No free ports available")

def run_backend(port):
    """Run FastAPI backend in background thread"""
    try:
        import uvicorn
        from main_o2c import app

        # Run server
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=port,
            log_level="error",
            access_log=False,
        )
    except Exception as e:
        print(f"Error starting backend: {e}")
        sys.exit(1)

def main():
    """Main launcher"""
    # Find free port
    port = find_free_port()
    backend_url = f'http://127.0.0.1:{port}'

    print(f"Starting O2C Application...")
    print(f"Backend: {backend_url}")

    # Start backend in background thread
    backend_thread = threading.Thread(
        target=run_backend,
        args=(port,),
        daemon=True
    )
    backend_thread.start()

    # Wait for backend to start
    print("Starting backend service...")
    time.sleep(3)

    # Create native window
    print("Opening application window...")
    window = webview.create_window(
        title='O2C Global Solution Orchestrator',
        url=backend_url,
        width=1400,
        height=900,
        min_size=(1024, 768),
        background_color='#ffffff',
        resizable=True
    )

    # Start webview (blocks until window closes)
    webview.start(debug=False)

    print("Application closed")
    sys.exit(0)

if __name__ == '__main__':
    main()
