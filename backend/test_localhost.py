#!/usr/bin/env python
"""
Test script to verify localhost setup
"""
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

def test_localhost_setup():
    """Test the localhost setup"""
    
    print("🔍 Testing Localhost Setup...")
    
    # Test 1: Check if backend is running
    try:
        response = requests.get('http://localhost:8000/api/users/health/')
        print(f"✅ Backend health check: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Backend not running: {e}")
        return False
    
    # Test 2: Check CSRF endpoint
    try:
        response = requests.get('http://localhost:8000/api/users/csrf/')
        print(f"✅ CSRF endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ CSRF endpoint failed: {e}")
        return False
    
    # Test 3: Check auth test endpoint
    try:
        response = requests.get('http://localhost:8000/api/users/auth-test/')
        print(f"✅ Auth test endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Auth test endpoint failed: {e}")
        return False
    
    print("\n🎉 Localhost setup test completed!")
    print("📝 Next steps:")
    print("   1. Start your React frontend: cd frontend && npm start")
    print("   2. Open http://localhost:3000 in your browser")
    print("   3. Try logging in and using your app")
    
    return True

if __name__ == '__main__':
    test_localhost_setup() 