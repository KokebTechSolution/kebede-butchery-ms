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

def check_data():
    print("=== BRANCHES ===")
    branches = Branch.objects.all()
    for branch in branches:
        print(f"ID: {branch.id}, Name: {branch.name}, City: {branch.city}")
    
    print("\n=== USERS ===")
    users = User.objects.all()
    for user in users:
        print(f"ID: {user.id}, Username: {user.username}, Role: {getattr(user, 'role', 'N/A')}, Branch: {getattr(user, 'branch', 'N/A')}")
    
    print("\n=== TABLES ===")
    tables = Table.objects.all()
    for table in tables:
        print(f"ID: {table.id}, Number: {table.number}, Branch: {table.branch.name}, Created by: {table.created_by.username if table.created_by else 'N/A'}")

if __name__ == '__main__':
    check_data()


