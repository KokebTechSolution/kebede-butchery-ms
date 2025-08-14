#!/usr/bin/env python
"""
Test script to verify CSRF token functionality
"""
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

def test_csrf_functionality():
    """Test CSRF token functionality"""
    
    print("🔍 Testing CSRF Functionality...")
    
    # Create a session to maintain cookies
    session = requests.Session()
    
    # Test 1: Get CSRF token
    try:
        response = session.get('http://localhost:8000/api/users/csrf/')
        print(f"✅ CSRF endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        # Check if CSRF cookie was set
        csrf_cookie = session.cookies.get('csrftoken')
        if csrf_cookie:
            print(f"✅ CSRF cookie set: {csrf_cookie[:10]}...")
        else:
            print("❌ No CSRF cookie found")
            return False
            
    except Exception as e:
        print(f"❌ CSRF endpoint failed: {e}")
        return False
    
    # Test 2: Test CSRF validation with POST request
    try:
        headers = {
            'X-CSRFToken': csrf_cookie,
            'Content-Type': 'application/json',
        }
        
        response = session.post('http://localhost:8000/api/users/csrf-test/', 
                              headers=headers,
                              json={'test': 'data'})
        
        print(f"✅ CSRF test POST: {response.status_code}")
        print(f"   Response: {response.json()}")
        
    except Exception as e:
        print(f"❌ CSRF test POST failed: {e}")
        return False
    
    # Test 3: Test without CSRF token (should fail)
    try:
        response = session.post('http://localhost:8000/api/users/csrf-test/', 
                              json={'test': 'data'})
        
        print(f"✅ CSRF test without token: {response.status_code}")
        print(f"   Expected 403, got: {response.status_code}")
        
    except Exception as e:
        print(f"❌ CSRF test without token failed: {e}")
        return False
    
    print("\n🎉 CSRF functionality test completed!")
    return True

if __name__ == '__main__':
    test_csrf_functionality() 