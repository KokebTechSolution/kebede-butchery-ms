#!/usr/bin/env python3
"""
Test script to verify session persistence in network mode
"""

import requests
import json

def test_session_persistence():
    base_url = "http://192.168.100.122:8000"
    
    print("🧪 Testing Session Persistence in Network Mode")
    print("=" * 50)
    
    # Test 1: Get CSRF token
    print("\n1. Getting CSRF token...")
    try:
        csrf_response = requests.get(f"{base_url}/api/users/csrf/")
        if csrf_response.status_code == 200:
            print("✅ CSRF token obtained successfully")
        else:
            print(f"❌ Failed to get CSRF token: {csrf_response.status_code}")
    except Exception as e:
        print(f"❌ Error getting CSRF token: {e}")
    
    # Test 2: Test session endpoint
    print("\n2. Testing session endpoint...")
    try:
        session_response = requests.get(f"{base_url}/api/users/me/")
        print(f"Session response status: {session_response.status_code}")
        if session_response.status_code == 200:
            print("✅ Session endpoint working")
            print(f"Response: {session_response.json()}")
        else:
            print(f"❌ Session endpoint failed: {session_response.text}")
    except Exception as e:
        print(f"❌ Error testing session endpoint: {e}")
    
    # Test 3: Test CORS headers
    print("\n3. Testing CORS headers...")
    try:
        cors_response = requests.options(f"{base_url}/api/users/me/")
        print(f"CORS headers: {dict(cors_response.headers)}")
        if 'access-control-allow-credentials' in cors_response.headers:
            print("✅ CORS credentials enabled")
        else:
            print("❌ CORS credentials not properly configured")
    except Exception as e:
        print(f"❌ Error testing CORS: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Session persistence test completed!")

if __name__ == "__main__":
    test_session_persistence()
