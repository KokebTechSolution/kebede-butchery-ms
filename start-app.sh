#!/bin/bash

# Kebede Butchery MS - Complete Startup Script
# This script starts both Django backend and React frontend

echo "🚀 Starting Kebede Butchery Management System..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if ss -tlnp | grep -q ":$1 "; then
        return 0
    else
        return 1
    fi
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local pids=$(ss -tlnp | grep ":$port " | awk '{print $7}' | sed 's/.*pid=\([0-9]*\).*/\1/' | sort -u)
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}🔄 Stopping processes on port $port...${NC}"
        echo "$pids" | xargs -r kill -9
        sleep 2
    fi
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}🐍 Starting Django Backend...${NC}"
    
    # Check if virtual environment exists
    if [ ! -d ".venv" ]; then
        echo -e "${RED}❌ Virtual environment not found. Please run: python3 -m venv .venv${NC}"
        exit 1
    fi
    
    # Activate virtual environment and start backend
    cd backend
    source ../.venv/bin/activate
    
    # Check if Django is installed
    if ! python -c "import django" 2>/dev/null; then
        echo -e "${YELLOW}📦 Installing Django dependencies...${NC}"
        pip install -r ../requirements.txt
    fi
    
    # Start Django server
    echo -e "${GREEN}✅ Starting Django on http://localhost:8000${NC}"
    echo -e "${GREEN}✅ Network access: http://192.168.1.8:8000${NC}"
    python manage.py runserver 0.0.0.0:8000 &
    BACKEND_PID=$!
    cd ..
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}⚛️  Starting React Frontend...${NC}"
    
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Set environment variables
    export REACT_APP_API_URL=http://localhost:8000
    export NODE_ENV=development
    export HOST=0.0.0.0
    
    # Start React development server
    echo -e "${GREEN}✅ Starting React on http://localhost:3000${NC}"
    echo -e "${GREEN}✅ Network access: http://192.168.1.8:3000${NC}"
    npm start &
    FRONTEND_PID=$!
    cd ..
}

# Function to show status
show_status() {
    echo ""
    echo -e "${GREEN}🎉 Application Status:${NC}"
    echo "================================================"
    
    if check_port 8000; then
        echo -e "${GREEN}✅ Backend (Django): http://localhost:8000${NC}"
        echo -e "${GREEN}✅ Backend (Network): http://192.168.1.8:8000${NC}"
    else
        echo -e "${RED}❌ Backend: Not running${NC}"
    fi
    
    if check_port 3000; then
        echo -e "${GREEN}✅ Frontend (React): http://localhost:3000${NC}"
        echo -e "${GREEN}✅ Frontend (Network): http://192.168.1.8:3000${NC}"
    else
        echo -e "${RED}❌ Frontend: Not running${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}🔑 Login Credentials:${NC}"
    echo "Username: waiter_user1"
    echo "Password: testpass123"
    echo ""
    echo -e "${YELLOW}📱 Network Access:${NC}"
    echo "Other devices can access: http://192.168.1.8:3000"
    echo ""
    echo -e "${BLUE}💡 To stop the servers, press Ctrl+C${NC}"
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping servers...${NC}"
    kill_port 8000
    kill_port 3000
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
echo -e "${YELLOW}🔄 Checking for existing processes...${NC}"

# Kill existing processes on our ports
kill_port 8000
kill_port 3000

# Wait a moment for processes to stop
sleep 1

# Start backend
start_backend

# Wait for backend to start
sleep 3

# Start frontend
start_frontend

# Wait for frontend to start
sleep 5

# Show status
show_status

# Keep script running and show logs
echo -e "${BLUE}📊 Monitoring servers... (Press Ctrl+C to stop)${NC}"
echo "================================================"

# Wait for background processes
wait $BACKEND_PID $FRONTEND_PID 