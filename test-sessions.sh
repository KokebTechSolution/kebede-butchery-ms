#!/bin/bash

echo "🧪 Testing Session Configuration for Both Local and Network Access"
echo "================================================================"
echo

# Test local access
echo "🏠 Testing Local Access (localhost:3000 -> localhost:8000)"
echo "--------------------------------------------------------"
echo "Frontend URL: http://localhost:3000"
echo "Backend URL: http://localhost:8000"
echo

# Test network access
echo "🌐 Testing Network Access (192.168.1.8:3000 -> 192.168.1.8:8000)"
echo "----------------------------------------------------------------"
echo "Frontend URL: http://192.168.1.8:3000"
echo "Backend URL: http://192.168.1.8:8000"
echo

echo "📋 Test Steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Try to login - sessions should work"
echo "3. Open http://192.168.1.8:3000 in another browser/device"
echo "4. Try to login - sessions should also work"
echo
echo "🔍 Check Browser Console for:"
echo "   - API configuration logs"
echo "   - Session cookie information"
echo "   - CSRF token information"
echo
echo "🍪 Expected Cookies:"
echo "   - sessionid (for Django sessions)"
echo "   - csrftoken (for CSRF protection)"
echo
echo "⚠️  Common Issues to Check:"
echo "   - CORS headers in browser dev tools"
echo "   - Cookie settings in browser dev tools"
echo "   - Network tab for API requests"
echo
echo "🚀 Run this script after starting your servers with start-network.sh"
