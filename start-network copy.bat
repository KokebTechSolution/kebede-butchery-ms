@echo off
echo 🌐 Starting LOCAL NETWORK Environment...
echo.

REM === Activate Python virtual environment ===
echo 🔧 Activating virtual environment...
call D:\Kokeb\kebede-butchery-ms\.venv\Scripts\activate.bat

REM === Start Django Backend ===
echo 📦 Starting Django Backend...
cd /d D:\Kokeb\kebede-butchery-ms\backend
start "Django Server" cmd /k "call ..\.venv\Scripts\activate.bat && python manage.py runserver 0.0.0.0:8000"

REM === Wait briefly ===
timeout /t 3 /nobreak >nul

REM === Start React Frontend ===
echo ⚛️ Starting React Frontend...
cd /d D:\Kokeb\kebede-butchery-ms\frontend
set REACT_APP_API_URL=http://192.168.1.2:8000
set NODE_ENV=development
set HOST=0.0.0.0
start /B npm start

echo ✅ Servers started!
