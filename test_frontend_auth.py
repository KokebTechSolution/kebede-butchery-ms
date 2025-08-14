#!/usr/bin/env python3
"""
Test script to verify the frontend authentication flow
"""

import requests
import json

# Configuration
BASE_URL = "http://192.168.100.122:8000"
FRONTEND_ORIGIN = "http://localhost:3000"

# Headers for CORS
headers = {
    "Origin": FRONTEND_ORIGIN,
    "Content-Type": "application/json",
}

def test_complete_auth_flow():
    """Test the complete authentication flow"""
    print("🧪 Testing Complete Frontend Authentication Flow")
    print("=" * 60)
    
    # Step 1: Get CSRF token (this should work)
    print("\n1️⃣ Getting CSRF token...")
    try:
        response = requests.get(f"{BASE_URL}/api/users/csrf/", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        print(f"   Cookies: {dict(response.cookies)}")
        
        if response.status_code == 200:
            print("   ✅ CSRF endpoint working correctly")
            csrf_cookies = response.cookies
        else:
            print("   ❌ CSRF endpoint failed")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    # Step 2: Login with credentials
    print("\n2️⃣ Attempting login...")
    login_data = {
        "username": "waiter_user1",
        "password": "password123"
    }
    
    try:
        # Include CSRF token in headers
        login_headers = headers.copy()
        if 'csrftoken' in response.cookies:
            login_headers['X-CSRFToken'] = response.cookies['csrftoken']
        
        login_response = requests.post(
            f"{BASE_URL}/api/users/login/",
            json=login_data,
            headers=login_headers,
            cookies=csrf_cookies
        )
        
        print(f"   Status: {login_response.status_code}")
        print(f"   Response: {login_response.text}")
        print(f"   Cookies after login: {dict(login_response.cookies)}")
        
        if login_response.status_code == 200:
            print("   ✅ Login successful")
            # Combine cookies from both requests
            all_cookies = csrf_cookies.copy()
            all_cookies.update(login_response.cookies)
        else:
            print("   ❌ Login failed")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    # Step 3: Test /me endpoint with session
    print("\n3️⃣ Testing /me endpoint with session...")
    try:
        me_response = requests.get(
            f"{BASE_URL}/api/users/me/",
            headers=headers,
            cookies=all_cookies
        )
        
        print(f"   Status: {me_response.status_code}")
        print(f"   Response: {me_response.text}")
        
        if me_response.status_code == 200:
            print("   ✅ /me endpoint working with session")
            user_data = me_response.json()
            print(f"   👤 User: {user_data.get('username', 'Unknown')}")
            print(f"   🏷️  Role: {user_data.get('role', 'Unknown')}")
        else:
            print("   ❌ /me endpoint failed even with session")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    print("\n🎉 All tests passed! Authentication flow is working correctly.")
    return True

def test_unauthorized_access():
    """Test that /me endpoint properly rejects unauthorized access"""
    print("\n🔒 Testing Unauthorized Access to /me")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/api/users/me/", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 401:
            print("✅ /me endpoint correctly rejects unauthorized access")
            return True
        else:
            print("❌ /me endpoint should return 401 for unauthorized access")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Frontend Authentication Flow Test")
    print("=" * 50)
    
    # Test unauthorized access first
    test_unauthorized_access()
    
    # Test complete flow
    test_complete_auth_flow()















