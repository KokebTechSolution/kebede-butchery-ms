#!/usr/bin/env python
"""
Script to completely clear all inventory data from the database
"""
import os
import sys
import django
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Stock, Product, Category, ItemType, ProductUnit, InventoryTransaction, InventoryRequest, BarmanStock
from django.db import connection

def clear_all_inventory_data():
    """Clear all inventory data from the database"""
    print("🧹 Clearing all inventory data...")
    
    try:
        # Clear all inventory-related tables
        print("🗑️ Clearing Stock records...")
        Stock.objects.all().delete()
        print(f"   ✅ Deleted {Stock.objects.count()} stock records")
        
        print("🗑️ Clearing Product records...")
        Product.objects.all().delete()
        print(f"   ✅ Deleted {Product.objects.count()} product records")
        
        print("🗑️ Clearing Category records...")
        Category.objects.all().delete()
        print(f"   ✅ Deleted {Category.objects.count()} category records")
        
        print("🗑️ Clearing ItemType records...")
        ItemType.objects.all().delete()
        print(f"   ✅ Deleted {ItemType.objects.count()} item type records")
        
        print("🗑️ Clearing ProductUnit records...")
        ProductUnit.objects.all().delete()
        print(f"   ✅ Deleted {ProductUnit.objects.count()} product unit records")
        
        print("🗑️ Clearing InventoryTransaction records...")
        InventoryTransaction.objects.all().delete()
        print(f"   ✅ Deleted {InventoryTransaction.objects.count()} transaction records")
        
        print("🗑️ Clearing InventoryRequest records...")
        InventoryRequest.objects.all().delete()
        print(f"   ✅ Deleted {InventoryRequest.objects.count()} request records")
        
        print("🗑️ Clearing BarmanStock records...")
        BarmanStock.objects.all().delete()
        print(f"   ✅ Deleted {BarmanStock.objects.count()} barman stock records")
        
        # Reset auto-increment counters
        print("🔄 Resetting auto-increment counters...")
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('inventory_stock', 'inventory_product', 'inventory_category', 'inventory_itemtype', 'inventory_productunit', 'inventory_inventorytransaction', 'inventory_inventoryrequest', 'inventory_barmanstock')")
        
        print("✅ All inventory data cleared successfully!")
        print("📊 Database is now clean and ready for your new approach!")
        
    except Exception as e:
        print(f"❌ Error clearing data: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚨 WARNING: This will DELETE ALL inventory data!")
    print("Are you sure you want to continue? (y/N)")
    
    response = input().strip().lower()
    if response in ['y', 'yes']:
        clear_all_inventory_data()
    else:
        print("❌ Operation cancelled.")
