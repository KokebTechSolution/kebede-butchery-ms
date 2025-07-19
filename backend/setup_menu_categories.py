#!/usr/bin/env python
"""
Simple script to set up menu categories for the Kebede Butchery system.
Run this script from the backend directory.
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from menu.models import MenuCategory
from inventory.models import Category as InventoryCategory

def setup_menu_categories():
    """Set up menu categories automatically"""
    print("Setting up menu categories for Kebede Butchery...")
    
    # Check if categories already exist
    if MenuCategory.objects.exists():
        print(f"Found {MenuCategory.objects.count()} existing menu categories:")
        for cat in MenuCategory.objects.all():
            print(f"  - {cat.name}")
        return
    
    # Try to create from inventory categories first
    if InventoryCategory.objects.exists():
        print("Creating menu categories from existing inventory categories...")
        create_from_inventory()
    else:
        print("No inventory categories found. Creating default menu categories...")
        create_default_categories()
    
    print("\nMenu categories setup complete!")

def create_from_inventory():
    """Create menu categories based on inventory categories"""
    inventory_categories = InventoryCategory.objects.all()
    
    for inv_cat in inventory_categories:
        menu_cat_name = generate_menu_category_name(inv_cat)
        
        if not MenuCategory.objects.filter(name=menu_cat_name).exists():
            MenuCategory.objects.create(name=menu_cat_name)
            print(f"Created: {menu_cat_name}")

def create_default_categories():
    """Create default menu categories"""
    # Simplified categories for waiter interface (FOOD and DRINK)
    default_categories = [
        # Main food categories
        'Main Dishes',
        'Appetizers', 
        'Desserts',
        'Snacks',
        'Sides',
        'Salads',
        'Soups',
        'Grilled Items',
        'Fried Items',
        'Pasta & Rice',
        'Bread & Pastries',
        
        # Main beverage categories
        'Alcoholic Drinks',
        'Non-Alcoholic Drinks',
        'Hot Drinks',
        'Cold Drinks',
        'Juices',
        'Smoothies',
        'Coffee & Tea',
        'Wine & Spirits',
        'Beer & Cider',
        'Soft Drinks',
        'Water',
    ]
    
    for cat_name in default_categories:
        if not MenuCategory.objects.filter(name=cat_name).exists():
            MenuCategory.objects.create(name=cat_name)
            print(f'Created: {cat_name}')

def generate_menu_category_name(inventory_category):
    """Generate appropriate menu category name from inventory category"""
    item_type = inventory_category.item_type.type_name.lower()
    category_name = inventory_category.category_name
    
    # Map inventory categories to menu categories
    if 'beverage' in item_type or 'drink' in item_type:
        if any(word in category_name.lower() for word in ['beer', 'wine', 'spirit', 'alcohol']):
            return 'Alcoholic Drinks'
        elif any(word in category_name.lower() for word in ['juice', 'soda', 'water', 'tea', 'coffee']):
            return 'Non-Alcoholic Drinks'
        else:
            return 'Beverages'
    elif 'food' in item_type:
        if any(word in category_name.lower() for word in ['main', 'entree', 'dish']):
            return 'Main Dishes'
        elif any(word in category_name.lower() for word in ['appetizer', 'starter', 'snack']):
            return 'Appetizers'
        elif any(word in category_name.lower() for word in ['dessert', 'sweet', 'cake']):
            return 'Desserts'
        elif any(word in category_name.lower() for word in ['salad', 'vegetable']):
            return 'Salads'
        elif any(word in category_name.lower() for word in ['soup', 'broth']):
            return 'Soups'
        elif any(word in category_name.lower() for word in ['bread', 'pastry', 'bun']):
            return 'Bread & Pastries'
        else:
            return 'Main Dishes'
    else:
        return category_name

if __name__ == '__main__':
    setup_menu_categories() 