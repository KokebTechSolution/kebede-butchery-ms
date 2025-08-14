#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from menu.models import MenuItem, MenuCategory
from inventory.models import Product, Branch, Stock
from decimal import Decimal

def test_menu_fix():
    print("=== Testing Menu Fix ===")
    
    try:
        # Get test data
        bole_branch = Branch.objects.get(name='Bole Branch')
        coca_product = Product.objects.get(name='Coca')
        
        # Get or create menu category
        category, created = MenuCategory.objects.get_or_create(name='Test Category')
        if created:
            print(f"✅ Created menu category: {category.name}")
        
        # Create a test menu item
        menu_item = MenuItem.objects.create(
            name='Test Menu Item',
            description='Test description',
            price=Decimal('25.00'),
            item_type='beverage',
            category=category,
            product=coca_product,
            is_available=True
        )
        
        print(f"✅ Created menu item: {menu_item.name}")
        
        # Test the get_stock_for_branch method
        stock = menu_item.get_stock_for_branch(bole_branch.id)
        if stock:
            print(f"✅ Stock found for branch: {stock.quantity_in_base_units} base units")
        else:
            print("❌ No stock found for branch")
        
        # Test the is_running_out method
        is_running_out = menu_item.is_running_out(bole_branch.id)
        print(f"✅ Is running out: {is_running_out}")
        
        # Test the available_quantity_summary method
        summary = menu_item.available_quantity_summary(bole_branch.id)
        if summary:
            print(f"✅ Quantity summary: {summary}")
        else:
            print("❌ No quantity summary available")
        
        # Clean up
        menu_item.delete()
        if created:
            category.delete()
        print(f"\n✅ Test completed and cleaned up")
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_menu_fix() 