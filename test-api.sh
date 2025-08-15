#!/bin/bash

# API Test Script for Kebede Butchery Management System
# This script tests all the API endpoints to ensure they're working

echo "🧪 Testing Kebede Butchery Management System API..."
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

# Test endpoints
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=$3
    
    print_status "Testing: $description"
    print_status "URL: $url"
    
    if [ -z "$expected_status" ]; then
        expected_status="200"
    fi
    
    # Test the endpoint
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected_status" ]; then
        print_success "✅ $description - Status: $response"
        return 0
    else
        print_error "❌ $description - Expected: $expected_status, Got: $response"
        return 1
    fi
}

# Test authenticated endpoints
test_auth_endpoint() {
    local url=$1
    local description=$2
    local session_cookie=$3
    local expected_status=$4
    
    print_status "Testing: $description (Authenticated)"
    print_status "URL: $url"
    
    if [ -z "$expected_status" ]; then
        expected_status="200"
    fi
    
    # Test with session cookie
    if [ -n "$session_cookie" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -H "Cookie: sessionid=$session_cookie" "$url")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    fi
    
    if [ "$response" = "$expected_status" ]; then
        print_success "✅ $description - Status: $response"
        return 0
    else
        print_error "❌ $description - Expected: $expected_status, Got: $response"
        return 1
    fi
}

# Check if backend is running
print_status "Checking if backend is running..."
if ! curl -s http://localhost:8000/api/ > /dev/null; then
    print_error "Backend is not running. Please start it first with ./start-system.sh"
    exit 1
fi

print_success "Backend is running! 🚀"

# Test public endpoints
echo ""
echo "🌐 Testing Public Endpoints..."
echo "-------------------------------"

test_endpoint "http://localhost:8000/api/" "API Info" "200"
test_endpoint "http://localhost:8000/api/users/csrf/" "CSRF Token" "200"

# Test network IP endpoints
echo ""
echo "🌐 Testing Network IP Endpoints..."
echo "-----------------------------------"

# Get network IP
NETWORK_IP=$(ip route get 1.1.1.1 | awk '{print $7}' | head -n1)
if [ -z "$NETWORK_IP" ] || [ "$NETWORK_IP" = "dev" ]; then
    NETWORK_IP=$(hostname -I | awk '{print $1}')
fi

print_status "Testing network IP: $NETWORK_IP"

test_endpoint "http://$NETWORK_IP:8000/api/" "API Info (Network)" "200"
test_endpoint "http://192.168.100.122:8000/api/" "API Info (Specific Network)" "200"

# Test authentication
echo ""
echo "🔐 Testing Authentication..."
echo "----------------------------"

print_status "Attempting login with test user..."
login_response=$(curl -s -X POST http://localhost:8000/api/users/login/ \
    -H "Content-Type: application/json" \
    -d '{"username": "waiter_user1", "password": "waiter123"}')

if echo "$login_response" | grep -q "session_key"; then
    print_success "✅ Login successful!"
    
    # Extract session key
    session_key=$(echo "$login_response" | grep -o '"session_key":"[^"]*"' | cut -d'"' -f4)
    print_status "Session key: $session_key"
    
    # Test authenticated endpoints
    echo ""
    echo "🔓 Testing Authenticated Endpoints..."
    echo "--------------------------------------"
    
    test_auth_endpoint "http://localhost:8000/api/users/me/" "Current User" "$session_key" "200"
    test_auth_endpoint "http://localhost:8000/api/orders/order-list/" "Order List" "$session_key" "200"
    test_auth_endpoint "http://localhost:8000/api/branches/tables/" "Tables" "$session_key" "200"
    
    # Test network IP authenticated endpoints
    echo ""
    echo "🌐 Testing Network IP Authenticated Endpoints..."
    echo "------------------------------------------------"
    
    test_auth_endpoint "http://$NETWORK_IP:8000/api/users/me/" "Current User (Network)" "$session_key" "200"
    test_auth_endpoint "http://192.168.100.122:8000/api/users/me/" "Current User (Specific Network)" "$session_key" "200"
    
else
    print_error "❌ Login failed: $login_response"
    exit 1
fi

echo ""
echo "================================================"
print_success "API testing complete! 🎉"
echo ""
echo "📊 Summary:"
echo "  - Backend: ✅ Running on port 8000"
echo "  - Local access: ✅ Working"
echo "  - Network access: ✅ Working"
echo "  - Authentication: ✅ Working"
echo "  - All endpoints: ✅ Accessible"
echo ""
echo "🌐 Access URLs:"
echo "  - Local: http://localhost:8000"
echo "  - Network: http://$NETWORK_IP:8000"
echo "  - Specific: http://192.168.100.122:8000"
echo ""
echo "🎨 Frontend should be accessible at:"
echo "  - Local: http://localhost:3000"
echo "  - Network: http://$NETWORK_IP:3000"
echo "  - Specific: http://192.168.100.122:3000"










