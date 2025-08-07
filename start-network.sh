#!/bin/bash

echo "🌐 Starting LOCAL NETWORK Environment..."
echo

echo "📦 Starting Django Backend (Network Mode)..."
cd backend
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd ..

echo
echo "⚛️ Starting React Frontend (Network Mode)..."
cd frontend
export REACT_APP_API_URL=http://10.240.69.22:8000
export NODE_ENV=development
export HOST=0.0.0.0
npm start &
FRONTEND_PID=$!
cd ..

echo
echo "✅ Network servers started!"
echo
echo "🌐 Backend: http://192.168.1.8:8000"
echo "🌐 Frontend: http://192.168.1.8:3000"
echo
echo "📱 Access from other devices on your WiFi:"
echo "   - Phone/Tablet: http://192.168.1.8:3000"
echo "   - Other computers: http://192.168.1.8:3000"
echo
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop the servers
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait 