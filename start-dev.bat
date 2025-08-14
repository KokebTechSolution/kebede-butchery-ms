@echo off
echo 🚀 Starting Development Environment...
echo.

echo 📦 Starting Django Backend...
cd backend
start "Django Backend" cmd /k "python manage.py runserver"
cd ..

echo.
echo ⚛️ Starting React Frontend...
cd frontend
start "React Frontend" cmd /k "start-local.bat"
cd ..

echo.
echo ✅ Development servers started!
echo.
echo 🌐 Backend: http://localhost:8000
echo 🌐 Frontend: http://localhost:3000
echo.
echo 📝 Open http://localhost:3000 in your browser
echo.
pause 