#!/usr/bin/env python3
"""
Test script to verify order update logic for new items
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from orders.models import Order, OrderItem
from orders.utils import update_order_with_validation
from users.models import User
from branches.models import Table, Branch

def test_order_update_logic():
    print("🧪 Testing Order Update Logic")
    print("=" * 50)
    
    try:
        # Get existing test data
        branch = Branch.objects.first()  # Use existing branch
        if not branch:
            print("❌ No branches found in database")
            return
        
        table, _ = Table.objects.get_or_create(
            number=999,
            branch=branch,
            defaults={'seats': 4}
        )
        
        waiter = User.objects.filter(role='waiter').first()  # Use existing waiter
        if not waiter:
            print("❌ No waiter users found in database")
            return
        
        # Create a test order with some accepted items
        order = Order.objects.create(
            order_number="TEST-001",
            table=table,
            created_by=waiter,
            branch=branch,
            beverage_status='completed',
            food_status='completed'
        )
        
        # Add some accepted items
        accepted_beverage = OrderItem.objects.create(
            order=order,
            name="Accepted Beer",
            quantity=2,
            price=5.00,
            item_type='beverage',
            status='accepted'
        )
        
        accepted_food = OrderItem.objects.create(
            order=order,
            name="Accepted Burger",
            quantity=1,
            price=10.00,
            item_type='food',
            status='accepted'
        )
        
        print(f"✅ Created test order: {order.order_number}")
        print(f"   - Beverage status: {order.beverage_status}")
        print(f"   - Food status: {order.food_status}")
        print(f"   - Items: {[f'{item.name} ({item.status})' for item in order.items.all()]}")
        
        # Test 1: Add new beverage item
        print(f"\n1. Testing: Add new beverage item")
        new_items = [
            {
                'name': 'New Wine',
                'quantity': 1,
                'price': 8.00,
                'item_type': 'beverage'
            }
        ]
        
        result = update_order_with_validation(order.id, new_items, waiter)
        print(f"   Result: {result['success']}")
        if result['success']:
            order.refresh_from_db()
            print(f"   - New beverage status: {order.beverage_status}")
            print(f"   - Items after update: {[f'{item.name} ({item.status})' for item in order.items.all()]}")
        else:
            print(f"   - Error: {result.get('error', 'Unknown error')}")
        
        # Test 2: Add new food item
        print(f"\n2. Testing: Add new food item")
        new_items = [
            {
                'name': 'New Pizza',
                'quantity': 1,
                'price': 15.00,
                'item_type': 'food'
            }
        ]
        
        result = update_order_with_validation(order.id, new_items, waiter)
        print(f"   Result: {result['success']}")
        if result['success']:
            order.refresh_from_db()
            print(f"   - New food status: {order.food_status}")
            print(f"   - Items after update: {[f'{item.name} ({item.status})' for item in order.items.all()]}")
        else:
            print(f"   - Error: {result.get('error', 'Unknown error')}")
        
        # Test 3: Verify status calculation methods
        print(f"\n3. Testing: Status calculation methods")
        print(f"   - has_pending_beverage_items(): {order.has_pending_beverage_items()}")
        print(f"   - has_pending_food_items(): {order.has_pending_food_items()}")
        print(f"   - calculate_beverage_status(): {order.calculate_beverage_status()}")
        print(f"   - calculate_food_status(): {order.calculate_food_status()}")
        
        # Clean up
        order.delete()
        print(f"\n✅ Test completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_order_update_logic()
