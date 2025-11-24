@echo off
echo Starting Ocean AI Backend...
echo.

REM Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Check if .env exists
if not exist .env (
    echo Error: .env file not found!
    echo Please copy .env.example to .env and configure it.
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Initialize database
echo.
echo Initializing database...
python init_db.py

REM Start the server
echo.
echo Starting Flask server...
python app.py
