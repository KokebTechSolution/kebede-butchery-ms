@echo off
echo Starting React Frontend on Network...
echo Frontend will be available at: http://192.168.1.2:3000
echo Backend API: http://192.168.1.2:8000
echo.
set REACT_APP_API_URL=http://192.168.1.2:8000
set NODE_ENV=development
npm start 