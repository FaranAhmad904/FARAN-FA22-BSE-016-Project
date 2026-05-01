@echo off
echo Starting DineMate AI Recommendation Service...
echo.

REM Change to the script directory
cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not found in PATH
    echo Please ensure Python is installed and added to PATH
    pause
    exit /b 1
)

REM Check if pymongo is installed
python -c "import pymongo" >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    python -m pip install pymongo python-dotenv
    if errorlevel 1 (
        echo ERROR: Failed to install required packages
        pause
        exit /b 1
    )
)

REM Start the service
echo Starting Flask service...
python app.py

pause

