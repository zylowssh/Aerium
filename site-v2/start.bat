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
cd /d "%~dp0backend" || (
    echo [ERROR] Backend directory not found
    pause
    exit /b 1
)

if not exist "venv" (
    echo [INFO] Creating virtual environment...
    python -m venv venv || (
        echo [ERROR] Failed to create venv
        pause
        exit /b 1
    )
)

set "PYTHON=%cd%\venv\Scripts\python.exe"
set "PIP=%cd%\venv\Scripts\pip.exe"

echo [INFO] Installing Python packages...
"%PIP%" install -q -r requirements.txt 2>nul || "%PIP%" install -q --upgrade -r requirements.txt 2>nul

if not exist "aerium.db" (
    echo [INFO] Creating database...
    "%PYTHON%" seed_database.py >nul 2>&1
)

echo [START] Launching backend...
start "Aerium Backend" /B "%PYTHON%" app.py
timeout /t 3 /nobreak >nul

REM ========== FRONTEND ==========
cd /d "%~dp0"

if not exist "node_modules" (
    echo [INFO] Installing npm packages...
    call npm install --silent
)

echo [START] Launching frontend...
start "Aerium Frontend" /B npm run dev
timeout /t 3 /nobreak >nul

REM ========== DONE ==========
cls
echo.
echo ================================================================================
echo                        AERIUM IS NOW RUNNING!
echo ================================================================================
echo.
echo  Frontend:  http://localhost:8080
echo  Backend:   http://localhost:5000
echo  WebSocket: ws://localhost:5000
echo.
echo  [Press any key to stop all services]
echo.
pause >nul

REM Cleanup: Kill processes on exit
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo [INFO] Services stopped.