#!/usr/bin/env python
"""
Test script to verify backend functionality and fix missing unit conversions
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Product, ProductUnit, ProductMeasurement
from decimal import Decimal

def test_backend():
    print("🔧 Testing Backend Functionality...")
    
    # Test 1: Check if products exist
    products = Product.objects.all()
    print(f"✅ Found {products.count()} products")
    
    # Test 2: Check if units exist
    units = ProductUnit.objects.all()
    print(f"✅ Found {units.count()} units")
    
    # Test 3: Check conversions for each product
    for product in products:
        print(f"\n📦 Product: {product.name}")
        measurements = ProductMeasurement.objects.filter(product=product)
        print(f"   Conversions: {measurements.count()}")
        
        if measurements.count() == 0:
            print(f"   ⚠️  No conversions found for {product.name}")
            # Try to create default conversions
            create_default_conversions(product)
        else:
            for m in measurements:
                print(f"   - {m.from_unit.unit_name} -> {m.to_unit.unit_name} = {m.amount_per}")

def create_default_conversions(product):
    """Create default conversions for a product"""
    print(f"   🔧 Creating default conversions for {product.name}")
    
    # Common conversions
    default_conversions = {
        'carton': {
            'bottle': 24,
            'shot': 480,
            'unit': 24,
        },
        'bottle': {
            'shot': 20,
            'ml': 750,
            'unit': 1,
        },
        'shot': {
            'ml': 37.5,
            'unit': 1,
        }
    }
    
    # Get or create units
    units = {}
    for unit_name in ['carton', 'bottle', 'shot', 'ml', 'unit']:
        unit, created = ProductUnit.objects.get_or_create(
            unit_name=unit_name,
            defaults={'is_liquid_unit': unit_name in ['shot', 'ml', 'bottle']}
        )
        units[unit_name] = unit
        if created:
            print(f"     Created unit: {unit_name}")
    
    # Create conversions
    created_count = 0
    for from_unit_name, conversions in default_conversions.items():
        from_unit = units.get(from_unit_name)
        if not from_unit:
            continue
            
        for to_unit_name, factor in conversions.items():
            to_unit = units.get(to_unit_name)
            if not to_unit:
                continue
            
            # Check if conversion already exists
            existing = ProductMeasurement.objects.filter(
                product=product,
                from_unit=from_unit,
                to_unit=to_unit
            ).first()
            
            if not existing:
                ProductMeasurement.objects.create(
                    product=product,
                    from_unit=from_unit,
                    to_unit=to_unit,
                    amount_per=Decimal(str(factor)),
                    is_default_sales_unit=False
                )
                print(f"     Created: {from_unit_name} -> {to_unit_name} = {factor}")
                created_count += 1
    
    if created_count > 0:
        print(f"   ✅ Created {created_count} conversions for {product.name}")
    else:
        print(f"   ℹ️  No new conversions needed for {product.name}")

def fix_specific_product(product_name, from_unit, to_unit, factor):
    """Fix a specific conversion for a product"""
    try:
        product = Product.objects.get(name__iexact=product_name)
        from_unit_obj, _ = ProductUnit.objects.get_or_create(
            unit_name=from_unit,
            defaults={'is_liquid_unit': from_unit in ['shot', 'ml', 'bottle']}
        )
        to_unit_obj, _ = ProductUnit.objects.get_or_create(
            unit_name=to_unit,
            defaults={'is_liquid_unit': to_unit in ['shot', 'ml', 'bottle']}
        )
        
        measurement, created = ProductMeasurement.objects.get_or_create(
            product=product,
            from_unit=from_unit_obj,
            to_unit=to_unit_obj,
            defaults={'amount_per': Decimal(str(factor))}
        )
        
        if not created:
            measurement.amount_per = Decimal(str(factor))
            measurement.save()
        
        print(f"✅ {'Created' if created else 'Updated'} conversion for {product_name}: {from_unit} -> {to_unit} = {factor}")
        return True
        
    except Product.DoesNotExist:
        print(f"❌ Product '{product_name}' not found")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Backend Test & Fix Script")
    print("=" * 50)
    
    # Test general functionality
    test_backend()
    
    # Fix specific products mentioned in errors
    print("\n🔧 Fixing specific conversions...")
    
    # Fix the products mentioned in the error logs
    fix_specific_product("weerr", "carton", "shot", 24)
    fix_specific_product("AQWA", "bottle", "shot", 20)
    
    print("\n✅ Backend test completed!")
    print("\nTo test the API endpoints:")
    print("1. Start the server: python manage.py runserver")
    print("2. Test restock: POST /api/inventory/stocks/{id}/restock/")
    print("3. Add conversion: POST /api/inventory/productmeasurements/quick_fix/")
    print("4. Get valid units: GET /api/inventory/products/{id}/valid_units/") 