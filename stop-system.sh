#!/bin/bash

# Kebede Butchery Management System - Stop Script

echo "🛑 Stopping Kebede Butchery Management System..."
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

# Stop Django backend
if pgrep -f "manage.py runserver" > /dev/null; then
    print_status "Stopping Django backend..."
    pkill -f "manage.py runserver"
    sleep 2
    
    # Force kill if still running
    if pgrep -f "manage.py runserver" > /dev/null; then
        print_warning "Force stopping Django backend..."
        pkill -9 -f "manage.py runserver"
    fi
    print_success "Django backend stopped"
else
    print_status "Django backend is not running"
fi

# Stop React frontend
if pgrep -f "react-scripts start" > /dev/null; then
    print_status "Stopping React frontend..."
    pkill -f "react-scripts start"
    sleep 2
    
    # Force kill if still running
    if pgrep -f "react-scripts start" > /dev/null; then
        print_warning "Force stopping React frontend..."
        pkill -9 -f "react-scripts start"
    fi
    print_success "React frontend stopped"
else
    print_status "React frontend is not running"
fi

# Stop any Node.js processes on port 3000
if lsof -ti:3000 > /dev/null 2>&1; then
    print_status "Stopping processes on port 3000..."
    lsof -ti:3000 | xargs kill -9
    print_success "Port 3000 cleared"
fi

# Stop any Python processes on port 8000
if lsof -ti:8000 > /dev/null 2>&1; then
    print_status "Stopping processes on port 8000..."
    lsof -ti:8000 | xargs kill -9
    print_success "Port 8000 cleared"
fi

# Remove PID files
if [ -f ".django.pid" ]; then
    rm .django.pid
fi

if [ -f ".react.pid" ]; then
    rm .react.pid
fi

echo ""
print_success "All services stopped successfully! 🛑"










