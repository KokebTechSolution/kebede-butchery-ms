#!/usr/bin/env python3
"""
Test script to debug the authentication flow and session issue
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
FRONTEND_ORIGIN = "http://localhost:3000"

# Headers for CORS
headers = {
    "Origin": FRONTEND_ORIGIN,
    "Content-Type": "application/json",
}

def test_csrf():
    """Test CSRF token endpoint"""
    print("🔐 Testing CSRF endpoint...")
    response = requests.get(f"{BASE_URL}/api/users/csrf/", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    print(f"Cookies: {dict(response.cookies)}")
    print(f"Headers: {dict(response.headers)}")
    print()
    return response.cookies

def test_session_debug(cookies):
    """Test session debug endpoint"""
    print("🔍 Testing session debug endpoint...")
    response = requests.get(f"{BASE_URL}/api/users/session-debug/", headers=headers, cookies=cookies)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    print()

def test_login(cookies):
    """Test login endpoint"""
    print("🚪 Testing login endpoint...")
    login_data = {
        "username": "waiter_user1",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/api/users/login/", 
                           headers=headers, 
                           cookies=cookies,
                           json=login_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    print(f"New Cookies: {dict(response.cookies)}")
    print()
    
    # Update cookies with new ones from login response
    if response.cookies:
        cookies.update(response.cookies)
    
    return cookies

def test_me_endpoint(cookies):
    """Test the /me endpoint"""
    print("👤 Testing /me endpoint...")
    response = requests.get(f"{BASE_URL}/api/users/me/", headers=headers, cookies=cookies)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    print(f"Cookies sent: {dict(cookies)}")
    print()

def test_debug_auth(cookies):
    """Test debug auth endpoint"""
    print("🐛 Testing debug auth endpoint...")
    response = requests.get(f"{BASE_URL}/api/users/debug-auth/", headers=headers, cookies=cookies)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    print()

def main():
    print("🧪 Testing Authentication Flow")
    print("=" * 50)
    print()
    
    # Step 1: Get CSRF token
    cookies = test_csrf()
    
    # Step 2: Test session debug before login
    test_session_debug(cookies)
    
    # Step 3: Test login
    cookies = test_login(cookies)
    
    # Step 4: Test session debug after login
    test_session_debug(cookies)
    
    # Step 5: Test /me endpoint
    test_me_endpoint(cookies)
    
    # Step 6: Test debug auth
    test_debug_auth(cookies)
    
    print("✅ Test completed!")

if __name__ == "__main__":
    main()
