@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

cls
echo.
echo ================================================================================
echo                  AERIUM - Air Quality Monitoring Platform
echo ================================================================================
echo.
echo [INFO] Starting Aerium Air Quality Monitoring Platform...
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python 3.9+ from python.org
    pause
    exit /b 1
)
for /f "tokens=*" %%A in ('python --version 2^>^&1') do set "PYTHON_VERSION=%%A"
echo [OK] %PYTHON_VERSION%

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ from nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%A in ('node --version 2^>^&1') do set "NODE_VERSION=%%A"
echo [OK] Node.js %NODE_VERSION%
echo.

REM ========== BACKEND ==========
echo [INIT] Starting Flask backend...
cd /d "%~dp0backend"

if not exist "venv" (
    echo [INFO] Creating virtual environment...
    python -m venv venv || (
        echo [ERROR] Failed to create venv
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
)

set "PYTHON=%cd%\venv\Scripts\python.exe"

echo [INFO] Installing Python packages...
"%PYTHON%" -m pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Package installation failed
    pause
    exit /b 1
)

if not exist "aerium.db" (
    echo [INFO] Creating database...
    "%PYTHON%" seed_database.py >nul 2>&1
)

echo [START] Launching backend...

REM SOLUTION 1: Run in separate minimized window (cleanest)
start "Aerium Backend" /MIN "%PYTHON%" app.py

REM SOLUTION 2: If you really need it in background, use this instead:
REM cmd /c "start /B "" "%PYTHON%" app.py >nul 2>&1"

timeout /t 5 /nobreak >nul

REM ========== FRONTEND ==========
cd /d "%~dp0"

if not exist "node_modules" (
    echo [INFO] Installing npm packages...
    call npm install --silent >nul 2>&1
)

echo [START] Launching frontend...

REM Frontend in separate minimized window too, or keep /B if you want to see Vite output
start "Aerium Frontend" /MIN npm run dev

timeout /t 3 /nobreak >nul

REM ========== DONE ==========
cls
echo.
echo ================================================================================
echo                        AERIUM IS NOW RUNNING!
echo ================================================================================
echo.
echo  Frontend:  http://localhost:5173
echo  Backend:   http://localhost:5000
echo  WebSocket: ws://localhost:5000
echo.
echo  [Press any key to stop all services]
echo.
pause >nul

REM Cleanup: Kill by window title (cleaner than killing all python/node)
taskkill /F /FI "WINDOWTITLE eq Aerium Backend" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Aerium Frontend" >nul 2>&1
echo [INFO] Services stopped.