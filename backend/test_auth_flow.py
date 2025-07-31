#!/usr/bin/env python
"""
Test script to verify authentication flow
"""
import os
import sys
import django
import requests
import json

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.session_manager import SessionManager

User = get_user_model()

def test_authentication_flow():
    """Test the complete authentication flow"""
    
    print("🔍 Testing Authentication Flow...")
    
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
    
    # Test 4: Check if test user exists
    try:
        user = User.objects.get(username='admin')
        print(f"✅ Test user exists: {user.username}")
    except User.DoesNotExist:
        print("❌ Test user 'admin' not found")
        print("   Creating test user...")
        user = User.objects.create_user(
            username='admin',
            password='admin123',
            email='admin@test.com',
            role='owner'
        )
        print(f"✅ Created test user: {user.username}")
    
    print("\n🎉 Authentication flow test completed!")
    return True

if __name__ == '__main__':
    test_authentication_flow() 