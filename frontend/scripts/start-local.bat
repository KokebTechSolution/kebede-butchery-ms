@echo off
echo Starting frontend with LOCAL backend (http://localhost:8000)
echo Make sure your Django backend is running on port 8000
echo.

REM Set environment variables for local development
set REACT_APP_API_URL=http://localhost:8000
set NODE_ENV=development

REM Start the React development server
npm start 