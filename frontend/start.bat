@echo off
echo Starting Ocean AI Frontend...
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

REM Check if .env exists
if not exist .env (
    echo Error: .env file not found!
    echo Please copy .env.example to .env
    pause
    exit /b 1
)

REM Start the development server
echo.
echo Starting React development server...
npm start
