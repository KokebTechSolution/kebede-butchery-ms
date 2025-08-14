#!/bin/bash

echo "🔐 Testing Complete Authentication Flow"
echo "======================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Check if Django backend is running${NC}"
echo "Testing: http://192.168.100.122:8000/api/users/health/"
HEALTH_RESPONSE=$(curl -s "http://192.168.100.122:8000/api/users/health/")
echo "Health Response: $HEALTH_RESPONSE"
echo

echo -e "${BLUE}Step 2: Get CSRF token${NC}"
echo "Requesting CSRF token from: http://192.168.100.122:8000/api/users/csrf/"
echo "Origin: http://192.168.100.122:3000"
echo

# Get CSRF token
CSRF_RESPONSE=$(curl -s -H "Origin: http://192.168.100.122:3000" \
     -c auth_cookies.txt \
     "http://192.168.100.122:8000/api/users/csrf/")

echo "CSRF Response: $CSRF_RESPONSE"
echo

echo -e "${BLUE}Step 3: Check cookies received${NC}"
echo "Cookies received:"
cat auth_cookies.txt
echo

echo -e "${BLUE}Step 4: Test session debug before login${NC}"
echo "Testing: http://192.168.100.122:8000/api/users/session-debug/"
echo

# Test session debug before login
SESSION_DEBUG=$(curl -s -b auth_cookies.txt \
     -H "Origin: http://192.168.100.122:3000" \
     "http://192.168.100.122:8000/api/users/session-debug/")

echo "Session Debug Response: $SESSION_DEBUG"
echo

echo -e "${BLUE}Step 5: Test current user endpoint (should fail without login)${NC}"
echo "Testing: http://192.168.100.122:8000/api/users/me/"
echo

# Test current user endpoint
ME_RESPONSE=$(curl -s -b auth_cookies.txt \
     -H "Origin: http://192.168.100.122:3000" \
     "http://192.168.100.122:8000/api/users/me/")

echo "Current User Response: $ME_RESPONSE"
echo

echo -e "${BLUE}Step 6: Test login with test credentials${NC}"
echo "Testing: http://192.168.100.122:8000/api/users/login/"
echo "Note: This will fail without a valid user in the database"
echo

# Test login (will fail without valid user)
LOGIN_RESPONSE=$(curl -s -b auth_cookies.txt \
     -H "Origin: http://192.168.100.122:3000" \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin"}' \
     "http://192.168.100.122:8000/api/users/login/")

echo "Login Response: $LOGIN_RESPONSE"
echo

echo -e "${YELLOW}Expected Results:${NC}"
echo "• Health check should work"
echo "• CSRF token should be received"
echo "• Cookies should be set with correct domain (192.168.100.122)"
echo "• Session debug should show minimal session data"
echo "• Current user should return 'Authentication credentials were not provided'"
echo "• Login should fail (expected without valid user in database)"
echo

echo -e "${GREEN}Next Steps:${NC}"
echo "1. Check if cookies have correct domain"
echo "2. Verify cookies are being sent with requests"
echo "3. Create a test user in Django admin or via management command"
echo "4. Test login with valid credentials"
echo "5. Verify that /me endpoint works after login"

echo -e "${RED}To Create a Test User:${NC}"
echo "1. Access Django admin: http://192.168.100.122:8000/admin/"
echo "2. Create a user with username/password"
echo "3. Or use Django management command:"
echo "   python manage.py createsuperuser"
echo

# Clean up
rm -f auth_cookies.txt
