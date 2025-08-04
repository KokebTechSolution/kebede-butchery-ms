#!/usr/bin/env python3
"""
Script to check and fix existing stock data that might have incorrect original_unit values
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

from inventory.models import Stock, BarmanStock, Product, ProductUnit, ProductMeasurement

def check_and_fix_stock_data():
    """Check and fix existing stock data"""
    
    print("=== Checking and fixing existing stock data ===\n")
    
    # Check main store stocks
    print("--- Main Store Stocks ---")
    stocks = Stock.objects.all()
    fixed_count = 0
    
    for stock in stocks:
        print(f"\nStock ID {stock.id}: {stock.product.name}")
        print(f"  Current original_unit: {stock.original_unit}")
        print(f"  Current original_quantity: {stock.original_quantity}")
        print(f"  Current quantity_in_base_units: {stock.quantity_in_base_units}")
        
        # Check if original_unit is missing or incorrect
        if not stock.original_unit:
            # Try to find a measurement for this product
            measurement = ProductMeasurement.objects.filter(
                product=stock.product,
                is_default_sales_unit=True
            ).first()
            
            if measurement:
                # Set the original_unit to the from_unit of the measurement
                stock.original_unit = measurement.from_unit
                stock.original_quantity = stock.quantity_in_base_units / measurement.amount_per
                stock.save()
                print(f"  ✅ FIXED: Set original_unit to {measurement.from_unit.unit_name}")
                print(f"  ✅ FIXED: Set original_quantity to {stock.original_quantity}")
                fixed_count += 1
            else:
                print(f"  ❌ No measurement found for product {stock.product.name}")
        else:
            # Check if the original_unit makes sense
            try:
                measurement = ProductMeasurement.objects.get(
                    product=stock.product,
                    from_unit=stock.original_unit,
                    to_unit=stock.product.base_unit
                )
                print(f"  ✅ Original unit {stock.original_unit.unit_name} is valid")
            except ProductMeasurement.DoesNotExist:
                print(f"  ⚠️  Original unit {stock.original_unit.unit_name} has no measurement")
        
        # Test the display
        display = stock.original_quantity_display
        if display:
            print(f"  Display: {display['full_units']} {display['original_unit']} and {display['remainder']} {display['base_unit']}")
        else:
            print(f"  Display: None")
    
    # Check barman stocks
    print(f"\n--- Barman Stocks ---")
    barman_stocks = BarmanStock.objects.all()
    barman_fixed_count = 0
    
    for barman_stock in barman_stocks:
        print(f"\nBarmanStock ID {barman_stock.id}: {barman_stock.stock.product.name}")
        print(f"  Current original_unit: {barman_stock.original_unit}")
        print(f"  Current original_quantity: {barman_stock.original_quantity}")
        print(f"  Current quantity_in_base_units: {barman_stock.quantity_in_base_units}")
        
        # Check if original_unit is missing or incorrect
        if not barman_stock.original_unit:
            # Try to find a measurement for this product
            measurement = ProductMeasurement.objects.filter(
                product=barman_stock.stock.product,
                is_default_sales_unit=True
            ).first()
            
            if measurement:
                # Set the original_unit to the from_unit of the measurement
                barman_stock.original_unit = measurement.from_unit
                barman_stock.original_quantity = barman_stock.quantity_in_base_units / measurement.amount_per
                barman_stock.save()
                print(f"  ✅ FIXED: Set original_unit to {measurement.from_unit.unit_name}")
                print(f"  ✅ FIXED: Set original_quantity to {barman_stock.original_quantity}")
                barman_fixed_count += 1
            else:
                print(f"  ❌ No measurement found for product {barman_stock.stock.product.name}")
        else:
            # Check if the original_unit makes sense
            try:
                measurement = ProductMeasurement.objects.get(
                    product=barman_stock.stock.product,
                    from_unit=barman_stock.original_unit,
                    to_unit=barman_stock.stock.product.base_unit
                )
                print(f"  ✅ Original unit {barman_stock.original_unit.unit_name} is valid")
            except ProductMeasurement.DoesNotExist:
                print(f"  ⚠️  Original unit {barman_stock.original_unit.unit_name} has no measurement")
        
        # Test the display
        display = barman_stock.original_quantity_display
        if display:
            print(f"  Display: {display['full_units']} {display['original_unit']} and {display['remainder']} {display['base_unit']}")
        else:
            print(f"  Display: None")
    
    print(f"\n=== Summary ===")
    print(f"Fixed {fixed_count} main store stocks")
    print(f"Fixed {barman_fixed_count} barman stocks")
    print(f"Total fixed: {fixed_count + barman_fixed_count}")

if __name__ == '__main__':
    check_and_fix_stock_data() 