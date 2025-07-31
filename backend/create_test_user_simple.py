#!/usr/bin/env python3
"""
Simple script to create a test user with known password
"""

import requests
import json

def create_test_user():
    """Create a test user with known password"""
    
    print("Creating test user with known password...")
    print("=" * 50)
    
    backend_url = "https://kebede-butchery-ms.onrender.com"
    
    # Get CSRF token
    try:
        response = requests.get(f"{backend_url}/api/users/csrf/")
        if response.status_code != 200:
            print("❌ CSRF failed")
            return
        print("✅ CSRF token obtained")
    except Exception as e:
        print(f"❌ CSRF error: {e}")
        return
    
    # Test user data
    test_user_data = {
        'username': 'test_waiter',
        'password': 'testpass123',
        'first_name': 'Test',
        'last_name': 'Waiter',
        'email': 'test_waiter@example.com',
        'role': 'waiter',
        'phone_number': '0912345678'
    }
    
    # Try to create user via API
    try:
        response = requests.post(
            f"{backend_url}/api/users/",
            json=test_user_data,
            cookies=response.cookies
        )
        
        print(f"Create user response: {response.status_code}")
        if response.status_code in [200, 201]:
            print("✅ Test user created successfully!")
            print(f"Username: {test_user_data['username']}")
            print(f"Password: {test_user_data['password']}")
            print(f"Role: {test_user_data['role']}")
        else:
            print(f"❌ Failed to create user: {response.status_code}")
            print(f"Response: {response.text}")
            
            # Try alternative approach - test if user exists
            print("\nTesting if user already exists...")
            test_login_data = {
                'username': test_user_data['username'],
                'password': test_user_data['password']
            }
            
            response = requests.post(
                f"{backend_url}/api/users/login/",
                json=test_login_data,
                cookies=response.cookies
            )
            
            if response.status_code == 200:
                print("✅ User already exists and login works!")
                data = response.json()
                print(f"User data: {data}")
            else:
                print(f"❌ User doesn't exist or password is wrong: {response.status_code}")
                
    except Exception as e:
        print(f"❌ Error creating test user: {e}")

if __name__ == "__main__":
    create_test_user() 