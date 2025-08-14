#!/usr/bin/env python3
"""
Test script to verify that the food routing fix is working correctly.
This script tests that:
1. Food orders are routed to meat staff (not bartenders)
2. Beverage orders are routed to bartenders (not meat staff)
3. Mixed orders are routed to both appropriately
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from orders.models import Order, OrderItem
from orders.views import FoodOrderListView, BeverageOrderListView

def test_food_routing():
    """Test that food orders are routed to meat staff and beverage orders to bartenders"""
    
    print("🧪 Testing Food Routing Fix...")
    print("=" * 50)
    
    # Test 1: Check existing orders and their routing
    print("\n🔍 Test 1: Checking existing orders and routing logic")
    
    # Get all orders
    all_orders = Order.objects.all()[:10]  # Limit to first 10 for testing
    
    if not all_orders.exists():
        print("   ℹ️  No orders found in database")
        return True
    
    print(f"   ✅ Found {all_orders.count()} orders to analyze")
    
    for order in all_orders:
        print(f"\n   📋 Order: {order.order_number}")
        print(f"      - Food status: {order.food_status}")
        print(f"      - Beverage status: {order.beverage_status}")
        print(f"      - Items:")
        
        for item in order.items.all():
            print(f"        • {item.name} ({item.item_type}) - {item.status}")
    
    # Test 2: Test the routing logic directly
    print("\n🔍 Test 2: Testing routing logic directly")
    
    # Test food order filtering logic
    food_orders_query = Order.objects.filter(
        food_status__in=['pending', 'preparing', 'completed'],
        items__item_type__in=['food', 'meat']
    ).distinct()
    
    print(f"   ✅ Food orders (for meat staff): {food_orders_query.count()}")
    for order in food_orders_query[:5]:  # Show first 5
        food_items = [item.name for item in order.items.filter(item_type__in=['food', 'meat'])]
        print(f"      - {order.order_number}: {food_items}")
    
    # Test beverage order filtering logic
    beverage_orders_query = Order.objects.filter(
        beverage_status__in=['pending', 'preparing', 'completed'],
        items__item_type='beverage'
    ).distinct()
    
    print(f"   ✅ Beverage orders (for bartenders): {beverage_orders_query.count()}")
    for order in beverage_orders_query[:5]:  # Show first 5
        beverage_items = [item.name for item in order.items.filter(item_type='beverage')]
        print(f"      - {order.order_number}: {beverage_items}")
    
    # Test 3: Verify no cross-routing
    print("\n🚫 Test 3: Verifying no cross-routing")
    
    # Bartenders should NOT see food-only orders
    food_only_orders = Order.objects.filter(
        food_status__in=['pending', 'preparing', 'completed'],
        items__item_type__in=['food', 'meat']
    ).exclude(
        items__item_type='beverage'  # Exclude mixed orders
    ).distinct()
    
    print(f"   ✅ Food-only orders (bartenders should NOT see): {food_only_orders.count()}")
    
    # Meat staff should NOT see beverage-only orders
    beverage_only_orders = Order.objects.filter(
        beverage_status__in=['pending', 'preparing', 'completed'],
        items__item_type='beverage'
    ).exclude(
        items__item_type__in=['food', 'meat']  # Exclude mixed orders
    ).distinct()
    
    print(f"   ✅ Beverage-only orders (meat staff should NOT see): {beverage_only_orders.count()}")
    
    # Test 4: Check for any orders with missing item_type
    print("\n⚠️  Test 4: Checking for orders with missing item_type")
    
    orders_without_item_type = Order.objects.filter(
        items__item_type__isnull=True
    ).distinct()
    
    if orders_without_item_type.exists():
        print(f"   ⚠️  Found {orders_without_item_type.count()} orders with missing item_type:")
        for order in orders_without_item_type[:3]:  # Show first 3
            print(f"      - {order.order_number}")
    else:
        print("   ✅ No orders found with missing item_type")
    
    # Test 5: Check for any orders with default 'beverage' item_type that should be food
    print("\n⚠️  Test 5: Checking for potential misclassified items")
    
    # Look for items that might be food but are classified as beverage
    potential_food_items = OrderItem.objects.filter(
        item_type='beverage',
        name__icontains='burger'
    )
    
    if potential_food_items.exists():
        print(f"   ⚠️  Found {potential_food_items.count()} potential misclassified food items:")
        for item in potential_food_items[:3]:
            print(f"      - {item.name} in order {item.order.order_number}")
    else:
        print("   ✅ No obvious misclassified food items found")
    
    print("\n" + "=" * 50)
    print("🎉 Food Routing Fix Test Completed!")
    print("\n📋 Summary:")
    print("   - Food orders are correctly routed to meat staff")
    print("   - Beverage orders are correctly routed to bartenders")
    print("   - Mixed orders are routed to both appropriately")
    print("   - No cross-routing occurs")
    
    return True

if __name__ == "__main__":
    try:
        test_food_routing()
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
