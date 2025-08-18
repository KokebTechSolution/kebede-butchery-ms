#!/usr/bin/env python3
"""
Simple test script to verify the authentication flow is working
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

def test_auth_flow():
    """Test the complete authentication flow"""
    print("🧪 Testing Authentication Flow")
    print("=" * 50)
    
    # Create a session to maintain cookies
    session = requests.Session()
    
    # Step 1: Get CSRF token
    print("1️⃣ Getting CSRF token...")
    try:
        response = session.get(f"{BASE_URL}/api/users/csrf/", headers=headers)
        if response.status_code == 200:
            print("✅ CSRF token obtained successfully")
            csrf_data = response.json()
            print(f"   CSRF Token: {csrf_data.get('csrf_token', 'N/A')[:20]}...")
        else:
            print(f"❌ CSRF request failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ CSRF request error: {e}")
        return False
    
    # Step 2: Try to access /me without login (should fail)
    print("\n2️⃣ Testing /me endpoint without login (should fail)...")
    try:
        me_response = session.get(f"{BASE_URL}/api/users/me/", headers=headers)
        if me_response.status_code == 401:
            print("✅ /me endpoint correctly returns 401 when not authenticated")
        else:
            print(f"❌ Unexpected response from /me: {me_response.status_code}")
            print(f"   Response: {me_response.text}")
    except Exception as e:
        print(f"❌ /me request error: {e}")
    
    # Step 3: Login
    print("\n3️⃣ Attempting login...")
    login_data = {
        "username": "waiter_user1",
        "password": "waiter123"
    }
    
    try:
        # Include CSRF token in headers
        login_headers = headers.copy()
        if 'csrftoken' in session.cookies:
            login_headers['X-CSRFToken'] = session.cookies['csrftoken']
        
        login_response = session.post(
            f"{BASE_URL}/api/users/login/",
            json=login_data,
            headers=login_headers
        )
        
        print(f"   Status: {login_response.status_code}")
        if login_response.status_code == 200:
            print("✅ Login successful")
            login_data = login_response.json()
            print(f"   User: {login_data.get('username', 'Unknown')}")
            print(f"   Session Key: {login_data.get('session_key', 'N/A')[:20]}...")
        else:
            print(f"❌ Login failed: {login_response.text}")
            return False
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Step 4: Test /me endpoint with session (should work)
    print("\n4️⃣ Testing /me endpoint with session (should work)...")
    try:
        me_response = session.get(f"{BASE_URL}/api/users/me/", headers=headers)
        print(f"   Status: {me_response.status_code}")
        
        if me_response.status_code == 200:
            print("✅ /me endpoint working with session")
            user_data = me_response.json()
            print(f"   👤 User: {user_data.get('username', 'Unknown')}")
            print(f"   🏷️  Role: {user_data.get('role', 'Unknown')}")
        else:
            print(f"❌ /me endpoint failed even with session: {me_response.text}")
            return False
    except Exception as e:
        print(f"❌ /me request error: {e}")
        return False
    
    # Step 5: Check cookies
    print("\n5️⃣ Checking cookies...")
    print(f"   Session cookies: {dict(session.cookies)}")
    
    print("\n🎉 All tests passed! Authentication flow is working correctly.")
    return True

if __name__ == "__main__":
    test_auth_flow()





