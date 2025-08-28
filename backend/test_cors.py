#!/usr/bin/env python3
"""
Test script to verify CORS configuration and API endpoints
"""
import requests
import json

# API Configuration
API_BASE_URL = "https://kebede-butchery-ms-2.onrender.com"
FRONTEND_URL = "https://kebede-butchery-ms-1.onrender.com"

def test_cors_headers():
    """Test CORS headers on various endpoints"""
    print("🧪 Testing CORS Configuration")
    print("=" * 50)
    
    # Test endpoints
    endpoints = [
        "/cors-test/",
        "/api/users/login/",
        "/api/users/me/",
    ]
    
    headers = {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
    }
    
    for endpoint in endpoints:
        url = f"{API_BASE_URL}{endpoint}"
        print(f"\n📍 Testing: {url}")
        
        try:
            # Test OPTIONS request (preflight)
            response = requests.options(url, headers=headers, timeout=10)
            print(f"   OPTIONS Status: {response.status_code}")
            
            # Check CORS headers
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            }
            
            print("   CORS Headers:")
            for header, value in cors_headers.items():
                print(f"   ✅ {header}: {value}" if value else f"   ❌ {header}: Missing")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Error: {e}")

def test_login_endpoint():
    """Test login endpoint with actual request"""
    print("\n🔐 Testing Login Endpoint")
    print("=" * 30)
    
    url = f"{API_BASE_URL}/api/users/login/"
    headers = {
        'Origin': FRONTEND_URL,
        'Content-Type': 'application/json',
    }
    
    # Test with dummy credentials
    data = {
        'username': 'test',
        'password': 'test'
    }
    
    try:
        response = requests.post(url, json=data, headers=headers, timeout=10)
        print(f"POST Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 401:
            print("✅ Login endpoint is working (401 expected for invalid credentials)")
        elif response.status_code == 200:
            print("✅ Login endpoint is working (200 - valid credentials)")
        else:
            print(f"⚠️  Unexpected status code: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")

def test_me_endpoint():
    """Test /me endpoint without authentication"""
    print("\n👤 Testing /me Endpoint (Unauthenticated)")
    print("=" * 45)
    
    url = f"{API_BASE_URL}/api/users/me/"
    headers = {
        'Origin': FRONTEND_URL,
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"GET Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ /me endpoint is working (401 expected without authentication)")
            
            # Check if CORS headers are present even in 401 response
            cors_origin = response.headers.get('Access-Control-Allow-Origin')
            if cors_origin:
                print(f"✅ CORS headers present in 401 response: {cors_origin}")
            else:
                print("❌ CORS headers missing in 401 response")
        else:
            print(f"⚠️  Unexpected status code: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")

def main():
    """Run all tests"""
    print("🚀 Kebede Butchery API - CORS & Authentication Test")
    print("=" * 55)
    print(f"Backend URL: {API_BASE_URL}")
    print(f"Frontend URL: {FRONTEND_URL}")
    
    test_cors_headers()
    test_login_endpoint()
    test_me_endpoint()
    
    print("\n📋 Summary:")
    print("If CORS headers are present and login/me endpoints respond correctly,")
    print("the CORS configuration is working properly!")
    print("\n💡 Next steps:")
    print("1. Test actual login from frontend")
    print("2. Verify session persistence")
    print("3. Check if authenticated requests work")

if __name__ == "__main__":
    main()
