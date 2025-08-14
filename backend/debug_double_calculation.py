#!/usr/bin/env python3
"""
Debug script to test product creation and identify double calculation issues
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from decimal import Decimal
from inventory.models import Product, Stock, ProductMeasurement, ProductUnit, Category, ItemType
from branches.models import Branch
from django.db import transaction

def test_product_creation():
    """Test product creation to identify double calculation"""
    
    # Get required objects
    try:
        branch = Branch.objects.first()
        item_type = ItemType.objects.first()
        category = Category.objects.filter(item_type=item_type).first()
        carton_unit = ProductUnit.objects.filter(unit_name='carton').first()
        bottle_unit = ProductUnit.objects.filter(unit_name='bottle').first()
        
        if not all([branch, item_type, category, carton_unit, bottle_unit]):
            print("❌ Missing required objects for test")
            return
    except Exception as e:
        print(f"❌ Error getting required objects: {e}")
        return
    
    print("🔍 Testing product creation...")
    print(f"Branch: {branch.name}")
    print(f"Category: {category.category_name}")
    print(f"Carton unit: {carton_unit.unit_name}")
    print(f"Bottle unit: {bottle_unit.unit_name}")
    
    # Test data
    test_name = "DEBUG_TEST_PRODUCT"
    original_quantity = Decimal('23.00')  # 23 cartons
    conversion_amount = Decimal('10.00')  # 10 bottles per carton
    expected_base_units = (original_quantity * conversion_amount).quantize(Decimal('0.01'))  # 230 bottles
    
    print(f"\n📊 Test data:")
    print(f"  Product name: {test_name}")
    print(f"  Original quantity: {original_quantity} cartons")
    print(f"  Conversion: {conversion_amount} bottles per carton")
    print(f"  Expected base units: {expected_base_units} bottles")
    
    # Clean up any existing test product
    Product.objects.filter(name=test_name).delete()
    
    with transaction.atomic():
        print(f"\n🔧 Creating product...")
        
        # Create product
        product = Product.objects.create(
            name=test_name,
            category=category,
            base_unit=bottle_unit,
            base_unit_price=Decimal('10.00'),
            description="Debug test product"
        )
        print(f"✅ Product created: {product.name} (ID: {product.id})")
        
        # Create measurement
        measurement = ProductMeasurement.objects.create(
            product=product,
            from_unit=carton_unit,
            to_unit=bottle_unit,
            amount_per=conversion_amount,
            is_default_sales_unit=True
        )
        print(f"✅ Measurement created: {carton_unit.unit_name} -> {bottle_unit.unit_name} = {conversion_amount}")
        
        # Create stock
        stock = Stock.objects.create(
            product=product,
            branch=branch,
            original_quantity=original_quantity,
            original_unit=carton_unit,
            quantity_in_base_units=expected_base_units,
            minimum_threshold_base_units=Decimal('10.00')
        )
        print(f"✅ Stock created with quantity_in_base_units: {stock.quantity_in_base_units}")
        
        # Create inventory transaction
        from inventory.models import InventoryTransaction
        transaction_obj = InventoryTransaction(
            product=product,
            transaction_type='restock',
            quantity=original_quantity,
            transaction_unit=carton_unit,
            quantity_in_base_units=expected_base_units,
            to_stock_main=stock,
            branch=branch,
            price_at_transaction=Decimal('10.00'),
            notes=f"Debug test: {original_quantity} {carton_unit.unit_name}"
        )
        transaction_obj.save(skip_stock_adjustment=True)
        print(f"✅ Transaction created with skip_stock_adjustment=True")
        
        # Check final values
        stock.refresh_from_db()
        print(f"\n📋 Final results:")
        print(f"  Stock.quantity_in_base_units: {stock.quantity_in_base_units}")
        print(f"  Stock.original_quantity: {stock.original_quantity}")
        print(f"  Expected: {expected_base_units}")
        print(f"  Is correct: {stock.quantity_in_base_units == expected_base_units}")
        
        if stock.quantity_in_base_units != expected_base_units:
            print(f"❌ DOUBLE CALCULATION DETECTED!")
            print(f"   Expected: {expected_base_units}")
            print(f"   Actual: {stock.quantity_in_base_units}")
            print(f"   Difference: {stock.quantity_in_base_units - expected_base_units}")
        else:
            print(f"✅ No double calculation detected")
    
    # Clean up
    Product.objects.filter(name=test_name).delete()
    print(f"\n🧹 Cleaned up test product")

if __name__ == "__main__":
    test_product_creation() 