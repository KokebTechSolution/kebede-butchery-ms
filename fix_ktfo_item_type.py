#!/usr/bin/env python3
"""
Django Management Command to Fix KtFO Item Type

This script fixes the item_type of KtFO from 'beverage' to 'food' in the database.

Usage:
    python manage.py shell
    exec(open('fix_ktfo_item_type.py').read())
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from menu.models import MenuItem

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
        print()
        
        # Fix the item type if it's wrong
        if item.item_type != 'food':
            old_type = item.item_type
            item.item_type = 'food'
            item.save()
            print(f"✅ Fixed: Changed item_type from '{old_type}' to 'food'")
        else:
            print(f"✅ Already correct: item_type is 'food'")
        
        print("-" * 50)
    
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
        print(f"\n🚨 Found {food_items_marked_as_beverages.count()} food items incorrectly marked as beverages:")
        
        for item in food_items_marked_as_beverages:
            print(f"  - {item.name} (ID: {item.id})")
            old_type = item.item_type
            item.item_type = 'food'
            item.save()
            print(f"    ✅ Fixed: Changed from '{old_type}' to 'food'")
    
    # Verify the fix
    print("\n🔍 Verification:")
    ktfo_items_after = MenuItem.objects.filter(
        name__in=['KtFO', 'ክትፎ', 'ktfo', 'Ktfo']
    )
    
    for item in ktfo_items_after:
        print(f"  - {item.name}: item_type = '{item.item_type}' ✅")
    
    print("\n🎯 Fix completed!")

if __name__ == "__main__":
    fix_ktfo_item_type()

