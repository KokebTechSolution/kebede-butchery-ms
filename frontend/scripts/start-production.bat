@echo off
echo Starting frontend with PRODUCTION backend (https://kebede-butchery-ms.onrender.com)
echo.

REM Set environment variables for production
set REACT_APP_API_URL=https://kebede-butchery-ms.onrender.com
set NODE_ENV=production

REM Start the React development server
npm start 