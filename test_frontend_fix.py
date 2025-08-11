#!/usr/bin/env python3
"""
Test script to verify frontend session fix
"""
import requests
import json

# Test from the actual frontend IP
FRONTEND_ORIGIN = "http://192.168.100.122:3000"
BACKEND_URL = "http://192.168.100.122:8000"

def test_frontend_session():
    """Test that the frontend session is now working correctly"""
    print("🚀 Testing Frontend Session Fix")
    print("=" * 60)
    print(f"🌐 Frontend Origin: {FRONTEND_ORIGIN}")
    print(f"🔧 Backend URL: {BACKEND_URL}")
    print()
    
    session = requests.Session()
    
    # Set headers to simulate frontend
    headers = {
        'Origin': FRONTEND_ORIGIN,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    # Step 1: Get CSRF token
    print("1️⃣ Getting CSRF token...")
    try:
        csrf_response = session.get(f"{BACKEND_URL}/api/users/csrf/", headers=headers)
        if csrf_response.status_code == 200:
            print("✅ CSRF token obtained successfully")
            csrf_data = csrf_response.json()
            print(f"   CSRF Token: {csrf_data.get('csrf_token', 'N/A')[:20]}...")
            print(f"   Cookies received: {dict(session.cookies)}")
        else:
            print(f"❌ CSRF request failed: {csrf_response.status_code}")
            print(f"   Response: {csrf_response.text}")
            return False
    except Exception as e:
        print(f"❌ CSRF request error: {e}")
        return False
    
    # Step 2: Try to access /me without login (should fail)
    print("\n2️⃣ Testing /me endpoint without login (should fail)...")
    try:
        me_response = session.get(f"{BACKEND_URL}/api/users/me/", headers=headers)
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
        "password": "password123"
    }
    
    try:
        login_response = session.post(
            f"{BACKEND_URL}/api/users/login/", 
            json=login_data, 
            headers=headers
        )
        
        if login_response.status_code == 200:
            print("✅ Login successful")
            login_data_response = login_response.json()
            print(f"   User: {login_data_response.get('username', 'N/A')}")
            print(f"   Role: {login_data_response.get('role', 'N/A')}")
            print(f"   Session Key: {login_data_response.get('session_key', 'N/A')}")
            print(f"   Cookies after login: {dict(session.cookies)}")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"   Response: {login_response.text}")
            return False
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Step 4: Test /me endpoint after login (should work)
    print("\n4️⃣ Testing /me endpoint after login (should work)...")
    try:
        me_response = session.get(f"{BACKEND_URL}/api/users/me/", headers=headers)
        if me_response.status_code == 200:
            print("✅ /me endpoint working after login!")
            me_data = me_response.json()
            print(f"   Username: {me_data.get('username', 'N/A')}")
            print(f"   Role: {me_data.get('role', 'N/A')}")
            print(f"   Email: {me_data.get('email', 'N/A')}")
        else:
            print(f"❌ /me endpoint failed after login: {me_response.status_code}")
            print(f"   Response: {me_response.text}")
            print(f"   Cookies being sent: {dict(session.cookies)}")
            return False
    except Exception as e:
        print(f"❌ /me request error: {e}")
        return False
    
    # Step 5: Test a protected endpoint (tables)
    print("\n5️⃣ Testing protected endpoint (tables) after login...")
    try:
        tables_response = session.get(f"{BACKEND_URL}/api/branches/tables/", headers=headers)
        if tables_response.status_code == 200:
            print("✅ Tables endpoint working after login!")
            tables_data = tables_response.json()
            print(f"   Tables count: {len(tables_data)}")
        else:
            print(f"❌ Tables endpoint failed after login: {tables_response.status_code}")
            print(f"   Response: {tables_response.text}")
    except Exception as e:
        print(f"❌ Tables request error: {e}")
    
    print(f"\n✅ Frontend session test completed successfully!")
    return True

if __name__ == "__main__":
    test_frontend_session()





