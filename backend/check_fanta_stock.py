#!/usr/bin/env python
import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Stock, Product

def check_fanta_stock():
    print("=== CHECKING FANTA STOCK LEVELS ===")
    
    try:
        fanta = Product.objects.get(name='Fanta')
        stock = Stock.objects.get(product=fanta)
        
        print(f"Product: {fanta.name}")
        print(f"Base Unit: {fanta.base_unit.unit_name}")
        print(f"Original Unit: {stock.original_unit.unit_name}")
        print(f"")
        print(f"Current Stock Levels:")
        print(f"  Original Quantity: {stock.original_quantity} {stock.original_unit.unit_name}")
        print(f"  Base Units: {stock.quantity_in_base_units} {stock.product.base_unit.unit_name}")
        print(f"")
        print(f"Expected Display:")
        if stock.original_unit and stock.product.base_unit:
            try:
                # Calculate what the display should show
                conversion_factor = stock.product.get_conversion_factor(stock.original_unit, stock.product.base_unit)
                expected_original = (stock.quantity_in_base_units / conversion_factor).quantize(Decimal('0.01'))
                print(f"  Should show: {expected_original} {stock.original_unit.unit_name}")
                print(f"  Based on: {stock.quantity_in_base_units} {stock.product.base_unit.unit_name} ÷ {conversion_factor} = {expected_original}")
            except Exception as e:
                print(f"  Error calculating: {e}")
        
    except Product.DoesNotExist:
        print("Fanta product not found!")
    except Stock.DoesNotExist:
        print("Fanta stock not found!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_fanta_stock()
