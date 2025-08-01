@echo off
echo 🌐 Testing Network Login...
echo.

echo 📡 Testing Network Login Endpoint...
curl -X POST http://192.168.1.8:8000/api/users/network-login/ ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"manager_user1\",\"password\":\"manager123\"}" ^
  -v

echo.
echo ✅ Network login test completed!
echo.
pause 