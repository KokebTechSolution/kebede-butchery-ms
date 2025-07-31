#!/usr/bin/env python3
"""
Simple test script to verify API endpoints are working
"""

import requests
import json

# Base URL for the deployed API
BASE_URL = "https://kebede-butchery-ms.onrender.com"

def test_api_endpoints():
    """Test various API endpoints"""
    
    print("Testing Kebede Butchery API endpoints...")
    print("=" * 50)
    
    # Test 1: Root endpoint
    print("\n1. Testing root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Root endpoint working!")
            print(f"Message: {data.get('message', 'N/A')}")
        else:
            print(f"❌ Root endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ Error testing root endpoint: {e}")
    
    # Test 2: API info endpoint (JSON)
    print("\n2. Testing API info endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/", headers={'Accept': 'application/json'})
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ API info endpoint working!")
            print(f"Version: {data.get('version', 'N/A')}")
        else:
            print(f"❌ API info endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ Error testing API info endpoint: {e}")
    
    # Test 3: Health check endpoint
    print("\n3. Testing health check endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/users/health/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Health check endpoint working!")
        else:
            print(f"❌ Health check endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ Error testing health check endpoint: {e}")
    
    # Test 4: CORS test endpoint
    print("\n4. Testing CORS endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/users/cors-test/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ CORS test endpoint working!")
        else:
            print(f"❌ CORS test endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ Error testing CORS endpoint: {e}")
    
    # Test 5: Admin endpoint
    print("\n5. Testing admin endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/admin/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Admin endpoint working!")
        else:
            print(f"❌ Admin endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ Error testing admin endpoint: {e}")
    
    print("\n" + "=" * 50)
    print("API testing completed!")

if __name__ == "__main__":
    test_api_endpoints() 