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

def fix_stock_display():
    print("Checking Stock records...")
    stock_issues = []
    
    for stock in Stock.objects.all():
        if stock.original_unit and stock.quantity_in_base_units > 0:
            try:
                # Calculate what original_quantity should be
                conversion_factor = stock.product.get_conversion_factor(stock.original_unit, stock.product.base_unit)
                expected_original_quantity = stock.quantity_in_base_units / conversion_factor
                
                # Check if there's a significant difference
                if abs(stock.original_quantity - expected_original_quantity) > Decimal('0.01'):
                    stock_issues.append({
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
                    
            except Exception as e:
                print(f"Error processing Stock {stock.id}: {e}")
    
    print("Checking BarmanStock records...")
    barman_issues = []
    
    for barman_stock in BarmanStock.objects.all():
        if barman_stock.original_unit and barman_stock.quantity_in_base_units > 0:
            try:
                # Calculate what original_quantity should be
                conversion_factor = barman_stock.stock.product.get_conversion_factor(barman_stock.original_unit, barman_stock.stock.product.base_unit)
                expected_original_quantity = barman_stock.quantity_in_base_units / conversion_factor
                
                # Check if there's a significant difference
                if barman_stock.original_quantity and abs(barman_stock.original_quantity - expected_original_quantity) > Decimal('0.01'):
                    barman_issues.append({
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
                    
            except Exception as e:
                print(f"Error processing BarmanStock {barman_stock.id}: {e}")
    
    # Summary
    total_issues = len(stock_issues) + len(barman_issues)
    print(f"\nFixed {total_issues} issues.")
    
    # Show details of what was fixed
    for issue in stock_issues + barman_issues:
        print(f"- {issue['type']} {issue['id']}: {issue['product']}")
        print(f"  Fixed: {issue['current_original_quantity']} -> {issue['expected_original_quantity']} {issue['original_unit']}")
        print(f"  Base units: {issue['quantity_in_base_units']} {issue['base_unit']}")
        print(f"  Conversion: 1 {issue['original_unit']} = {issue['conversion_factor']} {issue['base_unit']}")
        print("")

if __name__ == '__main__':
    fix_stock_display() 