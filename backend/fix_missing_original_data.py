#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Stock, ProductUnit
from decimal import Decimal

def fix_missing_original_data():
    print("Fixing stocks with missing original_quantity or original_unit...")
    print("=" * 80)
    
    # Get common units that products typically use
    common_units = {
        'Bottle': ProductUnit.objects.filter(unit_name__icontains='bottle').first(),
        'Box': ProductUnit.objects.filter(unit_name__icontains='box').first(),
        'Carton': ProductUnit.objects.filter(unit_name__icontains='carton').first(),
        'Unit': ProductUnit.objects.filter(unit_name__icontains='unit').first(),
    }
    
    # Default unit mappings for common products
    default_units = {
        'Fanta': common_units.get('Box') or common_units.get('Carton'),
        'Mirinda': common_units.get('Box') or common_units.get('Carton'),
        'Pepsi': common_units.get('Carton') or common_units.get('Box'),
        'Redblull': common_units.get('Unit') or common_units.get('Bottle'),
        'Coca': common_units.get('Box') or common_units.get('Carton'),
    }
    
    # Default conversion factors (1 unit = how many base units)
    default_conversions = {
        'Box': 24,      # 1 Box = 24 Bottles
        'Carton': 24,   # 1 Carton = 24 Bottles
        'Unit': 1,      # 1 Unit = 1 Unit
        'Bottle': 1,    # 1 Bottle = 1 Bottle
    }
    
    fixed_count = 0
    
    for stock in Stock.objects.all():
        if stock.original_quantity is None or stock.original_quantity == 0 or stock.original_unit is None:
            print(f"\nFixing Stock {stock.id}: {stock.product.name}")
            
            # Determine the appropriate unit for this product
            product_name = stock.product.name
            original_unit = None
            
            # Try to find a suitable unit
            for unit_name, unit in default_units.items():
                if unit and unit_name.lower() in product_name.lower():
                    original_unit = unit
                    break
            
            # If no specific match, use a default based on product type
            if not original_unit:
                if 'bottle' in stock.product.base_unit.unit_name.lower():
                    original_unit = common_units.get('Box') or common_units.get('Carton')
                else:
                    original_unit = common_units.get('Unit') or stock.product.base_unit
            
            if original_unit:
                # Calculate original_quantity based on quantity_in_base_units
                conversion_factor = default_conversions.get(original_unit.unit_name, 1)
                if conversion_factor > 0:
                    original_quantity = stock.quantity_in_base_units / conversion_factor
                    
                    # Update the stock
                    stock.original_quantity = original_quantity.quantize(Decimal('0.01'))
                    stock.original_unit = original_unit
                    stock.save(update_fields=['original_quantity', 'original_unit'])
                    
                    print(f"  Fixed: original_quantity = {original_quantity} {original_unit.unit_name}")
                    print(f"  Conversion: 1 {original_unit.unit_name} = {conversion_factor} {stock.product.base_unit.unit_name}")
                    fixed_count += 1
                else:
                    print(f"  Error: Invalid conversion factor for {original_unit.unit_name}")
            else:
                print(f"  Error: Could not determine appropriate unit for {product_name}")
    
    print(f"\nSUMMARY:")
    print(f"Fixed {fixed_count} stocks")
    
    # Verify the fix
    print("\nVerifying fix...")
    remaining_issues = 0
    for stock in Stock.objects.all():
        if stock.original_quantity is None or stock.original_quantity == 0 or stock.original_unit is None:
            remaining_issues += 1
            print(f"  Still has issues: Stock {stock.id} - {stock.product.name}")
    
    if remaining_issues == 0:
        print("  All stocks are now properly configured! ✅")
    else:
        print(f"  {remaining_issues} stocks still have issues")

if __name__ == '__main__':
    fix_missing_original_data()
