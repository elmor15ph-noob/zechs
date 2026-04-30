#!/usr/bin/env python3
"""Restart the backend server."""
import os
import subprocess
import time
import signal

# Kill any existing Python processes
try:
    import psutil
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            if 'python' in proc.info['name'].lower() and any('main.py' in str(arg) for arg in (proc.info['cmdline'] or [])):
                print(f"Killing process {proc.info['pid']}: {proc.info['cmdline']}")
                proc.kill()
        except (psutil.NoSuchProcess, psutil.AccessDenied, TypeError):
            pass
except ImportError:
    print("psutil not available, trying alternative method...")
    os.system("taskkill /F /IM python.exe /T 2>nul || true")

time.sleep(2)

# Start the server
print("\nStarting backend server...")
os.chdir(os.path.dirname(__file__))
subprocess.Popen(['python', 'main.py'], stdout=open('backend.log', 'w'), stderr=subprocess.STDOUT)
time.sleep(5)

# Test it
print("Testing endpoint...")
os.system("curl -s http://localhost:8000/agents/health || echo 'Server not responding'")
