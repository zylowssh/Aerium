@echo off
echo ============================================================
echo Starting Aerium Server
echo ============================================================
echo.
echo Server will be accessible at:
echo   - Local:    http://localhost:5000
echo   - Network:  http://[YOUR-IP]:5000
echo.
echo Press Ctrl+C to stop the server
echo ============================================================
echo.

cd site
python app.py
