#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from users.models import User
from branches.models import Branch

def create_test_user():
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

        # Create a test user
        user, created = User.objects.get_or_create(
            username='waiter_user1',
            defaults={
                'first_name': 'Ali',
                'last_name': 'Waiter',
                'email': 'waiter@example.com',
                'phone_number': '0911111111',
                'role': 'waiter',
                'branch': branch,
                'is_staff': True,
                'is_active': True
            }
        )
        
        if created:
            user.set_password('password123')
            user.save()
            print(f"✅ Created user: {user.username}")
            print(f"   Password: password123")
            print(f"   Role: {user.role}")
            print(f"   Branch: {user.branch.name}")
        else:
            # Update password if user exists
            user.set_password('password123')
            user.save()
            print(f"✅ Updated user: {user.username}")
            print(f"   Password: password123")
            print(f"   Role: {user.role}")
            print(f"   Branch: {user.branch.name}")
            
        # Create an admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'email': 'admin@example.com',
                'phone_number': '0999999999',
                'role': 'owner',
                'branch': branch,
                'is_staff': True,
                'is_superuser': True,
                'is_active': True
            }
        )
        
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            print(f"✅ Created admin user: {admin_user.username}")
            print(f"   Password: admin123")
            print(f"   Role: {admin_user.role}")
        else:
            admin_user.set_password('admin123')
            admin_user.save()
            print(f"✅ Updated admin user: {admin_user.username}")
            print(f"   Password: admin123")
            print(f"   Role: {admin_user.role}")
            
        print("\n🎉 Test users created successfully!")
        print("You can now login with:")
        print("   Username: waiter_user1, Password: password123")
        print("   Username: admin, Password: admin123")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    create_test_user() 