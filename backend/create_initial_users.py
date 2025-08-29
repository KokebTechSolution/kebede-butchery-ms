#!/usr/bin/env python
"""
Script to create initial users for the production database.
Run this after deployment to set up initial user accounts.
"""
import os
import sys
import django

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings_prod')
django.setup()

from users.models import User
from branches.models import Branch

def create_initial_users():
    """Create initial users for testing and admin access."""
    
    # Create a default branch if none exists
    branch, created = Branch.objects.get_or_create(
        name='Main Branch',
        defaults={
            'location': 'Main Location',
            'phone': '123-456-7890'
        }
    )
    if created:
        print("✅ Created Main Branch")
    
    # Create superuser/owner
    if not User.objects.filter(username='admin').exists():
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@kebedebutchery.com',
            password='admin123',
            role='owner',
            branch=branch
        )
        print("✅ Created admin user (username: admin, password: admin123)")
    
    # Create test waiter
    if not User.objects.filter(username='waiter1').exists():
        waiter_user = User.objects.create_user(
            username='waiter1',
            email='waiter1@kebedebutchery.com',
            password='waiter123',
            role='waiter',
            branch=branch
        )
        print("✅ Created waiter1 user (username: waiter1, password: waiter123)")
    
    # Create test manager
    if not User.objects.filter(username='manager1').exists():
        manager_user = User.objects.create_user(
            username='manager1',
            email='manager1@kebedebutchery.com',
            password='manager123',
            role='manager',
            branch=branch
        )
        print("✅ Created manager1 user (username: manager1, password: manager123)")
    
    print("\n🎉 Initial users created successfully!")
    print("You can now log in with:")
    print("  - admin/admin123 (Owner)")
    print("  - waiter1/waiter123 (Waiter)")
    print("  - manager1/manager123 (Manager)")

if __name__ == '__main__':
    create_initial_users()
