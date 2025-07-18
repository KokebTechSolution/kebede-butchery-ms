@echo off
REM Start Django backend
cd backend
start cmd /k "python manage.py runserver"
cd ..

REM Start React frontend
cd frontend
start cmd /k "npm start"
cd ..