#!/bin/bash

# Quick Start Script for Kebede Butchery MS
# Simple version for quick testing

echo "🚀 Quick Start - Kebede Butchery MS"
echo "===================================="

# Kill existing processes
echo "🔄 Stopping existing servers..."
pkill -f "python manage.py runserver" 2>/dev/null
pkill -f "npm start" 2>/dev/null
sleep 2

# Start backend
echo "🐍 Starting Django backend..."
cd backend
source ../.venv/bin/activate
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Start frontend
echo "⚛️  Starting React frontend..."
cd frontend
export REACT_APP_API_URL=http://localhost:8000
export NODE_ENV=development
export HOST=0.0.0.0
npm start &
FRONTEND_PID=$!
cd ..

# Show status
echo ""
echo "🎉 Application Started!"
echo "======================"
echo "✅ Backend:  http://localhost:8000"
echo "✅ Frontend: http://localhost:3000"
echo "✅ Network:  http://192.168.1.8:3000"
echo ""
echo "🔑 Login: waiter_user1 / testpass123"
echo ""
echo "💡 Press Ctrl+C to stop both servers"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID 