#!/usr/bin/env python3
"""
Test script to verify CSRF token functionality
"""

import requests
import json

def test_csrf_functionality():
    """Test CSRF token functionality"""
    
    print("🔧 Testing CSRF Token Functionality")
    print("=" * 60)
    
    backend_url = "https://kebede-butchery-ms.onrender.com"
    
    # Step 1: Get CSRF token
    print("\n1. Getting CSRF token...")
    try:
        response = requests.get(f"{backend_url}/api/users/csrf/")
        print(f"CSRF Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ CSRF endpoint accessible")
            
            # Get CSRF token from cookies
            csrf_token = None
            for cookie in response.cookies:
                if cookie.name == 'csrftoken':
                    csrf_token = cookie.value
                    break
            
            if csrf_token:
                print(f"✅ CSRF token found: {csrf_token[:10]}...")
            else:
                print("❌ CSRF token not found in cookies")
                print(f"Available cookies: {[c.name for c in response.cookies]}")
        else:
            print(f"❌ CSRF endpoint failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ CSRF error: {e}")
        return
    
    # Step 2: Test login to get session
    print("\n2. Testing login...")
    try:
        login_data = {
            'username': 'kebede_pos',
            'password': '12345'
        }
        
        response = requests.post(
            f"{backend_url}/api/users/login/",
            json=login_data,
            cookies=response.cookies
        )
        
        if response.status_code == 200:
            print("✅ Login successful")
            data = response.json()
            print(f"User: {data.get('username', 'N/A')}")
        else:
            print(f"❌ Login failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Step 3: Test POST request with CSRF token
    print("\n3. Testing POST request with CSRF token...")
    try:
        # Test the specific endpoint that's failing
        test_data = {
            'name': 'Test Item Type',
            'description': 'Test description'
        }
        
        headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrf_token
        }
        
        response = requests.post(
            f"{backend_url}/api/inventory/itemtypes/",
            json=test_data,
            headers=headers,
            cookies=response.cookies
        )
        
        print(f"POST Status: {response.status_code}")
        if response.status_code == 201:
            print("✅ POST request successful with CSRF token")
        elif response.status_code == 403:
            print("❌ CSRF token rejected")
            print(f"Response: {response.text}")
        else:
            print(f"⚠️ Unexpected response: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ POST request error: {e}")
    
    # Step 4: Test without CSRF token (should fail)
    print("\n4. Testing POST request without CSRF token...")
    try:
        test_data = {
            'name': 'Test Item Type 2',
            'description': 'Test description 2'
        }
        
        headers = {
            'Content-Type': 'application/json'
            # No X-CSRFToken header
        }
        
        response = requests.post(
            f"{backend_url}/api/inventory/itemtypes/",
            json=test_data,
            headers=headers,
            cookies=response.cookies
        )
        
        print(f"POST Status (no CSRF): {response.status_code}")
        if response.status_code == 403:
            print("✅ CSRF protection working (correctly rejected)")
        else:
            print(f"⚠️ Unexpected response: {response.status_code}")
            
    except Exception as e:
        print(f"❌ POST request error: {e}")
    
    print("\n" + "=" * 60)
    print("📋 CSRF Token Debugging")
    print("=" * 60)
    print("If CSRF token is being rejected, check:")
    print("1. Token format and length")
    print("2. Token expiration")
    print("3. Session consistency")
    print("4. Frontend CSRF token handling")

if __name__ == "__main__":
    test_csrf_functionality() 