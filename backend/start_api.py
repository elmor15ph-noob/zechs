#!/usr/bin/env python3
"""Start the Brain API server - fresh Python process."""

if __name__ == "__main__":
    import uvicorn
    import sys
    from pathlib import Path

    # Make sure we're in the backend directory
    backend_dir = Path(__file__).parent
    sys.path.insert(0, str(backend_dir))

    # Import fresh
    from api.routes import app

    print(f"[Server] Loaded app with {len(app.routes)} routes")

    # Verify inbox route
    inbox_routes = [r for r in app.routes if hasattr(r, 'path') and 'inbox' in r.path]
    if inbox_routes:
        print("[Server] [OK] Inbox route registered")
    else:
        print("[Server] [WARN] Inbox route NOT found!")
        for r in app.routes:
            if hasattr(r, 'path') and 'agents' in r.path:
                print(f"         {r.path}")

    print("[Server] Starting uvicorn on port 8002...")
    uvicorn.run(app, host="0.0.0.0", port=8002)
