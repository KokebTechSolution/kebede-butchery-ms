#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Category, ItemType
from menu.models import MenuCategory

def check_and_create_categories():
    print("🔍 Checking categories in database...")
    
    # Check inventory categories
    print("\n📊 Inventory Categories:")
    inventory_categories = Category.objects.all()
    print(f"Found {inventory_categories.count()} inventory categories")
    for cat in inventory_categories:
        print(f"  - {cat.category_name} ({cat.item_type.type_name})")
    
    # Check menu categories
    print("\n📊 Menu Categories:")
    menu_categories = MenuCategory.objects.all()
    print(f"Found {menu_categories.count()} menu categories")
    for cat in menu_categories:
        print(f"  - {cat.name}")
    
    # Check item types
    print("\n📊 Item Types:")
    item_types = ItemType.objects.all()
    print(f"Found {item_types.count()} item types")
    for it in item_types:
        print(f"  - {it.type_name}")
    
    # Create some test data if none exists
    if inventory_categories.count() == 0:
        print("\n➕ Creating test categories...")
        
        # Create item types if they don't exist
        beverage_type, created = ItemType.objects.get_or_create(type_name='Beverage')
        food_type, created = ItemType.objects.get_or_create(type_name='Food')
        
        # Create some categories
        categories_data = [
            ('Soft Drinks', beverage_type),
            ('Beer', beverage_type),
            ('Wine', beverage_type),
            ('Spirits', beverage_type),
            ('Main Course', food_type),
            ('Appetizers', food_type),
            ('Desserts', food_type),
        ]
        
        for cat_name, item_type in categories_data:
            category, created = Category.objects.get_or_create(
                category_name=cat_name,
                item_type=item_type
            )
            if created:
                print(f"  ✅ Created: {cat_name}")
            else:
                print(f"  ℹ️  Already exists: {cat_name}")
    
    print("\n✅ Category check complete!")

if __name__ == '__main__':
    check_and_create_categories() 