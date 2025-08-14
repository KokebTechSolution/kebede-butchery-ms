#!/bin/bash

# Stop Script for Kebede Butchery MS
# Stops both Django backend and React frontend

echo "🛑 Stopping Kebede Butchery Management System..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop Django backend
echo -e "${YELLOW}🔄 Stopping Django backend...${NC}"
pkill -f "python manage.py runserver" 2>/dev/null

# Stop React frontend
echo -e "${YELLOW}🔄 Stopping React frontend...${NC}"
pkill -f "npm start" 2>/dev/null

# Wait a moment
sleep 2

# Check if processes are still running
if pgrep -f "python manage.py runserver" > /dev/null; then
    echo -e "${YELLOW}🔄 Force stopping Django...${NC}"
    pkill -9 -f "python manage.py runserver" 2>/dev/null
fi

if pgrep -f "npm start" > /dev/null; then
    echo -e "${YELLOW}🔄 Force stopping React...${NC}"
    pkill -9 -f "npm start" 2>/dev/null
fi

# Check ports
echo -e "${YELLOW}🔍 Checking ports...${NC}"
if ss -tlnp | grep -q ":8000 "; then
    echo -e "${YELLOW}⚠️  Port 8000 still in use${NC}"
else
    echo -e "${GREEN}✅ Port 8000 (Backend) - Free${NC}"
fi

if ss -tlnp | grep -q ":3000 "; then
    echo -e "${YELLOW}⚠️  Port 3000 still in use${NC}"
else
    echo -e "${GREEN}✅ Port 3000 (Frontend) - Free${NC}"
fi

echo ""
echo -e "${GREEN}✅ All servers stopped!${NC}"
echo "You can now run ./start-app.sh or ./quick-start.sh to restart" 