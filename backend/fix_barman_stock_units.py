#!/usr/bin/env python3
"""
Script to fix BarmanStock records to use the correct original_unit
"""

import os
import sys
import django
from decimal import Decimal

# Add the project directory to the Python path
sys.path.append('/home/alki/Project/kebede-butchery-ms/backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import BarmanStock, ProductMeasurement

def fix_barman_stock_units():
    """Fix BarmanStock records to use correct original_unit"""
    
    print("=== Fixing BarmanStock original_unit values ===\n")
    
    barman_stocks = BarmanStock.objects.all()
    fixed_count = 0
    
    for barman_stock in barman_stocks:
        print(f"\nBarmanStock ID {barman_stock.id}: {barman_stock.stock.product.name}")
        print(f"  Current original_unit: {barman_stock.original_unit}")
        print(f"  Current original_quantity: {barman_stock.original_quantity}")
        print(f"  Current quantity_in_base_units: {barman_stock.quantity_in_base_units}")
        
        # Find the measurement for this product (carton to bottle)
        measurement = ProductMeasurement.objects.filter(
            product=barman_stock.stock.product,
            is_default_sales_unit=True
        ).first()
        
        if measurement:
            print(f"  Found measurement: 1 {measurement.from_unit.unit_name} = {measurement.amount_per} {measurement.to_unit.unit_name}")
            
            # If the original_unit is the same as the base unit (bottle), fix it
            if barman_stock.original_unit == barman_stock.stock.product.base_unit:
                # Convert from base units to the larger unit
                new_original_quantity = barman_stock.quantity_in_base_units / measurement.amount_per
                
                barman_stock.original_unit = measurement.from_unit
                barman_stock.original_quantity = new_original_quantity
                barman_stock.save()
                
                print(f"  ✅ FIXED: Set original_unit to {measurement.from_unit.unit_name}")
                print(f"  ✅ FIXED: Set original_quantity to {new_original_quantity}")
                fixed_count += 1
            else:
                print(f"  ✅ Original unit {barman_stock.original_unit.unit_name} is already correct")
        else:
            print(f"  ❌ No measurement found for product {barman_stock.stock.product.name}")
        
        # Test the display after fix
        display = barman_stock.original_quantity_display
        if display:
            print(f"  Display: {display['full_units']} {display['original_unit']} and {display['remainder']} {display['base_unit']}")
        else:
            print(f"  Display: None")
    
    print(f"\n=== Summary ===")
    print(f"Fixed {fixed_count} barman stocks")

if __name__ == '__main__':
    fix_barman_stock_units() 