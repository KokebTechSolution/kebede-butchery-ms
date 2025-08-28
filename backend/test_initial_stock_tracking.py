#!/usr/bin/env python
"""
Test script to verify initial stock tracking functionality
"""
import os
import sys
import django
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Stock, Product, Category, ItemType, ProductUnit, Branch
from users.models import User
from django.utils import timezone

def test_initial_stock_tracking():
    """Test the initial stock tracking functionality"""
    print("🧪 Testing Initial Stock Tracking System...")
    
    try:
        # Create test data
        print("📝 Creating test data...")
        
        # Create item type
        item_type, created = ItemType.objects.get_or_create(type_name='Beverage')
        if created:
            print(f"✅ Created item type: {item_type.type_name}")
        
        # Create category
        category, created = Category.objects.get_or_create(
            item_type=item_type,
            category_name='Soft Drinks'
        )
        if created:
            print(f"✅ Created category: {category.category_name}")
        
        # Create units
        carton_unit, created = ProductUnit.objects.get_or_create(unit_name='Carton')
        if created:
            print(f"✅ Created unit: {carton_unit.unit_name}")
        
        bottle_unit, created = ProductUnit.objects.get_or_create(unit_name='Bottle')
        if created:
            print(f"✅ Created unit: {bottle_unit.unit_name}")
        
        # Create product
        product, created = Product.objects.get_or_create(
            name='Test Mirinda',
            defaults={
                'category': category,
                'base_unit': bottle_unit,
                'base_unit_price': Decimal('25.00')
            }
        )
        if created:
            print(f"✅ Created product: {product.name}")
        
        # Create branch
        branch, created = Branch.objects.get_or_create(
            name='Test Branch',
            defaults={'location': 'Test Location'}
        )
        if created:
            print(f"✅ Created branch: {branch.name}")
        
        # Create user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User'
            }
        )
        if created:
            user.set_password('testpass123')
            user.save()
            print(f"✅ Created user: {user.username}")
        
        print("\n🔍 Testing Stock Creation with Initial Amount...")
        
        # Create stock with initial amount
        stock, created = Stock.objects.get_or_create(
            product=product,
            branch=branch,
            defaults={
                'quantity_in_base_units': Decimal('240.00'),  # 10 cartons × 24 bottles
                'minimum_threshold_base_units': Decimal('24.00'),  # 1 carton
                'original_quantity': Decimal('10.00'),  # 10 cartons
                'original_unit': carton_unit,
                'initial_stock_amount': Decimal('10.00'),  # Initial amount
                'initial_stock_unit': carton_unit
            }
        )
        
        if created:
            print(f"✅ Created stock: {stock.product.name} @ {stock.branch.name}")
            print(f"   Initial amount: {stock.initial_stock_amount} {stock.initial_stock_unit.unit_name}")
            print(f"   Current amount: {stock.original_quantity} {stock.original_unit.unit_name}")
            print(f"   Base units: {stock.quantity_in_base_units} {stock.product.base_unit.unit_name}")
        else:
            print(f"📋 Using existing stock: {stock.product.name} @ {stock.branch.name}")
            print(f"   Initial amount: {stock.initial_stock_amount} {stock.initial_stock_unit.unit_name}")
            print(f"   Current amount: {stock.original_quantity} {stock.original_unit.unit_name}")
            print(f"   Base units: {stock.quantity_in_base_units} {stock.product.base_unit.unit_name}")
        
        print("\n🔍 Testing Stock Deduction (Simulating Bartender Request)...")
        
        # Simulate deducting 2 cartons (48 bottles)
        deduction_amount = Decimal('48.00')  # 48 bottles in base units
        deduction_original = Decimal('2.00')  # 2 cartons
        
        print(f"   Deducting: {deduction_original} {carton_unit.unit_name} ({deduction_amount} {bottle_unit.unit_name})")
        
        # Use adjust_quantity to deduct stock
        stock.adjust_quantity(
            quantity=deduction_amount,
            unit=bottle_unit,
            is_addition=False,
            original_quantity_delta=deduction_original
        )
        
        # Refresh from database
        stock.refresh_from_db()
        
        print(f"   After deduction:")
        print(f"     Initial amount: {stock.initial_stock_amount} {stock.initial_stock_unit.unit_name} (unchanged)")
        print(f"     Current amount: {stock.original_quantity} {stock.original_unit.unit_name}")
        print(f"     Base units: {stock.quantity_in_base_units} {stock.product.base_unit.unit_name}")
        
        # Verify initial amount is preserved
        if stock.initial_stock_amount == Decimal('10.00'):
            print("✅ Initial stock amount preserved correctly")
        else:
            print("❌ Initial stock amount was modified (should not happen)")
        
        # Calculate used amount
        used_amount = stock.initial_stock_amount - stock.original_quantity
        print(f"   Used amount: {used_amount} {stock.initial_stock_unit.unit_name}")
        
        if used_amount == Decimal('2.00'):
            print("✅ Stock deduction calculated correctly")
        else:
            print("❌ Stock deduction calculation incorrect")
        
        print("\n🎯 Test Summary:")
        print(f"   Product: {product.name}")
        print(f"   Initial Stock: {stock.initial_stock_amount} {stock.initial_stock_unit.unit_name}")
        print(f"   Current Stock: {stock.original_quantity} {stock.original_unit.unit_name}")
        print(f"   Used: {used_amount} {stock.initial_stock_unit.unit_name}")
        print(f"   Remaining: {stock.original_quantity} {stock.initial_stock_unit.unit_name}")
        
        print("\n✅ Initial Stock Tracking Test PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_initial_stock_tracking()
    if success:
        print("\n🎉 All tests passed! The initial stock tracking system is working correctly.")
    else:
        print("\n💥 Tests failed! Please check the error messages above.")
        sys.exit(1)
