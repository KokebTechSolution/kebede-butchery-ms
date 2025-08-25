#!/usr/bin/env python
"""
Simple script to clear all inventory data
"""
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Stock, Product, Category, ItemType, ProductUnit, InventoryTransaction, InventoryRequest, BarmanStock

print("🧹 Clearing all inventory data...")

# Clear all tables
Stock.objects.all().delete()
Product.objects.all().delete()
Category.objects.all().delete()
ItemType.objects.all().delete()
ProductUnit.objects.all().delete()
InventoryTransaction.objects.all().delete()
InventoryRequest.objects.all().delete()
BarmanStock.objects.all().delete()

print("✅ All inventory data cleared!")
print("📊 Database is now clean!")
