@echo off
echo 🌐 Testing Network Setup...
echo.

echo 📡 Testing Backend API...
curl -X GET http://192.168.1.2:8000/api/users/csrf/ -H "Content-Type: application/json" -v

echo.
echo 📡 Testing Frontend...
curl -X GET http://192.168.1.2:3000 -I

echo.
echo ✅ Network test completed!
echo.
pause 