#!/usr/bin/env python3
"""
Test script to verify the edit_order function works correctly.
This tests the exact process specified in the requirements.
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from orders.models import Order, OrderItem, OrderUpdate
from orders.utils import edit_order, check_order_update_completion, get_order_display_items
from users.models import User
from branches.models import Table, Branch
from decimal import Decimal

def test_edit_order_function():
    """Test the edit_order function according to specifications"""
    print("🧪 Testing edit_order Function")
    print("=" * 50)
    
    try:
        # Get existing test data
        branch = Branch.objects.first()
        if not branch:
            print("❌ No branches found in database")
            return
        
        table, _ = Table.objects.get_or_create(
            number=999,
            branch=branch,
            defaults={'seats': 4}
        )
        
        waiter = User.objects.filter(role='waiter').first()
        if not waiter:
            print("❌ No waiter users found in database")
            return
        
        print(f"✅ Using branch: {branch.name}")
        print(f"✅ Using table: {table.number}")
        print(f"✅ Using waiter: {waiter.username}")
        
        # Step 1: Create a test order with mixed status items
        print("\n📝 Step 1: Creating test order with mixed status items...")
        
        order = Order.objects.create(
            order_number="TEST-EDIT-001",
            table=table,
            created_by=waiter,
            branch=branch,
            beverage_status='completed',
            food_status='completed',
            total_money=Decimal('25.00')
        )
        
        # Add accepted items (these should be preserved)
        accepted_beverage = OrderItem.objects.create(
            order=order,
            name="Accepted Beer",
            quantity=2,
            price=Decimal('5.00'),
            item_type='beverage',
            status='accepted'
        )
        
        accepted_food = OrderItem.objects.create(
            order=order,
            name="Accepted Burger",
            quantity=1,
            price=Decimal('15.00'),
            item_type='food',
            status='accepted'
        )
        
        # Add pending items (these should be removed)
        pending_beverage = OrderItem.objects.create(
            order=order,
            name="Pending Wine",
            quantity=1,
            price=Decimal('8.00'),
            item_type='beverage',
            status='pending'
        )
        
        print(f"✅ Created test order: {order.order_number}")
        print(f"   - Accepted items: {accepted_beverage.name}, {accepted_food.name}")
        print(f"   - Pending items: {pending_beverage.name}")
        print(f"   - Initial total: ${order.total_money}")
        
        # Step 2: Test the edit_order function
        print("\n📝 Step 2: Testing edit_order function...")
        
        new_items = [
            {
                'name': 'New Pizza',
                'quantity': 2,
                'price': Decimal('12.00'),
                'item_type': 'food'
            },
            {
                'name': 'New Coffee',
                'quantity': 3,
                'price': Decimal('3.50'),
                'item_type': 'beverage'
            }
        ]
        
        print(f"   - Adding new items: {[item['name'] for item in new_items]}")
        
        # Call edit_order function
        result = edit_order(
            order_id=order.id,
            new_items=new_items,
            user=waiter
        )
        
        if not result['success']:
            print(f"❌ edit_order failed: {result['error']}")
            return
        
        print(f"✅ edit_order successful!")
        print(f"   - Order update ID: {result['order_update_id']}")
        print(f"   - Update type: {result['update_type']}")
        print(f"   - Accepted items preserved: {result['accepted_items_preserved']}")
        print(f"   - Pending items removed: {result['pending_items_removed']}")
        print(f"   - New items added: {result['new_items_added']}")
        print(f"   - Total addition cost: ${result['total_addition_cost']}")
        print(f"   - New total money: ${result['new_total_money']}")
        
        # Step 3: Verify the database state
        print("\n📝 Step 3: Verifying database state...")
        
        # Refresh order from database
        order.refresh_from_db()
        
        # Check order statuses
        print(f"   - Order food_status: {order.food_status}")
        print(f"   - Order beverage_status: {order.beverage_status}")
        print(f"   - Order total_money: ${order.total_money}")
        
        # Check items
        all_items = order.items.all()
        accepted_items = [item for item in all_items if item.status == 'accepted']
        pending_items = [item for item in all_items if item.status == 'pending']
        
        print(f"   - Total items: {len(all_items)}")
        print(f"   - Accepted items: {len(accepted_items)}")
        print(f"   - Pending items: {len(pending_items)}")
        
        # Verify accepted items are preserved
        accepted_names = [item.name for item in accepted_items]
        print(f"   - Accepted items: {accepted_names}")
        
        # Verify pending items are new
        pending_names = [item.name for item in pending_items]
        print(f"   - Pending items: {pending_names}")
        
        # Step 4: Check OrderUpdate record
        print("\n📝 Step 4: Checking OrderUpdate record...")
        
        try:
            order_update = OrderUpdate.objects.get(id=result['order_update_id'])
            print(f"✅ OrderUpdate record created successfully")
            print(f"   - ID: {order_update.id}")
            print(f"   - Type: {order_update.update_type}")
            print(f"   - Status: {order_update.status}")
            print(f"   - Total addition cost: ${order_update.total_addition_cost}")
            print(f"   - Items changes: {order_update.items_changes}")
        except OrderUpdate.DoesNotExist:
            print("❌ OrderUpdate record not found")
            return
        
        # Step 5: Test acceptance logic
        print("\n📝 Step 5: Testing acceptance logic...")
        
        # Accept all pending items
        for item in pending_items:
            item.status = 'accepted'
            item.save()
            print(f"   - Accepted item: {item.name}")
        
        # Check if order update is marked as completed
        completion_result = check_order_update_completion(order_update.id)
        print(f"   - Order update completion check: {completion_result}")
        
        # Refresh order update
        order_update.refresh_from_db()
        print(f"   - Order update status after completion: {order_update.status}")
        
        # Step 6: Test order display function
        print("\n📝 Step 6: Testing order display function...")
        
        display_result = get_order_display_items(order.id)
        
        if 'error' in display_result:
            print(f"❌ get_order_display_items failed: {display_result['error']}")
        else:
            print(f"✅ Order display data retrieved successfully")
            print(f"   - Order ID: {display_result['order_id']}")
            print(f"   - Total items: {display_result['total_items_count']}")
            print(f"   - Accepted items: {display_result['accepted_items_count']}")
            print(f"   - Pending items: {display_result['pending_items_count']}")
            print(f"   - Order updates: {len(display_result['order_updates'])}")
        
        # Step 7: Final verification
        print("\n📝 Step 7: Final verification...")
        
        # Verify final order state
        order.refresh_from_db()
        final_items = order.items.all()
        final_accepted = [item for item in final_items if item.status == 'accepted']
        final_pending = [item for item in final_items if item.status == 'pending']
        
        print(f"   - Final order total: ${order.total_money}")
        print(f"   - Final accepted items: {len(final_accepted)}")
        print(f"   - Final pending items: {len(final_pending)}")
        
        # Expected results
        expected_accepted = 4  # 2 original accepted + 2 new accepted
        expected_total = Decimal('25.00') + Decimal('12.00') * 2 + Decimal('3.50') * 3
        
        print(f"\n📊 Expected vs Actual Results:")
        print(f"   - Expected accepted items: {expected_accepted}, Actual: {len(final_accepted)}")
        print(f"   - Expected total: ${expected_total}, Actual: ${order.total_money}")
        
        if len(final_accepted) == expected_accepted and order.total_money == expected_total:
            print("✅ All tests passed! The edit_order function works correctly.")
        else:
            print("❌ Some tests failed. Check the implementation.")
        
        # Cleanup
        print("\n🧹 Cleaning up test data...")
        order.delete()
        print("✅ Test cleanup completed")
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_edit_order_function()









