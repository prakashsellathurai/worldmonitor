@echo off
echo ==========================================
echo Setting up CrewAI Environment...
echo ==========================================

REM Check if python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH. Please install Python 3.10+ from python.org.
    pause
    exit /b
)

echo Creating virtual environment (.venv)...
python -m venv .venv

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt

echo ==========================================
echo Setup complete!
echo You can now run the crew with: run_crew.bat
echo ==========================================
pause
