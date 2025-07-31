#!/usr/bin/env python3
"""
Test script to test all the role-based users created in the management command
"""

import requests
import json

def test_role_users():
    """Test all the role-based users"""
    
    print("Testing Role-Based Users")
    print("=" * 60)
    
    # Users created in the management command
    users = [
        {"username": "waiter_user1", "first_name": "Ali", "role": "waiter"},
        {"username": "bartender_user1", "first_name": "Beka", "role": "bartender"},
        {"username": "store_user1", "first_name": "Sami", "role": "meat"},
        {"username": "cashier_user1", "first_name": "Mahi", "role": "cashier"},
        {"username": "inventory_user1", "first_name": "Hana", "role": "manager"},
        {"username": "kitchen_user1", "first_name": "Fira", "role": "meat"},
        {"username": "account_user1", "first_name": "Lomi", "role": "owner"},
        {"username": "admin_user1", "first_name": "Zaki", "role": "owner"},
        {"username": "waiter_user2", "first_name": "Sara", "role": "waiter"},
        {"username": "bartender_user2", "first_name": "Jonas", "role": "bartender"},
        {"username": "store_user2", "first_name": "Saba", "role": "meat"},
        {"username": "cashier_user2", "first_name": "Ruth", "role": "cashier"},
    ]
    
    # Common passwords to try
    passwords_to_try = [
        "testpass123",
        "password",
        "123456",
        "admin",
        "user",
        "waiter",
        "bartender",
        "cashier",
        "manager",
        "owner",
        "meat",
        "store",
        "kitchen",
        "inventory",
        "account",
        "kebede",
        "butchery",
        "pos",
        "system",
        "default",
        "user123",
        "pass123",
        "test123",
        "demo123",
        "sample123"
    ]
    
    backend_url = "https://kebede-butchery-ms.onrender.com"
    
    print(f"Testing {len(users)} users with {len(passwords_to_try)} passwords each...")
    print("This may take a while...")
    
    working_credentials = []
    
    for user in users:
        print(f"\nTesting user: {user['username']} ({user['first_name']} - {user['role']})")
        
        # Get CSRF token
        try:
            response = requests.get(f"{backend_url}/api/users/csrf/")
            if response.status_code != 200:
                print(f"❌ CSRF failed for {user['username']}")
                continue
        except Exception as e:
            print(f"❌ CSRF error for {user['username']}: {e}")
            continue
        
        # Try each password
        for password in passwords_to_try:
            try:
                login_data = {
                    'username': user['username'],
                    'password': password
                }
                
                response = requests.post(
                    f"{backend_url}/api/users/login/",
                    json=login_data,
                    cookies=response.cookies
                )
                
                if response.status_code == 200:
                    print(f"✅ SUCCESS: {user['username']} / {password}")
                    data = response.json()
                    working_credentials.append({
                        'username': user['username'],
                        'password': password,
                        'first_name': user['first_name'],
                        'role': user['role'],
                        'user_data': data
                    })
                    break
                elif response.status_code == 401:
                    # Wrong password, continue
                    continue
                else:
                    print(f"❌ Unexpected response for {user['username']}: {response.status_code}")
                    break
                    
            except Exception as e:
                print(f"❌ Error testing {user['username']} with {password}: {e}")
                continue
    
    # Print results
    print("\n" + "=" * 60)
    print("WORKING CREDENTIALS:")
    print("=" * 60)
    
    if working_credentials:
        for cred in working_credentials:
            print(f"Username: {cred['username']}")
            print(f"Password: {cred['password']}")
            print(f"Name: {cred['first_name']}")
            print(f"Role: {cred['role']}")
            print(f"User ID: {cred['user_data'].get('id', 'N/A')}")
            print("-" * 40)
    else:
        print("❌ No working credentials found!")
        print("\nPossible issues:")
        print("1. The password hash in the management command might be incorrect")
        print("2. The users might not have been created properly")
        print("3. The password might be different than expected")
        
        print("\nTrying to create a test user with known password...")
        create_test_user_with_known_password()

def create_test_user_with_known_password():
    """Create a test user with a known password"""
    
    print("\nCreating test user with known password...")
    
    backend_url = "https://kebede-butchery-ms.onrender.com"
    
    # Get CSRF token
    try:
        response = requests.get(f"{backend_url}/api/users/csrf/")
        if response.status_code != 200:
            print("❌ CSRF failed")
            return
    except Exception as e:
        print(f"❌ CSRF error: {e}")
        return
    
    # Try to create a test user via API (if endpoint exists)
    test_user_data = {
        'username': 'test_waiter',
        'password': 'testpass123',
        'first_name': 'Test',
        'last_name': 'Waiter',
        'email': 'test_waiter@example.com',
        'role': 'waiter',
        'phone_number': '0912345678'
    }
    
    try:
        response = requests.post(
            f"{backend_url}/api/users/",
            json=test_user_data,
            cookies=response.cookies
        )
        
        if response.status_code == 201:
            print("✅ Test user created successfully!")
            print(f"Username: {test_user_data['username']}")
            print(f"Password: {test_user_data['password']}")
        else:
            print(f"❌ Failed to create test user: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error creating test user: {e}")

if __name__ == "__main__":
    test_role_users() 