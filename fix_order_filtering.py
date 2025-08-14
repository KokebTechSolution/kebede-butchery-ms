#!/usr/bin/env python3
"""
Comprehensive Fix Script for Order Filtering Issues

This script fixes:
1. KtFO item_type from 'beverage' to 'food'
2. Verifies order filtering is working correctly
3. Checks for any other data inconsistencies

Usage:
    python manage.py shell
    exec(open('fix_order_filtering.py').read())
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from menu.models import MenuItem
from orders.models import Order, OrderItem

def fix_order_filtering_issues():
    """Fix all order filtering issues"""
    
    print("🔧 Starting comprehensive order filtering fix...")
    print("=" * 60)
    
    # Fix 1: Fix KtFO item type
    print("\n1️⃣ Fixing KtFO item type...")
    fix_ktfo_item_type()
    
    # Fix 2: Verify order filtering
    print("\n2️⃣ Verifying order filtering...")
    verify_order_filtering()
    
    # Fix 3: Check for other inconsistencies
    print("\n3️⃣ Checking for other data inconsistencies...")
    check_data_consistency()
    
    print("\n🎯 All fixes completed!")

def fix_ktfo_item_type():
    """Fix KtFO item type from beverage to food"""
    
    # Find KtFO items (check both English and Amharic names)
    ktfo_items = MenuItem.objects.filter(
        name__in=['KtFO', 'ክትፎ', 'ktfo', 'Ktfo']
    )
    
    print(f"Found {ktfo_items.count()} KtFO items:")
    
    for item in ktfo_items:
        print(f"  - ID: {item.id}")
        print(f"    Name: '{item.name}'")
        print(f"    Current item_type: '{item.item_type}'")
        print(f"    Category: '{item.category.name if item.category else 'None'}'")
        print(f"    Price: {item.price}")
        print(f"    Is Available: {item.is_available}")
        
        # Fix the item type if it's wrong
        if item.item_type != 'food':
            old_type = item.item_type
            item.item_type = 'food'
            item.save()
            print(f"    ✅ Fixed: Changed item_type from '{old_type}' to 'food'")
        else:
            print(f"    ✅ Already correct: item_type is 'food'")
        
        print()
    
    # Also check for any other food items that might be incorrectly marked as beverages
    food_items_marked_as_beverages = MenuItem.objects.filter(
        item_type='beverage',
        name__in=[
            'ጥብስ', 'ጥሬ ስጋ', 'ዱለት', 'ሸክላ ጥብስ', 
            'ክትፎ', 'ጎመን በስጋ', 'አሳ', 'ጥብስ በወጥ', 
            'የበግ ጥብስ', 'ጋዝ ላይት'
        ]
    )
    
    if food_items_marked_as_beverages.exists():
        print(f"🚨 Found {food_items_marked_as_beverages.count()} food items incorrectly marked as beverages:")
        
        for item in food_items_marked_as_beverages:
            print(f"  - {item.name} (ID: {item.id})")
            old_type = item.item_type
            item.item_type = 'food'
            item.save()
            print(f"    ✅ Fixed: Changed from '{old_type}' to 'food'")
    
    # Check for beverage items incorrectly marked as food
    beverage_items_marked_as_food = MenuItem.objects.filter(
        item_type='food',
        name__in=[
            'Pepsi', 'Mirinda', 'Coffee', 'Tea', 'Iced Tea', 'Lemonade', 'Soda', 'Fruit Punch', 'Hot Chocolate'
        ]
    )
    
    if beverage_items_marked_as_food.exists():
        print(f"🚨 Found {beverage_items_marked_as_food.count()} beverage items incorrectly marked as food:")
        
        for item in beverage_items_marked_as_food:
            print(f"  - {item.name} (ID: {item.id})")
            old_type = item.item_type
            item.item_type = 'beverage'
            item.save()
            print(f"    ✅ Fixed: Changed from '{old_type}' to 'beverage'")

def verify_order_filtering():
    """Verify that order filtering is working correctly"""
    
    print("🔍 Verifying order filtering...")
    
    # Get a sample order with mixed items
    mixed_orders = Order.objects.filter(
        items__item_type='food'
    ).filter(
        items__item_type='beverage'
    ).distinct()
    
    if mixed_orders.exists():
        print(f"Found {mixed_orders.count()} orders with mixed items (food + beverage):")
        
        for order in mixed_orders[:3]:  # Show first 3
            print(f"\n  Order #{order.order_number} (Table {order.table.number if order.table else 'N/A'}):")
            
            food_items = order.items.filter(item_type='food')
            beverage_items = order.items.filter(item_type='beverage')
            
            print(f"    Food items ({food_items.count()}):")
            for item in food_items:
                print(f"      - {item.name} x{item.quantity} (ETB {item.price})")
            
            print(f"    Beverage items ({beverage_items.count()}):")
            for item in beverage_items:
                print(f"      - {item.name} x{item.quantity} (ETB {item.price})")
            
            print(f"    Food status: {order.food_status}")
            print(f"    Beverage status: {order.beverage_status}")
    else:
        print("No mixed orders found.")

def check_data_consistency():
    """Check for other data inconsistencies"""
    
    print("🔍 Checking data consistency...")
    
    # Check for orders with mismatched statuses
    orders_with_mismatched_statuses = Order.objects.filter(
        food_status='pending'
    ).filter(
        items__item_type='food'
    ).exclude(
        items__item_type='food'
    )
    
    if orders_with_mismatched_statuses.exists():
        print(f"🚨 Found {orders_with_mismatched_statuses.count()} orders with mismatched food statuses")
    
    # Check for orders with beverage status but no beverage items
    orders_with_beverage_status_no_items = Order.objects.filter(
        beverage_status='pending'
    ).exclude(
        items__item_type='beverage'
    )
    
    if orders_with_beverage_status_no_items.exists():
        print(f"🚨 Found {orders_with_beverage_status_no_items.count()} orders with beverage status but no beverage items")
    
    # Check for orders with food status but no food items
    orders_with_food_status_no_items = Order.objects.filter(
        food_status='pending'
    ).exclude(
        items__item_type='food'
    )
    
    if orders_with_food_status_no_items.exists():
        print(f"🚨 Found {orders_with_food_status_no_items.count()} orders with food status but no food items")
    
    # Check for items without item_type
    items_without_type = OrderItem.objects.filter(item_type__isnull=True)
    
    if items_without_type.exists():
        print(f"🚨 Found {items_without_type.count()} order items without item_type")
        
        for item in items_without_type[:5]:  # Show first 5
            print(f"  - Order {item.order.id}, Item: {item.name}, Price: {item.price}")
    
    print("✅ Data consistency check completed")

if __name__ == "__main__":
    fix_order_filtering_issues()

