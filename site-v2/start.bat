@echo off
REM Enable UTF-8 and delayed expansion
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

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python 3.9 or higher.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%A in ('python --version 2^>^&1') do set PYTHON_VERSION=%%A
echo [OK] Python detected: !PYTHON_VERSION!

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18 or higher.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%A in ('node --version 2^>^&1') do set NODE_VERSION=%%A
echo [OK] Node.js detected: !NODE_VERSION!
echo.

REM ========== BACKEND INITIALIZATION ==========
echo [INIT] Initializing Flask backend...
cd /d "%~dp0backend"

if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
    echo [OK] Virtual environment created
)

call venv\Scripts\activate.bat
echo [OK] Virtual environment activated

REM Setup .env file
if not exist ".env" (
    if exist ".env.example" (
        echo [WARN] No .env file found. Copying from .env.example...
        copy ".env.example" ".env" >nul 2>&1
        echo [OK] .env file created
    )
)

echo [INFO] Installing dependencies...
pip install -r requirements.txt >nul 2>&1
echo [OK] Dependencies installed

REM Check if database needs seeding
if exist "aerium.db" (
    echo [OK] Database found
) else (
    echo [INFO] Seeding database with demo data...
    python seed_database.py >nul 2>&1
    echo [OK] Database seeded successfully
)

echo [START] Starting Flask backend server...
start "Aerium Backend" /B python app.py
timeout /t 3 /nobreak >nul
echo [OK] Backend started on http://localhost:5000

REM ========== FRONTEND INITIALIZATION ==========
cd /d "%~dp0"
echo.
echo [INIT] Initializing React frontend...

REM Setup .env file
if not exist ".env" (
    if exist ".env.example" (
        echo [WARN] No .env file found. Copying from .env.example...
        copy ".env.example" ".env" >nul 2>&1
        echo [OK] .env file created
    )
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing Node.js dependencies - this may take a moment...
    call npm install >nul 2>&1
    echo [OK] Dependencies installed
)

echo [START] Starting React development server...
start "Aerium Frontend" /B npm run dev
timeout /t 3 /nobreak >nul
echo [OK] Frontend started on http://localhost:8080

REM ========== FINAL STATUS ==========
echo.
echo ================================================================================
echo                        AERIUM IS NOW RUNNING!
echo ================================================================================
echo.
echo [SERVICES]
echo   Frontend (React):   http://localhost:8080
echo   Backend API (Flask): http://localhost:5000
echo   WebSocket:          ws://localhost:5000
echo.
echo [NEXT STEPS]
echo   1. Open http://localhost:8080 in your browser
echo   2. Sign up or log in with demo credentials
echo   3. Start monitoring air quality in real-time!
echo.
echo [INFO] Press Ctrl+C in each window to stop services
echo.
echo ================================================================================
echo.

pause
