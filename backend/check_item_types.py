#!/usr/bin/env python
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from menu.models import MenuItem
from orders.models import Order, OrderItem

def check_item_types():
    print("🔍 Checking MenuItem item_types...")
    print("=" * 50)
    
    # Check MenuItem model
    menu_items = MenuItem.objects.all()
    for item in menu_items:
        print(f"📋 {item.name}: {item.item_type}")
    
    print("\n🔍 Checking OrderItem item_types...")
    print("=" * 50)
    
    # Check OrderItem model
    order_items = OrderItem.objects.all()
    for item in order_items:
        print(f"📦 {item.name}: {item.item_type} (Order: {item.order.order_number})")
    
    print("\n🔍 Checking specific problematic items...")
    print("=" * 50)
    
    # Check specific items
    ktfo_items = MenuItem.objects.filter(name__icontains='ktfo')
    newww_items = MenuItem.objects.filter(name__icontains='newww')
    
    print(f"KtFO items: {[f'{item.name}: {item.item_type}' for item in ktfo_items]}")
    print(f"NEWWW items: {[f'{item.name}: {item.item_type}' for item in newww_items]}")
    
    # Check orders with mixed items
    print("\n🔍 Checking orders with mixed item types...")
    print("=" * 50)
    
    orders = Order.objects.all()
    for order in orders:
        food_count = order.food_items.count()
        beverage_count = order.beverage_items.count()
        if food_count > 0 and beverage_count > 0:
            print(f"Order {order.order_number}: {food_count} food + {beverage_count} beverage items")
            print(f"  Food: {[item.name for item in order.food_items]}")
            print(f"  Beverage: {[item.name for item in order.beverage_items]}")

if __name__ == "__main__":
    check_item_types()
