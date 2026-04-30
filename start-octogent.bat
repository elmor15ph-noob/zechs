@echo off
echo Starting OctoAgent + DUO Brain...
echo.

REM Start OctoAgent API (port 8787)
echo [1/2] Starting OctoAgent API on port 8787...
set OCTOGENT_API_PORT=8787
set OCTOGENT_WORKSPACE_CWD=%~dp0
start "OctoAgent API" cmd /k "cd /d %~dp0.octogent\apps\api && pnpm dev"

REM Wait for OctoAgent to start
timeout /t 3 /nobreak >nul

REM Start DUO Brain backend (port 8000)
echo [2/2] Starting DUO Brain backend on port 8000...
start "DUO Backend" cmd /k "cd /d %~dp0backend && set PYTHONUTF8=1 && python main.py"

echo.
echo Services starting:
echo   OctoAgent API  : http://localhost:8787
echo   DUO Brain API  : http://localhost:8000
echo   Frontend (dev) : http://localhost:3000
echo.
echo Run "npm start" in frontend/ to start the React dev server.
echo Press any key to exit this launcher...
pause >nul
