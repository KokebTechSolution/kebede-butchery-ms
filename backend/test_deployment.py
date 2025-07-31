#!/usr/bin/env python3
"""
Comprehensive test script to check both Vercel frontend and Render backend deployments
"""

import requests
import json
import time

def test_backend_deployment():
    """Test the Render backend deployment"""
    
    print("🔧 Testing Render Backend Deployment")
    print("=" * 60)
    
    backend_url = "https://kebede-butchery-ms.onrender.com"
    
    # Test 1: Root endpoint
    print("\n1. Testing root endpoint...")
    try:
        response = requests.get(f"{backend_url}/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Root endpoint working")
            data = response.json()
            print(f"API Info: {data.get('message', 'N/A')}")
        else:
            print(f"❌ Root endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: API endpoints
    print("\n2. Testing API endpoints...")
    endpoints = [
        "/api/users/health/",
        "/api/users/cors-test/",
        "/api/users/csrf/",
        "/admin/"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{backend_url}{endpoint}")
            print(f"{endpoint}: {response.status_code}")
            if response.status_code == 200:
                print(f"✅ {endpoint} working")
            else:
                print(f"❌ {endpoint} failed")
        except Exception as e:
            print(f"❌ {endpoint} error: {e}")
    
    # Test 3: Authentication
    print("\n3. Testing authentication...")
    try:
        # Get CSRF token
        response = requests.get(f"{backend_url}/api/users/csrf/")
        if response.status_code == 200:
            print("✅ CSRF endpoint working")
            
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
                data = response.json()
                print(f"User: {data.get('username', 'N/A')}")
                
                # Test authenticated endpoint
                response = requests.get(
                    f"{backend_url}/api/users/me/",
                    cookies=response.cookies
                )
                
                if response.status_code == 200:
                    print("✅ Authenticated endpoint working")
                else:
                    print(f"❌ Authenticated endpoint failed: {response.text}")
            else:
                print(f"❌ Login failed: {response.text}")
        else:
            print(f"❌ CSRF failed: {response.text}")
    except Exception as e:
        print(f"❌ Authentication error: {e}")

def test_frontend_deployment():
    """Test the Vercel frontend deployment"""
    
    print("\n🌐 Testing Vercel Frontend Deployment")
    print("=" * 60)
    
    # Common Vercel URLs to test
    vercel_urls = [
        "https://kebede-butchery-ms.vercel.app",
        "https://kebede-butchery-h741toz7z-alki45s-projects.vercel.app"
    ]
    
    for url in vercel_urls:
        print(f"\nTesting: {url}")
        try:
            response = requests.get(url, timeout=10)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("✅ Frontend accessible")
                # Check if it's a React app
                if "react" in response.text.lower() or "kebede" in response.text.lower():
                    print("✅ React app detected")
                else:
                    print("⚠️  May not be React app")
            else:
                print(f"❌ Frontend not accessible: {response.status_code}")
        except requests.exceptions.Timeout:
            print("❌ Frontend timeout")
        except requests.exceptions.ConnectionError:
            print("❌ Frontend connection error")
        except Exception as e:
            print(f"❌ Frontend error: {e}")

def test_cors_configuration():
    """Test CORS configuration between frontend and backend"""
    
    print("\n🔗 Testing CORS Configuration")
    print("=" * 60)
    
    backend_url = "https://kebede-butchery-ms.onrender.com"
    frontend_urls = [
        "https://kebede-butchery-ms.vercel.app",
        "https://kebede-butchery-h741toz7z-alki45s-projects.vercel.app"
    ]
    
    for frontend_url in frontend_urls:
        print(f"\nTesting CORS with: {frontend_url}")
        
        # Test OPTIONS request (CORS preflight)
        try:
            response = requests.options(
                f"{backend_url}/api/users/me/",
                headers={
                    'Origin': frontend_url,
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Content-Type'
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
            print(f"❌ CORS test error: {e}")

def main():
    """Run all tests"""
    
    print("🚀 Comprehensive Deployment Test")
    print("=" * 60)
    print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test backend
    test_backend_deployment()
    
    # Test frontend
    test_frontend_deployment()
    
    # Test CORS
    test_cors_configuration()
    
    print("\n" + "=" * 60)
    print("✅ Test completed!")
    print("\n📋 Summary:")
    print("- Backend (Render): Should be working")
    print("- Frontend (Vercel): Check the URLs above")
    print("- CORS: Should be configured correctly")
    print("\n🔑 Working Credentials:")
    print("Username: kebede_pos")
    print("Password: 12345")

if __name__ == "__main__":
    main() 