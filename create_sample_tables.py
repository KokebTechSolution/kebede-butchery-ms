#!/usr/bin/env python3
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from branches.models import Table, Branch
from users.models import User

def create_sample_tables():
    # Get or create a branch
    branch, created = Branch.objects.get_or_create(
        name='Main Branch',
        defaults={
            'city': 'Addis Ababa',
            'subcity': 'Bole',
            'wereda': 'Wereda 3',
            'location': '123 Main Street'
        }
    )
    
    # Get or create a waiter user
    waiter, created = User.objects.get_or_create(
        username='waiter1',
        defaults={
            'email': 'waiter1@kebede.com',
            'first_name': 'John',
            'last_name': 'Waiter',
            'role': 'waiter',
            'branch': branch
        }
    )
    
    if created:
        waiter.set_password('password123')
        waiter.save()
        print(f"Created waiter user: {waiter.username}")
    
    # Create sample tables
    tables_data = [
        {'number': 1, 'seats': 4},
        {'number': 2, 'seats': 6},
        {'number': 3, 'seats': 4},
        {'number': 4, 'seats': 8},
        {'number': 5, 'seats': 4},
        {'number': 6, 'seats': 6},
        {'number': 7, 'seats': 4},
        {'number': 8, 'seats': 8},
    ]
    
    created_tables = []
    for table_data in tables_data:
        table, created = Table.objects.get_or_create(
            number=table_data['number'],
            created_by=waiter,
            defaults={
                'branch': branch,
                'seats': table_data['seats'],
                'status': 'available'
            }
        )
        
        if created:
            created_tables.append(table)
            print(f"Created table {table.number} with {table.seats} seats")
        else:
            print(f"Table {table.number} already exists")
    
    print(f"\nTotal tables created: {len(created_tables)}")
    print(f"Total tables in database: {Table.objects.count()}")
    
    return created_tables

if __name__ == '__main__':
    create_sample_tables()
