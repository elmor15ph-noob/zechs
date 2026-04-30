@echo off
cd /d %~dp0
echo DUO Bot Launcher
echo ================

REM Activate venv
if exist backend\venv\Scripts\activate.bat (
    call backend\venv\Scripts\activate.bat
) else if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo WARNING: No venv found, using system Python
)

REM Load .env files
if exist .env.channels (
    for /f "tokens=1,2 delims==" %%a in (.env.channels) do (
        if not "%%a"=="" if not "%%b"=="" set "%%a=%%b"
    )
)

echo Starting bots...
python backend\integrations\start_bots.py
pause
