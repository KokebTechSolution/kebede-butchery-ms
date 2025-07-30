#!/usr/bin/env python
"""
Test script to verify authentication is working
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from django.contrib.auth import authenticate, login
from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import reverse

User = get_user_model()

def test_authentication():
    """Test authentication flow"""
    print("Testing authentication...")
    
    # Create a test client
    client = Client()
    
    # Test login
    username = "bartender_user1"
    password = "testpass123"
    
    print(f"Attempting to login with {username}...")
    
    # Try to authenticate
    user = authenticate(username=username, password=password)
    if user:
        print(f"✅ User authenticated: {user.username}")
        print(f"User role: {user.role}")
        print(f"User branch: {user.branch}")
    else:
        print("❌ Authentication failed")
        return
    
    # Test session login
    login_success = client.login(username=username, password=password)
    if login_success:
        print("✅ Session login successful")
    else:
        print("❌ Session login failed")
        return
    
    # Test accessing protected endpoint
    response = client.get('/api/users/me/')
    print(f"Response status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Protected endpoint accessible")
        print(f"Response data: {response.json()}")
    else:
        print("❌ Protected endpoint not accessible")
        print(f"Response: {response.content}")
    
    # Test session data
    session_key = client.session.session_key
    print(f"Session key: {session_key}")
    
    # Test cookies
    cookies = client.cookies
    print(f"Cookies: {dict(cookies)}")

if __name__ == "__main__":
    test_authentication() 