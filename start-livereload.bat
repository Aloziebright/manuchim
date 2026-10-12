@echo off
REM LiveReload Server Launcher for v.real
REM This script installs dependencies and starts the livereload server

echo.
echo ====================================
echo   v.real LiveReload Server
echo ====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js found: 
node --version
echo.

REM Check if npm packages are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the server
echo ✓ Starting LiveReload Server...
echo.
echo ================================================
echo   Server: http://localhost:8000
echo   LiveReload Port: 35729
echo   
echo   Open your browser and go to:
echo   http://localhost:8000
echo ================================================
echo.

node livereload-server.js
