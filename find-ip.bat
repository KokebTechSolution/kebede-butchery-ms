@echo off
echo 🔍 Finding your computer's IP address...
echo.

ipconfig | findstr "IPv4"

echo.
echo 📝 Use the IP address above (usually starts with 192.168.x.x)
echo 📝 Update the config files if needed
echo.
pause 