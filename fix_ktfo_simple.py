#!/usr/bin/env python3
"""
Simple Fix Script for KtFO Item Type

This script directly fixes the KtFO item_type from 'beverage' to 'food'.

Usage:
    python manage.py shell
    exec(open('fix_ktfo_simple.py').read())
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from menu.models import MenuItem

def fix_ktfo_simple():
    """Simple fix for KtFO item type"""
    
    print("🔧 Fixing KtFO item type...")
    print("=" * 40)
    
    # Find ALL KtFO items (any variation of the name)
    ktfo_items = MenuItem.objects.filter(
        name__icontains='ktfo'
    )
    
    print(f"Found {ktfo_items.count()} KtFO items:")
    
    for item in ktfo_items:
        print(f"  - ID: {item.id}")
        print(f"    Name: '{item.name}'")
        print(f"    Current item_type: '{item.item_type}'")
        print(f"    Price: {item.price}")
        
        # Fix the item type if it's wrong
        if item.item_type != 'food':
            old_type = item.item_type
            item.item_type = 'food'
            item.save()
            print(f"    ✅ FIXED: Changed from '{old_type}' to 'food'")
        else:
            print(f"    ✅ Already correct: item_type is 'food'")
        
        print()
    
    # Also check for any other obvious food items marked as beverages
    food_names = ['ክትፎ', 'KtFO', 'ktfo', 'Ktfo', 'ጥብስ', 'ጥሬ ስጋ', 'ዱለት']
    
    for name in food_names:
        items = MenuItem.objects.filter(name__icontains=name, item_type='beverage')
        if items.exists():
            print(f"🚨 Found {items.count()} '{name}' items incorrectly marked as beverages:")
            for item in items:
                print(f"  - ID: {item.id}, Name: '{item.name}'")
                item.item_type = 'food'
                item.save()
                print(f"    ✅ Fixed: Changed to 'food'")
    
    print("\n🎯 Fix completed!")
    print("Now restart your backend and refresh the dashboard!")

if __name__ == "__main__":
    fix_ktfo_simple()

