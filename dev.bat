@echo off
:: ============================================================
::  AQD - Saudi Contract Analyzer
::  Double-click this file OR run from aqd\ folder
:: ============================================================
setlocal EnableDelayedExpansion
title AQD - Saudi Contract Analyzer

echo.
echo  ============================================
echo   AQD - Saudi Contract Analyzer
echo  ============================================
echo.

:: ── Check .env ──────────────────────────────────────────────
if not exist ".env" (
    echo [SETUP] .env not found. Copying from .env.example...
    copy ".env.example" ".env" >nul
    echo.
    echo [ACTION REQUIRED]
    echo   1. Open .env in this folder
    echo   2. Replace  sk-your-openai-api-key-here
    echo      with your real key from https://platform.openai.com/api-keys
    echo   3. Save and re-run this file
    echo.
    start notepad .env
    pause
    exit /b 1
)

:: Read OPENAI_API_KEY from .env
set "AQD_API_KEY="
for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    if /i "%%a"=="OPENAI_API_KEY" set "AQD_API_KEY=%%b"
)
if "%AQD_API_KEY%"=="" (
    echo [ERROR] OPENAI_API_KEY not set in .env
    echo         Edit .env and add your key from https://platform.openai.com/api-keys
    pause & exit /b 1
)
if "%AQD_API_KEY%"=="sk-your-openai-api-key-here" (
    echo [ERROR] Still using the placeholder API key in .env
    echo         Replace it with your real key from https://platform.openai.com/api-keys
    pause & exit /b 1
)
echo [OK] API key found

:: ── Check Python ────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found.
    echo         Download from https://python.org
    echo         IMPORTANT: Check "Add Python to PATH" during install
    pause & exit /b 1
)
echo [OK] Python found

:: ── Check Node ──────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found.
    echo         Download from https://nodejs.org  (use LTS version)
    pause & exit /b 1
)
echo [OK] Node.js found

:: ── Backend: create venv if missing ─────────────────────────
echo.
echo [1/4] Setting up Python environment...
cd backend

if not exist "venv\Scripts\python.exe" (
    echo      Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause & exit /b 1
    )
    echo      Virtual environment created.
)
echo [OK] Python venv ready

:: ── Backend: install packages ────────────────────────────────
echo.
echo [2/4] Installing Python packages (first run takes ~2 minutes)...
venv\Scripts\pip.exe install -r requirements.txt --quiet
if errorlevel 1 (
    echo [ERROR] pip install failed. Check your internet connection.
    pause & exit /b 1
)
echo [OK] Python packages installed

:: ── Backend: migrate ─────────────────────────────────────────
echo.
echo [3/4] Setting up database...
set USE_SQLITE=True
set OPENAI_API_KEY=%AQD_API_KEY%
venv\Scripts\python.exe manage.py migrate --noinput
if errorlevel 1 (
    echo [ERROR] Database migration failed
    pause & exit /b 1
)
echo [OK] Database ready

cd ..

:: ── Frontend: install packages ───────────────────────────────
echo.
echo [4/4] Installing frontend packages (first run takes ~2 minutes)...
cd frontend

if not exist "node_modules\react\index.js" (
    echo      Running npm install...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo [ERROR] npm install failed. Check your internet connection.
        pause & exit /b 1
    )
)
echo [OK] Frontend packages ready

:: Write env files
echo REACT_APP_API_URL=http://localhost:8000/api> .env.local
echo BROWSER=none>> .env.local

cd ..

:: ── Launch servers ───────────────────────────────────────────
echo.
echo Starting servers...
echo.

start "AQD Backend - Django :8000" cmd /k "cd /d %~dp0backend && set USE_SQLITE=True && set OPENAI_API_KEY=%AQD_API_KEY% && venv\Scripts\python.exe manage.py runserver"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

start "AQD Frontend - React :3000" cmd /k "cd /d %~dp0frontend && set REACT_APP_API_URL=http://localhost:8000/api && npm start"

echo Waiting for frontend to start...
timeout /t 8 /nobreak >nul

start http://localhost:3000

echo.
echo  ============================================
echo   Both servers are starting in new windows!
echo.
echo   App:    http://localhost:3000
echo   API:    http://localhost:8000/api
echo   Admin:  http://localhost:8000/admin
echo.
echo   To STOP: close the two server windows
echo  ============================================
echo.
pause
