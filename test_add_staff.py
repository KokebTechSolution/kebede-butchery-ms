#!/usr/bin/env python3
"""Test Add Staff functionality"""
import requests

BASE_URL = "http://localhost:8000"
headers = {'Origin': 'http://localhost:3000', 'Content-Type': 'application/json'}

def test_add_staff():
    session = requests.Session()
    
    print("👥 Testing Add Staff Functionality")
    print("=" * 40)
    
    # Step 1: Get CSRF token
    print("1️⃣ Getting CSRF token...")
    csrf_response = session.get(f"{BASE_URL}/api/users/csrf/", headers=headers)
    
    if csrf_response.status_code != 200:
        print(f"❌ CSRF request failed: {csrf_response.status_code}")
        return
    
    csrf_token = csrf_response.json().get('csrf_token')
    print(f"✅ CSRF token obtained: {csrf_token[:10] if csrf_token else 'None'}...")
    
    # Step 2: Login as manager
    print("\n2️⃣ Logging in as manager...")
    login_data = {
        "username": "manager_user1",
        "password": "1234"
    }
    
    login_response = session.post(
        f"{BASE_URL}/api/users/login/", 
        json=login_data, 
        headers=headers
    )
    
    if login_response.status_code == 200:
        print("✅ Manager login successful!")
        print(f"   User: {login_response.json().get('username', 'N/A')}")
        print(f"   Role: {login_response.json().get('role', 'N/A')}")
        
        # Step 3: Test Add Staff
        print("\n3️⃣ Testing Add Staff...")
        
        # Get branches first
        branches_response = session.get(f"{BASE_URL}/api/branches/", headers=headers)
        if branches_response.status_code == 200 and branches_response.json():
            branch_id = branches_response.json()[0]['id']
            print(f"✅ Found branch ID: {branch_id}")
            
            # Test adding a new staff member
            new_staff_data = {
                'username': 'test_staff_1',
                'first_name': 'Test',
                'last_name': 'Staff',
                'phone_number': '1234567890',
                'role': 'waiter',
                'branch': branch_id,
                'password': 'testpass123',
                'is_active': True
            }
            
            add_staff_headers = headers.copy()
            add_staff_headers['X-CSRFToken'] = csrf_token
            
            add_staff_response = session.post(
                f"{BASE_URL}/api/users/users/",
                json=new_staff_data,
                headers=add_staff_headers
            )
            
            print(f"✅ Add Staff response: {add_staff_response.status_code}")
            if add_staff_response.status_code == 201:
                print("🎉 SUCCESS! Staff member added successfully!")
                print(f"   Response: {add_staff_response.json()}")
            else:
                print(f"❌ Add Staff failed: {add_staff_response.text}")
        else:
            print("❌ No branches found")
    else:
        print(f"❌ Manager login failed: {login_response.status_code}")
    
    print("\n🎉 Add Staff test completed!")

if __name__ == "__main__":
    test_add_staff()








