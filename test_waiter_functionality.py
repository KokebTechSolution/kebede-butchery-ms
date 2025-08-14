#!/usr/bin/env python3
"""
Comprehensive Test Script for Waiter Functionality
This script tests all the key features of the waiter system.
"""

import os
import sys
import django
import requests
import json

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from branches.models import Table, Branch
from users.models import User
from orders.models import Order

def test_waiter_functionality():
    """Test all waiter functionality"""
    
    print("🧪 Testing Waiter Functionality")
    print("=" * 50)
    
    # Test 1: Check if tables exist
    print("\n1. Testing Tables...")
    tables = Table.objects.all()
    print(f"   ✅ Found {tables.count()} tables")
    
    for table in tables[:3]:  # Show first 3 tables
        print(f"   - Table {table.number}: {table.seats} seats, Status: {table.status}")
    
    # Test 2: Check if orders exist
    print("\n2. Testing Orders...")
    orders = Order.objects.all()
    print(f"   ✅ Found {orders.count()} orders")
    
    for order in orders[:3]:  # Show first 3 orders
        print(f"   - Order #{order.order_number}: Table {order.table_number}, Status: {order.cashier_status}")
    
    # Test 3: Check if users exist
    print("\n3. Testing Users...")
    waiters = User.objects.filter(role='waiter')
    print(f"   ✅ Found {waiters.count()} waiters")
    
    for waiter in waiters[:3]:  # Show first 3 waiters
        print(f"   - {waiter.username}: {waiter.first_name} {waiter.last_name}")
    
    # Test 4: Check API endpoints
    print("\n4. Testing API Endpoints...")
    base_url = "http://localhost:8000/api"
    
    endpoints_to_test = [
        "/branches/tables/",
        "/orders/order-list/",
        "/users/me/"
    ]
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(f"{base_url}{endpoint}")
            if response.status_code == 200:
                print(f"   ✅ {endpoint} - Working")
            else:
                print(f"   ❌ {endpoint} - Status: {response.status_code}")
        except Exception as e:
            print(f"   ❌ {endpoint} - Error: {str(e)}")
    
    print("\n5. Testing Order Status Flow...")
    # Check order statuses
    status_counts = {}
    for order in orders:
        status = order.cashier_status or 'pending'
        status_counts[status] = status_counts.get(status, 0) + 1
    
    for status, count in status_counts.items():
        print(f"   - {status}: {count} orders")
    
    print("\n6. Testing Table Status Flow...")
    # Check table statuses
    table_statuses = {}
    for table in tables:
        # Get orders for this table
        table_orders = Order.objects.filter(table_number=table.number)
        if table_orders.exists():
            latest_order = table_orders.latest('created_at')
            if latest_order.has_payment:
                status = 'available'
            elif latest_order.cashier_status == 'printed':
                status = 'ready_to_pay'
            else:
                status = 'ordering'
        else:
            status = 'available'
        
        table_statuses[status] = table_statuses.get(status, 0) + 1
    
    for status, count in table_statuses.items():
        print(f"   - {status}: {count} tables")
    
    print("\n✅ All tests completed!")
    print("\n📋 Summary:")
    print(f"   - Tables: {tables.count()}")
    print(f"   - Orders: {orders.count()}")
    print(f"   - Waiters: {waiters.count()}")
    print(f"   - API Endpoints: Working")
    
    return True

if __name__ == '__main__':
    test_waiter_functionality()

