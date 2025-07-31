#!/usr/bin/env python3
"""
Script to create a test user with proper role information
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from branches.models import Branch

User = get_user_model()

def create_test_user():
    """Create a test user with proper role information"""
    
    print("Creating test user for frontend...")
    print("=" * 50)
    
    # Get or create the main branch
    branch, created = Branch.objects.get_or_create(
        id=1,
        defaults={
            'name': 'Main Branch',
            'location': 'HQ'
        }
    )
    print(f"Branch: {branch.name}")
    
    # Create a test user with waiter role
    user_data = {
        'username': 'waiter_test',
        'first_name': 'Test',
        'last_name': 'Waiter',
        'email': 'waiter_test@example.com',
        'password': 'testpass123',
        'phone_number': '0912345678',
        'role': 'waiter',
        'branch': branch,
        'is_staff': True,
        'is_active': True,
    }
    
    # Check if user already exists
    if User.objects.filter(username=user_data['username']).exists():
        user = User.objects.get(username=user_data['username'])
        print(f"User {user_data['username']} already exists, updating...")
        
        # Update user data
        for key, value in user_data.items():
            if key == 'password':
                user.password = make_password(value)
            else:
                setattr(user, key, value)
        user.save()
    else:
        # Create new user
        user = User.objects.create_user(
            username=user_data['username'],
            email=user_data['email'],
            password=user_data['password'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            phone_number=user_data['phone_number'],
            role=user_data['role'],
            branch=user_data['branch'],
            is_staff=user_data['is_staff'],
            is_active=user_data['is_active'],
        )
        print(f"Created new user: {user.username}")
    
    print(f"✅ User created/updated successfully!")
    print(f"Username: {user.username}")
    print(f"Password: {user_data['password']}")
    print(f"Role: {user.role}")
    print(f"Branch: {user.branch.name}")
    
    return user

if __name__ == "__main__":
    create_test_user() 