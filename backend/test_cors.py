#!/usr/bin/env python3
"""
Test script to verify CORS configuration
"""
import requests
import json

def test_cors_endpoint():
    """Test the CORS endpoint"""
    url = "https://kebede-butchery-ms.onrender.com/api/users/cors-test/"
    
    # Test GET request
    try:
        response = requests.get(url)
        print(f"GET request status: {response.status_code}")
        print(f"GET response headers: {dict(response.headers)}")
        print(f"GET response body: {response.text}")
    except Exception as e:
        print(f"GET request failed: {e}")
    
    # Test POST request
    try:
        response = requests.post(url, json={"test": "data"})
        print(f"POST request status: {response.status_code}")
        print(f"POST response headers: {dict(response.headers)}")
        print(f"POST response body: {response.text}")
    except Exception as e:
        print(f"POST request failed: {e}")

def test_csrf_endpoint():
    """Test the CSRF endpoint"""
    url = "https://kebede-butchery-ms.onrender.com/api/users/csrf/"
    
    try:
        response = requests.get(url)
        print(f"CSRF request status: {response.status_code}")
        print(f"CSRF response headers: {dict(response.headers)}")
        print(f"CSRF response body: {response.text}")
    except Exception as e:
        print(f"CSRF request failed: {e}")

if __name__ == "__main__":
    print("Testing CORS configuration...")
    test_cors_endpoint()
    print("\nTesting CSRF endpoint...")
    test_csrf_endpoint() 