#!/usr/bin/env python3
"""
Test script to verify CORS fix is working
"""

import requests
import json

def test_cors_fix():
    """Test CORS configuration after the fix"""
    
    print("Testing CORS Configuration Fix")
    print("=" * 50)
    
    backend_url = "https://kebede-butchery-ms.onrender.com"
    frontend_url = "https://kebede-butchery-ms.vercel.app"
    
    # Test 1: OPTIONS request (CORS preflight)
    print("\n1. Testing CORS preflight request...")
    try:
        response = requests.options(
            f"{backend_url}/api/users/me/",
            headers={
                'Origin': frontend_url,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type, access-control-allow-credentials'
            }
        )
        print(f"OPTIONS Status: {response.status_code}")
        
        # Check CORS headers
        cors_headers = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Credentials',
            'Access-Control-Allow-Methods',
            'Access-Control-Allow-Headers'
        ]
        
        for header in cors_headers:
            value = response.headers.get(header)
            if value:
                print(f"✅ {header}: {value}")
            else:
                print(f"❌ {header}: Not found")
                
    except Exception as e:
        print(f"❌ CORS preflight error: {e}")
    
    # Test 2: Actual API request
    print("\n2. Testing actual API request...")
    try:
        # Get CSRF token first
        response = requests.get(f"{backend_url}/api/users/csrf/")
        if response.status_code == 200:
            print("✅ CSRF endpoint accessible")
            
            # Test login
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
                print("✅ Login working")
                
                # Test authenticated endpoint
                response = requests.get(
                    f"{backend_url}/api/users/me/",
                    cookies=response.cookies
                )
                
                if response.status_code == 200:
                    print("✅ Authenticated endpoint working")
                    data = response.json()
                    print(f"User: {data.get('username', 'N/A')}")
                else:
                    print(f"❌ Authenticated endpoint failed: {response.text}")
            else:
                print(f"❌ Login failed: {response.text}")
        else:
            print(f"❌ CSRF failed: {response.text}")
            
    except Exception as e:
        print(f"❌ API request error: {e}")
    
    # Test 3: Orders endpoint (the one that was failing)
    print("\n3. Testing orders endpoint...")
    try:
        response = requests.get(f"{backend_url}/api/orders/order-list/")
        print(f"Orders Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Orders endpoint working")
        else:
            print(f"❌ Orders endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ Orders error: {e}")
    
    print("\n" + "=" * 50)
    print("✅ CORS test completed!")
    print("\nIf all tests pass, your frontend should now work correctly.")

if __name__ == "__main__":
    test_cors_fix() 