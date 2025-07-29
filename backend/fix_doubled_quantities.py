#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Stock, BarmanStock
from decimal import Decimal

def fix_doubled_quantities():
    print("Checking for doubled quantities in Stock records...")
    stock_fixes = []
    
    for stock in Stock.objects.all():
        if stock.original_unit and stock.quantity_in_base_units > 0:
            try:
                # Calculate what original_quantity should be
                conversion_factor = stock.product.get_conversion_factor(stock.original_unit, stock.product.base_unit)
                expected_original_quantity = stock.quantity_in_base_units / conversion_factor
                
                # Check if original_quantity is significantly higher than expected (doubled)
                if stock.original_quantity > expected_original_quantity * Decimal('1.5'):
                    stock_fixes.append({
                        'type': 'Stock',
                        'id': stock.id,
                        'product': stock.product.name,
                        'current_original_quantity': stock.original_quantity,
                        'expected_original_quantity': expected_original_quantity,
                        'quantity_in_base_units': stock.quantity_in_base_units,
                        'original_unit': stock.original_unit.unit_name,
                        'base_unit': stock.product.base_unit.unit_name,
                        'conversion_factor': conversion_factor
                    })
                    
                    # Fix the issue
                    stock.original_quantity = expected_original_quantity.quantize(Decimal('0.01'))
                    stock.save(update_fields=['original_quantity'])
                    print(f"Fixed Stock {stock.id}: {stock.product.name}")
                    print(f"  Changed from {stock_fixes[-1]['current_original_quantity']} to {expected_original_quantity} {stock.original_unit.unit_name}")
                    
            except Exception as e:
                print(f"Error processing Stock {stock.id}: {e}")
    
    print("\nChecking for doubled quantities in BarmanStock records...")
    barman_fixes = []
    
    for barman_stock in BarmanStock.objects.all():
        if barman_stock.original_unit and barman_stock.quantity_in_base_units > 0:
            try:
                # Calculate what original_quantity should be
                conversion_factor = barman_stock.stock.product.get_conversion_factor(barman_stock.original_unit, barman_stock.stock.product.base_unit)
                expected_original_quantity = barman_stock.quantity_in_base_units / conversion_factor
                
                # Check if original_quantity is significantly higher than expected (doubled)
                if barman_stock.original_quantity and barman_stock.original_quantity > expected_original_quantity * Decimal('1.5'):
                    barman_fixes.append({
                        'type': 'BarmanStock',
                        'id': barman_stock.id,
                        'product': barman_stock.stock.product.name,
                        'current_original_quantity': barman_stock.original_quantity,
                        'expected_original_quantity': expected_original_quantity,
                        'quantity_in_base_units': barman_stock.quantity_in_base_units,
                        'original_unit': barman_stock.original_unit.unit_name,
                        'base_unit': barman_stock.stock.product.base_unit.unit_name,
                        'conversion_factor': conversion_factor
                    })
                    
                    # Fix the issue
                    barman_stock.original_quantity = expected_original_quantity.quantize(Decimal('0.01'))
                    barman_stock.save(update_fields=['original_quantity'])
                    print(f"Fixed BarmanStock {barman_stock.id}: {barman_stock.stock.product.name}")
                    print(f"  Changed from {barman_fixes[-1]['current_original_quantity']} to {expected_original_quantity} {barman_stock.original_unit.unit_name}")
                    
            except Exception as e:
                print(f"Error processing BarmanStock {barman_stock.id}: {e}")
    
    # Summary
    total_fixes = len(stock_fixes) + len(barman_fixes)
    print(f"\nFixed {total_fixes} doubled quantity issues.")
    
    if total_fixes > 0:
        print("\nSummary of fixes:")
        for fix in stock_fixes + barman_fixes:
            print(f"- {fix['type']} {fix['id']}: {fix['product']}")
            print(f"  Fixed: {fix['current_original_quantity']} -> {fix['expected_original_quantity']} {fix['original_unit']}")
            print(f"  Base units: {fix['quantity_in_base_units']} {fix['base_unit']}")
            print(f"  Conversion: 1 {fix['original_unit']} = {fix['conversion_factor']} {fix['base_unit']}")
            print("")
    else:
        print("No doubled quantities found. All data looks correct!")

if __name__ == '__main__':
    fix_doubled_quantities() 