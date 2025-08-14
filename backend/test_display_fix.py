#!/usr/bin/env python3
"""
Test script to verify the original_quantity_display fix
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

from inventory.models import Stock, Product, ProductUnit, Category, ItemType, ProductMeasurement

def test_original_quantity_display():
    """Test the original_quantity_display property"""
    
    print("=== Testing original_quantity_display fix ===\n")
    
    # Get or create test data
    try:
        # Get existing units
        carton_unit = ProductUnit.objects.get(unit_name='carton')
        bottle_unit = ProductUnit.objects.get(unit_name='bottle')
        
        # Get or create a test product
        product, created = Product.objects.get_or_create(
            name='Test Product for Display',
            defaults={
                'base_unit': bottle_unit,
                'base_unit_price': Decimal('10.00')
            }
        )
        
        if created:
            print(f"Created test product: {product.name}")
        else:
            print(f"Using existing product: {product.name}")
        
        # Create or get measurement: 1 carton = 10 bottles
        measurement, created = ProductMeasurement.objects.get_or_create(
            product=product,
            from_unit=carton_unit,
            to_unit=bottle_unit,
            defaults={
                'amount_per': Decimal('10.00'),
                'is_default_sales_unit': True
            }
        )
        
        if created:
            print(f"Created measurement: 1 {carton_unit.unit_name} = {measurement.amount_per} {bottle_unit.unit_name}")
        else:
            print(f"Using existing measurement: 1 {carton_unit.unit_name} = {measurement.amount_per} {bottle_unit.unit_name}")
        
        # Get or create a stock record
        from branches.models import Branch
        branch = Branch.objects.first()
        if not branch:
            print("No branch found. Please create a branch first.")
            return
        
        stock, created = Stock.objects.get_or_create(
            product=product,
            branch=branch,
            defaults={
                'quantity_in_base_units': Decimal('230.00'),  # 23 cartons * 10 bottles
                'original_quantity': Decimal('23.00'),  # 23 cartons
                'original_unit': carton_unit,
                'minimum_threshold_base_units': Decimal('20.00')
            }
        )
        
        if created:
            print(f"Created stock record with 23 cartons (230 bottles)")
        else:
            print(f"Using existing stock record")
        
        # Test the original_quantity_display property
        print(f"\n--- Testing Stock.original_quantity_display ---")
        display = stock.original_quantity_display
        print(f"Display object: {display}")
        
        if display:
            print(f"Full units: {display['full_units']}")
            print(f"Original unit: {display['original_unit']}")
            print(f"Remainder: {display['remainder']}")
            print(f"Base unit: {display['base_unit']}")
            
            # Format it like the serializer does
            full_units = display['full_units']
            original_unit = display['original_unit']
            remainder = display['remainder']
            base_unit = display['base_unit']
            
            base_unit_str = base_unit if remainder == 1 else base_unit + 's'
            original_unit_str = original_unit if full_units == 1 else original_unit + 's'
            
            formatted_display = f"{full_units} {original_unit_str} and {remainder} {base_unit_str}"
            print(f"\nFormatted display: '{formatted_display}'")
            
            # Expected: "23 cartons and 0 bottles"
            expected = "23 cartons and 0 bottles"
            if formatted_display == expected:
                print(f"✅ SUCCESS: Display shows '{formatted_display}' as expected!")
            else:
                print(f"❌ FAILED: Expected '{expected}' but got '{formatted_display}'")
        else:
            print("❌ FAILED: original_quantity_display returned None")
        
        # Test with a fractional quantity
        print(f"\n--- Testing with fractional quantity ---")
        stock.original_quantity = Decimal('23.5')  # 23.5 cartons
        stock.save()
        
        display = stock.original_quantity_display
        print(f"Display object: {display}")
        
        if display:
            full_units = display['full_units']
            original_unit = display['original_unit']
            remainder = display['remainder']
            base_unit = display['base_unit']
            
            base_unit_str = base_unit if remainder == 1 else base_unit + 's'
            original_unit_str = original_unit if full_units == 1 else original_unit + 's'
            
            formatted_display = f"{full_units} {original_unit_str} and {remainder} {base_unit_str}"
            print(f"Formatted display: '{formatted_display}'")
            
            # Expected: "23 cartons and 5 bottles" (0.5 cartons * 10 bottles = 5 bottles)
            expected = "23 cartons and 5 bottles"
            if formatted_display == expected:
                print(f"✅ SUCCESS: Fractional display shows '{formatted_display}' as expected!")
            else:
                print(f"❌ FAILED: Expected '{expected}' but got '{formatted_display}'")
        else:
            print("❌ FAILED: original_quantity_display returned None for fractional quantity")
        
        print(f"\n=== Test completed ===")
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_original_quantity_display() 