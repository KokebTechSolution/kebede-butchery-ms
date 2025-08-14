@echo off
echo Starting frontend with NETWORK backend...
set REACT_APP_API_URL=http://192.168.100.122:8000
set NODE_ENV=development
set HOST=0.0.0.0
npm start 