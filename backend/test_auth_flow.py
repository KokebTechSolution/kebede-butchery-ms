#!/usr/bin/env python3
"""
Test script to verify the complete authentication flow
"""

import requests
import json

def test_auth_flow():
    """Test the complete authentication flow"""
    
    print("Testing Kebede Butchery Authentication Flow")
    print("=" * 60)
    
    # Step 1: Get CSRF token
    print("\n1. Getting CSRF token...")
    try:
        response = requests.get('https://kebede-butchery-ms.onrender.com/api/users/csrf/')
        print(f"CSRF Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ CSRF token obtained")
            # Get the CSRF token from cookies
            csrf_token = None
            for cookie in response.cookies:
                if cookie.name == 'csrftoken':
                    csrf_token = cookie.value
                    break
            print(f"CSRF Token: {csrf_token[:10]}..." if csrf_token else "No CSRF token found")
        else:
            print(f"❌ CSRF failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ CSRF Error: {e}")
        return
    
    # Step 2: Login with working credentials
    print("\n2. Logging in...")
    try:
        login_data = {
            'username': 'kebede_pos',
            'password': '12345'
        }
        
        response = requests.post(
            'https://kebede-butchery-ms.onrender.com/api/users/login/',
            json=login_data,
            cookies=response.cookies  # Use the same session
        )
        print(f"Login Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Login successful")
            data = response.json()
            print(f"User data: {data}")
        else:
            print(f"❌ Login failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Login Error: {e}")
        return
    
    # Step 3: Test authenticated endpoint
    print("\n3. Testing authenticated endpoint...")
    try:
        response = requests.get(
            'https://kebede-butchery-ms.onrender.com/api/users/me/',
            cookies=response.cookies  # Use the same session
        )
        print(f"User Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ User endpoint accessible")
            data = response.json()
            print(f"User data: {data}")
        else:
            print(f"❌ User endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ User Error: {e}")
    
    print("\n" + "=" * 60)
    print("WORKING CREDENTIALS FOR FRONTEND:")
    print("Username: kebede_pos")
    print("Password: 12345")
    print("=" * 60)

if __name__ == "__main__":
    test_auth_flow() 