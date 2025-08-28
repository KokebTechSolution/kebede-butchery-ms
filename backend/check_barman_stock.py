#!/usr/bin/env python
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import BarmanStock
from users.models import User

print("=== BarmanStock Data Check ===")
print(f"Total BarmanStock records: {BarmanStock.objects.count()}")

# Check all BarmanStock records
for bs in BarmanStock.objects.select_related('stock__product', 'stock__branch', 'bartender').all():
    print(f"\nBarmanStock ID: {bs.id}")
    print(f"  Bartender: {bs.bartender.username if bs.bartender else 'None'}")
    print(f"  Product: {bs.stock.product.name if bs.stock and bs.stock.product else 'None'}")
    print(f"  Branch: {bs.stock.branch.name if bs.stock and bs.stock.branch else 'None'}")
    print(f"  Quantity in base units: {bs.quantity_in_base_units}")
    print(f"  Original quantity: {bs.original_quantity}")
    print(f"  Original unit: {bs.original_unit.unit_name if bs.original_unit else 'None'}")

print("\n=== User Check ===")
print(f"Total users: {User.objects.count()}")
for user in User.objects.all():
    print(f"  User: {user.username}, Role: {getattr(user, 'role', 'No role')}")

print("\n=== Stock Check ===")
from inventory.models import Stock
print(f"Total Stock records: {Stock.objects.count()}")
for stock in Stock.objects.select_related('product', 'branch').all()[:5]:  # Show first 5
    print(f"  Stock ID: {stock.id}")
    print(f"    Product: {stock.product.name if stock.product else 'None'}")
    print(f"    Branch: {stock.branch.name if stock.branch else 'None'}")
    print(f"    Input quantity: {stock.input_quantity}")
    print(f"    Calculated base units: {stock.calculated_base_units}")
