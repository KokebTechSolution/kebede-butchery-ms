#!/bin/bash

echo "🔍 Debugging Session Issues Step by Step"
echo "========================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Check if Django backend is running${NC}"
echo "Testing: http://localhost:8000/api/users/health/"
curl -s http://localhost:8000/api/users/health/ | head -1
echo

echo -e "${BLUE}Step 2: Test CSRF endpoint${NC}"
echo "Testing: http://localhost:8000/api/users/csrf/"
curl -s -c cookies.txt http://localhost:8000/api/users/csrf/ | head -1
echo "Cookies received:"
cat cookies.txt
echo

echo -e "${BLUE}Step 3: Test session debug endpoint${NC}"
echo "Testing: http://localhost:8000/api/users/session-debug/"
curl -s -b cookies.txt http://localhost:8000/api/users/session-debug/ | head -1
echo

echo -e "${BLUE}Step 4: Test current user endpoint (should fail without login)${NC}"
echo "Testing: http://localhost:8000/api/users/me/"
curl -s -b cookies.txt http://localhost:8000/api/users/me/ | head -1
echo

echo -e "${BLUE}Step 5: Test from network IP${NC}"
echo "Testing: http://192.168.1.8:8000/api/users/health/"
curl -s http://192.168.1.8:8000/api/users/health/ | head -1
echo

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Check browser console for API configuration logs"
echo "3. Try to login with valid credentials"
echo "4. Check if session cookies are set in browser dev tools"
echo "5. Try accessing http://192.168.1.8:3000 from another device"
echo
echo -e "${GREEN}Debug Endpoints Available:${NC}"
echo "• Session Debug: http://localhost:8000/api/users/session-debug/"
echo "• CSRF Debug: http://localhost:8000/api/users/csrf-debug/"
echo "• Test Session: http://localhost:8000/api/users/test-session/"
echo "• Health Check: http://localhost:8000/api/users/health/"
echo
echo -e "${RED}Common Issues to Check:${NC}"
echo "• CORS headers in browser Network tab"
echo "• Cookie settings in browser Application tab"
echo "• Django server logs for authentication errors"
echo "• Browser console for JavaScript errors"

# Clean up
rm -f cookies.txt
