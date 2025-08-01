@echo off
echo 🌐 Starting LOCAL NETWORK Environment...
echo.

echo 📦 Starting Django Backend (Network Mode)...
cd backend
start "Django Backend Network" cmd /k "python manage.py runserver 0.0.0.0:8000"
cd ..

echo.
echo ⚛️ Starting React Frontend (Network Mode)...
cd frontend
start "React Frontend Network" cmd /k "start-network.bat"
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
pause 