@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: Configuration
set "BACKEND_PORT=5000"
set "FRONTEND_PORT=5173"
set "BACKEND_TIMEOUT=30"
set "FRONTEND_TIMEOUT=30"
set "VERBOSE="

:: Parse arguments
if "%1"=="-v" set "VERBOSE=1" & echo [VERBOSE] Mode activé
if "%1"=="--verbose" set "VERBOSE=1" & echo [VERBOSE] Mode activé

cls
echo.
echo ================================================================================
echo                                    AERIUM
echo ================================================================================
echo.
echo [INFO] Lancement d'Aerium...
echo.

REM ========== VALIDATION ==========
if not exist "backend" (
    echo [ERROR] Répertoire 'backend' introuvable. Exécutez ce script depuis la racine du projet.
    pause
    exit /b 1
)

REM ========== CHECK DEPENDENCIES ==========
call :check_command python "Python 3.9+" "https://python.org"
call :check_command node "Node.js 18+" "https://nodejs.org"

REM ========== FORCE CLEANUP ANY EXISTING ==========
echo.
echo [INFO] Nettoyage des processus existants...
call :force_cleanup
timeout /t 3 /nobreak >nul

REM ========== CHECK PORTS ==========
call :check_port %BACKEND_PORT% "Backend"
call :check_port %FRONTEND_PORT% "Frontend"

REM ========== BACKEND ==========
echo.
echo [INIT] Démarrage du backend Flask...
cd /d "%~dp0backend"

if not exist "venv" (
    echo [INFO] Création de l'environnement virtuel...
    python -m venv venv || (
        echo [ERROR] Échec de la création de l'environnement virtuel
        pause
        exit /b 1
    )
    echo [OK] Environnement virtuel créé
)

set "PYTHON=%cd%\venv\Scripts\python.exe"

:: Toujours synchroniser les dépendances pour éviter les modules manquants après une mise à jour requirements.txt
echo [INFO] Synchronisation des paquets Python...
if defined VERBOSE (
    "%PYTHON%" -m pip install -r requirements.txt
) else (
    "%PYTHON%" -m pip install -r requirements.txt >nul 2>&1
)
if errorlevel 1 (
    echo [ERROR] Échec de l'installation des paquets Python
    pause
    exit /b 1
)
echo [OK] Dépendances Python synchronisées

:: Database creation - FIXED LOGIC
if not exist "aerium.db" (
    echo [INFO] Création de la base de données...
    if defined VERBOSE (
        "%PYTHON%" seed_database.py
    ) else (
        "%PYTHON%" seed_database.py >nul 2>&1
    )
    :: Check if DB was created (seed_database.py starts server, so check file after)
    timeout /t 3 >nul
    if exist "aerium.db" (
        echo [OK] Base de données créée avec succès
    ) else (
        echo [WARN] La base de données n'a pas été créée - vérifiez seed_database.py
    )
) else (
    echo [OK] Base de données déjà existante
)

echo [START] Lancement du backend sur le port %BACKEND_PORT%...

if defined VERBOSE (
    start "Aerium Backend" cmd /c "%PYTHON% app.py"
) else (
    start "Aerium Backend" /MIN cmd /c "%PYTHON% app.py"
)

call :wait_for_backend %BACKEND_TIMEOUT% || (
    echo [ERROR] Le backend n'a pas démarré dans le délai imparti %BACKEND_TIMEOUT%s
    call :force_cleanup
    pause
    exit /b 1
)

REM ========== FRONTEND ==========
cd /d "%~dp0"

if not exist "node_modules" (
    echo [INFO] Installation des paquets npm...
    if defined VERBOSE (
        call npm install
    ) else (
        call npm install --silent
    )
    if errorlevel 1 (
        echo [ERROR] Échec de l'installation des paquets npm
        call :force_cleanup
        pause
        exit /b 1
    )
    echo [OK] Dépendances npm installées
) else (
    echo [OK] Dépendances npm déjà installées
)

echo [START] Lancement du frontend sur le port %FRONTEND_PORT%...

if defined VERBOSE (
    start "Aerium Frontend" cmd /c "npm run dev"
) else (
    start "Aerium Frontend" /MIN npm run dev
)

REM ========== WAIT FOR FRONTEND ==========
call :wait_for_frontend %FRONTEND_TIMEOUT% || (
    echo [WARN] Frontend pas fully ready, opening browser anyway...
)

REM ========== AUTO OPEN BROWSER ==========
call :launch_browser

REM ========== INTERACTIVE MENU ==========
:menu_loop
cls
echo.
echo ================================================================================
echo                        AERIUM EST EN FONCTIONNEMENT!
echo ================================================================================
echo.
echo  Frontend:  http://localhost:%FRONTEND_PORT%
echo  Backend:   http://localhost:%BACKEND_PORT%
echo  WebSocket: ws://localhost:%BACKEND_PORT%
echo.
echo ================================================================================
echo                              MENU
echo ================================================================================
echo.
echo   [1] Ouvrir dans le navigateur
echo   [2] Redémarrer les services
echo   [3] Arrêter tous les services
echo.
set /p "MENU_CHOICE=Votre choix (1-3): "

if "%MENU_CHOICE%"=="1" call :launch_browser & goto menu_loop
if "%MENU_CHOICE%"=="2" call :restart_services
if "%MENU_CHOICE%"=="3" goto shutdown

echo [ERROR] Choix invalide
timeout /t 1 >nul
goto menu_loop

:shutdown
call :force_cleanup
echo [INFO] Services arrêtés.
timeout /t 1 >nul
endlocal
exit /b 0

REM ========== FUNCTIONS ==========

:check_command
where %~1 >nul 2>&1
if errorlevel 1 (
    echo [ERROR] %~2 n'est pas installé. Veuillez l'installer depuis %~3
    pause
    exit /b 1
)
for /f "tokens=*" %%A in ('%~1 --version 2^>^&1') do echo [OK] %%A
exit /b 0

:check_port
netstat -ano | findstr ":%~1.*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [ERROR] Port %~1 est toujours utilisé. Vérifiez manuellement avec: netstat -ano | findstr ":%~1"
    pause
    exit /b 1
)
echo [OK] Port %~1 disponible
exit /b 0

:force_cleanup
echo [INFO] Arrêt forcé de tous les services Aerium...
taskkill /F /FI "WINDOWTITLE eq Aerium Backend" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Aerium Frontend" >nul 2>&1
for /f "tokens=5" %%A in ('netstat -ano 2^>nul ^| findstr ":%BACKEND_PORT%.*LISTENING"') do (
    taskkill /PID %%A /F >nul 2>&1
)
for /f "tokens=5" %%A in ('netstat -ano 2^>nul ^| findstr ":%FRONTEND_PORT%.*LISTENING"') do (
    taskkill /PID %%A /F >nul 2>&1
)
set "attempt=0"
:cleanup_wait
timeout /t 1 /nobreak >nul
set /a attempt+=1
netstat -ano | findstr ":%BACKEND_PORT%.*LISTENING\|:%FRONTEND_PORT%.*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [OK] Tous les ports libérés
    exit /b 0
)
if %attempt% lss 10 goto cleanup_wait
echo [ERROR] Impossible de libérer les ports
exit /b 1

:wait_for_backend
set "max_attempts=%~1"
set "attempt=0"
:wait_loop
timeout /t 1 /nobreak >nul
set /a attempt+=1
curl -s http://localhost:%BACKEND_PORT%/ >nul 2>&1 && exit /b 0
if %attempt% geq %max_attempts% exit /b 1
goto wait_loop

:wait_for_frontend
set "max_attempts=%~1"
set "attempt=0"
:frontend_wait_loop
timeout /t 1 /nobreak >nul
set /a attempt+=1
curl -s http://localhost:%FRONTEND_PORT%/ >nul 2>&1 && exit /b 0
if %attempt% geq %max_attempts% exit /b 1
goto frontend_wait_loop

:launch_browser
echo [INFO] Ouverture du navigateur...
start "" "http://localhost:%FRONTEND_PORT%"
exit /b 0

:restart_services
echo.
echo [INFO] Redémarrage des services...
call :force_cleanup
timeout /t 3 >nul
start "" "%~f0" %*
exit /b 0