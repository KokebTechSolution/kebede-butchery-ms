#!/bin/bash

echo "🌐 Starting LOCAL NETWORK Environment..."
echo

# Set environment variables for better session handling
export DJANGO_SETTINGS_MODULE=kebede_pos.settings
export DJANGO_DEBUG=True
export DJANGO_ALLOWED_HOSTS="192.168.1.8,192.168.100.122,localhost,127.0.0.1"

echo "📦 Starting Django Backend (Network Mode) in new terminal..."
cd backend
gnome-terminal --title="Django Backend" -- bash -c "source ../.venv/bin/activate && export DJANGO_SETTINGS_MODULE=kebede_pos.settings && export DJANGO_DEBUG=True && export DJANGO_ALLOWED_HOSTS='192.168.1.8,192.168.100.122,localhost,127.0.0.1' && python3 manage.py runserver 0.0.0.0:8000; exec bash" &
cd ..

echo
echo "⚛️ Starting React Frontend (Network Mode) in new terminal..."
cd frontend
# Set environment variables for both local and network access
export REACT_APP_API_URL=http://192.168.100.122:8000
export REACT_APP_ENABLE_NETWORK_ACCESS=true
export NODE_ENV=development
export HOST=0.0.0.0
export REACT_APP_ENABLE_SESSION_PERSISTENCE=true
gnome-terminal --title="React Frontend" -- bash -c "npm start; exec bash" &
cd ..

echo
echo "✅ Network servers started in separate terminals!"
echo
echo "🌐 Backend: http://192.168.1.8:8000"
echo "🌐 Frontend: http://192.168.1.8:3000"
echo
echo "📱 Access from other devices on your WiFi:"
echo "   - Phone/Tablet: http://192.168.1.8:3000"
echo "   - Other computers: http://192.168.1.8:3000"
echo
echo "🏠 Local access also available:"
echo "   - Backend: http://localhost:8000"
echo "   - Frontend: http://localhost:3000"
echo
echo "💡 Each service is running in its own terminal window"
echo "   Close the terminal windows to stop the servers"
echo
echo "🔐 Session persistence enabled for both local and network access" 