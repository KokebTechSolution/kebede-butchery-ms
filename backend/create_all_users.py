#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from users.models import User
from branches.models import Branch

def create_all_users():
    try:
        # Create a branch first
        branch, created = Branch.objects.get_or_create(
            name="Main Branch",
            defaults={
                'city': 'Addis Ababa',
                'subcity': 'Bole',
                'wereda': '01',
                'location': '123 Main Street'
            }
        )
        print(f"Branch: {branch.name}")

        # Define users to create
        users_data = [
            {
                'username': 'waiter_user1',
                'first_name': 'Ali',
                'last_name': 'Waiter',
                'email': 'waiter@example.com',
                'phone_number': '0911111111',
                'role': 'waiter',
                'password': 'password123'
            },
            {
                'username': 'cashier_user1',
                'first_name': 'Betty',
                'last_name': 'Cashier',
                'email': 'cashier@example.com',
                'phone_number': '0922222222',
                'role': 'cashier',
                'password': 'password123'
            },
            {
                'username': 'bartender_user1',
                'first_name': 'Charlie',
                'last_name': 'Bartender',
                'email': 'bartender@example.com',
                'phone_number': '0933333333',
                'role': 'bartender',
                'password': 'password123'
            },
            {
                'username': 'meat_user1',
                'first_name': 'David',
                'last_name': 'Butcher',
                'email': 'meat@example.com',
                'phone_number': '0944444444',
                'role': 'meat',
                'password': 'password123'
            },
            {
                'username': 'branch_manager1',
                'first_name': 'Eve',
                'last_name': 'Manager',
                'email': 'manager@example.com',
                'phone_number': '0955555555',
                'role': 'branch_manager',
                'password': 'password123'
            },
            {
                'username': 'admin',
                'first_name': 'Admin',
                'last_name': 'User',
                'email': 'admin@example.com',
                'phone_number': '0999999999',
                'role': 'owner',
                'password': 'admin123',
                'is_superuser': True
            }
        ]

        print("Creating users...")
        created_users = []
        for user_data in users_data:
            # Store password before removing it
            password = user_data['password']
            is_superuser = user_data.pop('is_superuser', False)
            
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    **user_data,
                    'branch': branch,
                    'is_staff': True,
                    'is_active': True,
                    'is_superuser': is_superuser
                }
            )
            
            if created:
                user.set_password(password)
                user.save()
                print(f"✅ Created user: {user.username}")
            else:
                user.set_password(password)
                user.save()
                print(f"✅ Updated user: {user.username}")
            
            print(f"   Password: {password}")
            print(f"   Role: {user.role}")
            print(f"   Branch: {user.branch.name}")
            print()
            
            # Store for final display
            created_users.append({
                'username': user_data['username'],
                'password': password,
                'role': user_data['role']
            })
            
        print("🎉 All users created successfully!")
        print("\n📋 Login Credentials:")
        print("=" * 40)
        for user in created_users:
            print(f"Username: {user['username']}")
            print(f"Password: {user['password']}")
            print(f"Role: {user['role']}")
            print("-" * 40)
        
    except Exception as e:
        print(f"❌ Error creating users: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    create_all_users() 