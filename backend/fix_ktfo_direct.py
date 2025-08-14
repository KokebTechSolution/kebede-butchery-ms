#!/usr/bin/env python3
"""
Direct Fix for KtFO Item Type

This script directly updates the database to fix KtFO item_type.
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from menu.models import MenuItem

def fix_ktfo_direct():
    """Direct fix for KtFO item type"""
    
    print("🔧 DIRECT FIX: Changing KtFO from beverage to food...")
    print("=" * 50)
    
    # Find KtFO items
    ktfo_items = MenuItem.objects.filter(name__icontains='ktfo')
    
    if not ktfo_items.exists():
        print("❌ No KtFO items found!")
        return
    
    print(f"Found {ktfo_items.count()} KtFO items:")
    
    for item in ktfo_items:
        print(f"  - ID: {item.id}")
        print(f"    Name: '{item.name}'")
        print(f"    OLD item_type: '{item.item_type}'")
        
        # Force update to food
        MenuItem.objects.filter(id=item.id).update(item_type='food')
        
        # Verify the change
        updated_item = MenuItem.objects.get(id=item.id)
        print(f"    NEW item_type: '{updated_item.item_type}'")
        print(f"    ✅ FIXED!")
        print()
    
    print("🎯 DIRECT FIX COMPLETED!")
    print("Now restart your backend and refresh the dashboard!")

if __name__ == "__main__":
    fix_ktfo_direct()

