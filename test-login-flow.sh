#!/bin/bash

echo "🔐 Testing Complete Login Flow for Network Access"
echo "================================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Get CSRF token${NC}"
echo "Requesting CSRF token from: http://192.168.100.122:8000/api/users/csrf/"
echo "Origin: http://192.168.100.122:3000"
echo

# Get CSRF token
CSRF_RESPONSE=$(curl -s -H "Origin: http://192.168.100.122:3000" \
     -c login_cookies.txt \
     "http://192.168.100.122:8000/api/users/csrf/")

echo "CSRF Response: $CSRF_RESPONSE"
echo

echo -e "${BLUE}Step 2: Check cookies received${NC}"
echo "Cookies received:"
cat login_cookies.txt
echo

echo -e "${BLUE}Step 3: Test session debug before login${NC}"
echo "Testing: http://192.168.100.122:8000/api/users/session-debug/"
echo

# Test session debug before login
SESSION_DEBUG=$(curl -s -b login_cookies.txt \
     -H "Origin: http://192.168.100.122:3000" \
     "http://192.168.100.122:8000/api/users/session-debug/")

echo "Session Debug Response: $SESSION_DEBUG"
echo

echo -e "${BLUE}Step 4: Attempt login (this will fail without valid credentials)${NC}"
echo "Testing: http://192.168.100.122:8000/api/users/login/"
echo "Note: This will fail without valid username/password"
echo

# Attempt login (will fail without valid credentials)
LOGIN_RESPONSE=$(curl -s -b login_cookies.txt \
     -H "Origin: http://192.168.100.122:3000" \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test"}' \
     "http://192.168.100.122:8000/api/users/login/")

echo "Login Response: $LOGIN_RESPONSE"
echo

echo -e "${BLUE}Step 5: Test current user endpoint (should fail without login)${NC}"
echo "Testing: http://192.168.100.122:8000/api/users/me/"
echo

# Test current user endpoint
ME_RESPONSE=$(curl -s -b login_cookies.txt \
     -H "Origin: http://192.168.100.122:3000" \
     "http://192.168.100.122:8000/api/users/me/")

echo "Current User Response: $ME_RESPONSE"
echo

echo -e "${YELLOW}Expected Results:${NC}"
echo "• CSRF token should be received"
echo "• Cookies should be set with correct domain (192.168.100.122)"
echo "• Session debug should show cookies being sent"
echo "• Login should fail (expected without valid credentials)"
echo "• Current user should return 'Authentication credentials were not provided'"
echo

echo -e "${GREEN}Next Steps:${NC}"
echo "1. Check if cookies have correct domain"
echo "2. Verify cookies are being sent with requests"
echo "3. Test with valid credentials in browser"
echo "4. Check Django server logs for authentication flow"

# Clean up
rm -f login_cookies.txt
