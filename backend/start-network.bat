@echo off
echo Starting Django Backend on Network...
echo Backend will be available at: http://192.168.1.2:8000
echo.
python manage.py runserver 0.0.0.0:8000 