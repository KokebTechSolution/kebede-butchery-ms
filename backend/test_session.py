#!/usr/bin/env python
"""
Simple test to verify session handling
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import Client

User = get_user_model()

def test_session():
    """Test session handling"""
    print("Testing session handling...")
    
    # Create a test client
    client = Client()
    
    # Test setting a session value
    response = client.post('/api/users/test-session/')
    print(f"POST /api/users/test-session/ - Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()}")
    
    # Test getting a session value
    response = client.get('/api/users/test-session/')
    print(f"GET /api/users/test-session/ - Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()}")
    
    # Test debug auth
    response = client.get('/api/users/debug-auth/')
    print(f"GET /api/users/debug-auth/ - Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()}")

if __name__ == "__main__":
    test_session() 