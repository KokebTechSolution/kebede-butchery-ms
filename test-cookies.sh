#!/bin/bash

echo "🍪 Testing Cookie Domain Configuration for Network Access"
echo "========================================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Test CSRF endpoint with Origin header${NC}"
echo "Testing: http://192.168.100.122:8000/api/users/csrf/"
echo "Origin: http://192.168.100.122:3000"
echo

# Test CSRF with Origin header
curl -s -H "Origin: http://192.168.100.122:3000" \
     -c network_cookies.txt \
     "http://192.168.100.122:8000/api/users/csrf/" | head -1

echo
echo "Cookies received:"
cat network_cookies.txt
echo

echo -e "${BLUE}Step 2: Test session debug with cookies${NC}"
echo "Testing: http://192.168.100.122:8000/api/users/session-debug/"
echo

# Test session debug with cookies
curl -s -b network_cookies.txt \
     -H "Origin: http://192.168.100.122:3000" \
     "http://192.168.100.122:8000/api/users/session-debug/" | head -1

echo
echo -e "${BLUE}Step 3: Test localhost vs network IP${NC}"
echo "Testing localhost: http://localhost:8000/api/users/csrf/"
echo

# Test localhost
curl -s -H "Origin: http://localhost:3000" \
     -c local_cookies.txt \
     "http://localhost:8000/api/users/csrf/" | head -1

echo
echo "Localhost cookies:"
cat local_cookies.txt
echo

echo -e "${YELLOW}Expected Results:${NC}"
echo "• Network cookies should have domain: 192.168.100.122"
echo "• Localhost cookies should have no domain (or localhost)"
echo "• Both should work for their respective origins"
echo

echo -e "${GREEN}Next Steps:${NC}"
echo "1. Check if network cookies have the correct domain"
echo "2. Verify that cookies are being sent with requests"
echo "3. Test login flow from network IP"
echo "4. Check browser dev tools for cookie domain settings"

# Clean up
rm -f network_cookies.txt local_cookies.txt
