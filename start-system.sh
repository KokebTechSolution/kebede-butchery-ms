#!/bin/bash

# Kebede Butchery Management System - Complete Startup Script
# This script starts both backend and frontend with proper network configuration

echo "🍖 Starting Kebede Butchery Management System..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "backend/manage.py" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Function to get network IP
get_network_ip() {
    # Try to get the primary network interface IP
    local ip=$(ip route get 1.1.1.1 | awk '{print $7}' | head -n1)
    if [ -z "$ip" ] || [ "$ip" = "dev" ]; then
        # Fallback to hostname -I
        ip=$(hostname -I | awk '{print $1}')
    fi
    echo "$ip"
}

# Get current network IP
NETWORK_IP=$(get_network_ip)
print_status "Detected network IP: $NETWORK_IP"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    print_warning "Virtual environment not found. Creating one..."
    python3 -m venv .venv
    print_success "Virtual environment created"
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source .venv/bin/activate

# Install/update Python dependencies
print_status "Checking Python dependencies..."
cd backend
pip install -r ../requirements.txt > /dev/null 2>&1
cd ..

# Check if Django server is already running
if pgrep -f "manage.py runserver" > /dev/null; then
    print_warning "Django server is already running. Stopping it..."
    pkill -f "manage.py runserver"
    sleep 2
fi

# Check if React is already running
if pgrep -f "react-scripts" > /dev/null; then
    print_warning "React server is already running. Stopping it..."
    pkill -f "react-scripts"
    sleep 2
fi

# Start Django backend server
print_status "Starting Django backend server..."
cd backend

# Set environment variables for Django
export DJANGO_SETTINGS_MODULE=kebede_pos.settings
export DJANGO_DEBUG=True
export DJANGO_ALLOWED_HOSTS="localhost,127.0.0.1,$NETWORK_IP,192.168.1.6"

# Start Django server in background
nohup python manage.py runserver 0.0.0.0:8000 > ../backend.log 2>&1 &
DJANGO_PID=$!

# Wait a moment for Django to start
sleep 3

# Check if Django started successfully
if curl -s http://localhost:8000/api/ > /dev/null; then
    print_success "Django backend started successfully on port 8000"
    print_status "Backend accessible at:"
    echo "  - Local: http://localhost:8000"
    echo "  - Network: http://$NETWORK_IP:8000"
    echo "  - Specific: http://192.168.1.6:8000"
else
    print_error "Failed to start Django backend"
    exit 1
fi

cd ..

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    print_warning "Frontend dependencies not found. Installing..."
    cd frontend
    npm install
    cd ..
fi

# Start React frontend
print_status "Starting React frontend..."
cd frontend

# Set environment variables for React
export REACT_APP_API_URL=""
export REACT_APP_ENABLE_NETWORK_ACCESS=true

# Start React development server
nohup npm start > ../frontend.log 2>&1 &
REACT_PID=$!

cd ..

# Wait for frontend to start
print_status "Waiting for frontend to start..."
sleep 10

# Check if frontend is accessible
if curl -s http://localhost:3000 > /dev/null; then
    print_success "React frontend started successfully on port 3000"
    print_status "Frontend accessible at:"
    echo "  - Local: http://localhost:3000"
    echo "  - Network: http://$NETWORK_IP:3000"
    echo "  - Specific: http://192.168.1.6:3000"
else
    print_warning "Frontend may still be starting up..."
fi

# Create a test user if needed
print_status "Setting up test user credentials..."
cd backend
source ../.venv/bin/activate

# Check if waiter_user1 exists and set password
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
try:
    user = User.objects.get(username='waiter_user1')
    if user.check_password('waiter123'):
        print('✅ Test user waiter_user1 is ready (password: waiter123)')
    else:
        user.set_password('waiter123')
        user.save()
        print('✅ Test user waiter_user1 password updated (password: waiter123)')
except User.DoesNotExist:
    print('❌ Test user waiter_user1 not found')
" 2>/dev/null

cd ..

# Save PIDs for later use
echo $DJANGO_PID > .django.pid
echo $REACT_PID > .react.pid

echo ""
echo "================================================"
print_success "System startup complete!"
echo ""
echo "🌐 Backend API:"
echo "   - Local: http://localhost:8000"
echo "   - Network: http://$NETWORK_IP:8000"
echo "   - Specific: http://192.168.1.6:8000"
echo ""
echo "🎨 Frontend Application:"
echo "   - Local: http://localhost:3000"
echo "   - Network: http://$NETWORK_IP:3000"
echo "   - Specific: http://192.168.1.6:3000"
echo ""
echo "🔑 Test Login:"
echo "   Username: waiter_user1"
echo "   Password: waiter123"
echo ""
echo "📋 To stop the system, run: ./stop-system.sh"
echo "🧪 To test the system, run: ./test-api.sh"
echo ""
print_success "Kebede Butchery Management System is now running! 🍖✨"
