#!/usr/bin/env python3
"""
Simple test script to verify database operations
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from orders.models import Order, OrderItem

def test_order_update():
    """Test order update functionality"""
    try:
        # Get the first order
        order = Order.objects.first()
        if not order:
            print("No orders found in database")
            return
        
        print(f"Testing with order {order.id} ({order.order_number})")
        print(f"Current items: {list(order.items.values())}")
        print(f"Current total: {order.total_money}")
        
        # Delete existing items
        deleted_count = order.items.all().delete()[0]
        print(f"Deleted {deleted_count} existing items")
        
        # Create new item
        new_item = OrderItem.objects.create(
            order=order,
            name="TEST_PEPSI",
            quantity=5,
            price=50.00,
            item_type="beverage",
            status="pending"
        )
        print(f"Created new item: {new_item.id} - {new_item.name} x {new_item.quantity}")
        
        # Update order total
        order.total_money = new_item.price * new_item.quantity
        order.save()
        print(f"Updated order total to: {order.total_money}")
        
        # Refresh from database
        order.refresh_from_db()
        print(f"After refresh - Total: {order.total_money}")
        print(f"After refresh - Items: {list(order.items.values())}")
        
        # Clean up
        new_item.delete()
        order.total_money = 0
        order.save()
        print("Test completed successfully")
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_order_update()


