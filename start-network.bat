@echo off
echo 🌐 Starting LOCAL NETWORK Environment...
echo.

REM Start Django Backend (Network Mode)
echo 📦 Starting Django Backend (Network Mode)...
cd backend
start /B python manage.py runserver 0.0.0.0:8000
cd ..

REM Give backend a moment to start
timeout /t 3 /nobreak >nul

REM Start React Frontend (Network Mode)
echo.
echo ⚛️ Starting React Frontend (Network Mode)...
cd frontend
set REACT_APP_API_URL=http://192.168.1.4:8000
set NODE_ENV=development
set HOST=0.0.0.0
start /B npm start
cd ..

echo.
echo ✅ Network servers started!
echo.
echo 🌐 Backend: http://192.168.1.8:8000
echo 🌐 Frontend: http://192.168.1.8:3000
echo.
echo 📱 Access from other devices on your WiFi:
echo    - Phone/Tablet: http://192.168.1.8:3000
echo    - Other computers: http://192.168.1.8:3000
echo.
echo Press Ctrl+C to stop both servers.

REM Wait indefinitely until user presses Ctrl+C
:loop
timeout /t 5 >nul
goto loop
