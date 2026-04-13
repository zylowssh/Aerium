#!/bin/bash

clear
echo ""
echo "================================================================================"
echo "                  AERIUM - Air Quality Monitoring Platform"
echo "================================================================================"
echo ""
echo "[INFO] Starting Aerium Air Quality Monitoring Platform..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1)
echo "[OK] $PYTHON_VERSION detected"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node --version 2>&1)
echo "[OK] Node.js $NODE_VERSION detected"
echo ""

# Start backend
echo "[INIT] Initializing Flask backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "[INFO] Creating Python virtual environment..."
    python3 -m venv venv
    echo "[OK] Virtual environment created"
fi

source venv/bin/activate
echo "[OK] Virtual environment activated"

if [ ! -f ".env" ]; then
    echo "[WARN] No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "[OK] .env file created"
fi

echo "[INFO] Installing dependencies..."
pip install -r requirements.txt > /dev/null 2>&1
echo "[OK] Dependencies installed"

# Check if database needs seeding
if [ ! -f "aerium.db" ]; then
    echo "[INFO] Seeding database with demo data..."
    python seed_database.py > /dev/null 2>&1
    echo "[OK] Database seeded successfully"
else
    echo "[OK] Database found"
fi

echo "[START] Starting Flask backend server..."
python app.py &
BACKEND_PID=$!
echo "[OK] Backend started on http://localhost:5000 (PID: $BACKEND_PID)"

cd ..

# Start frontend
echo ""
echo "[INIT] Initializing React frontend..."

if [ ! -f ".env" ]; then
    echo "[WARN] No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "[OK] .env file created"
fi

if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing Node.js dependencies (this may take a moment)..."
    npm install > /dev/null 2>&1
    echo "[OK] Dependencies installed"
fi

echo "[START] Starting React development server..."
npm run dev &
FRONTEND_PID=$!
echo "[OK] Frontend started on http://localhost:8080 (PID: $FRONTEND_PID)"

echo ""
echo "================================================================================"
echo "                        AERIUM IS NOW RUNNING!"
echo "================================================================================"
echo ""
echo "[SERVICES]"
echo "  Frontend (React):   http://localhost:8080"
echo "  Backend API (Flask): http://localhost:5000"
echo "  WebSocket:          ws://localhost:5000"
echo ""
echo "[NEXT STEPS]"
echo "  1. Open http://localhost:8080 in your browser"
echo "  2. Sign up or log in with demo credentials"
echo "  3. Start monitoring air quality in real-time!"
echo ""
echo "[INFO] Press Ctrl+C to stop all services"
echo ""
echo "================================================================================"
echo ""

# Trap Ctrl+C and kill both processes
trap "echo ''; echo '[STOP] Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

wait
