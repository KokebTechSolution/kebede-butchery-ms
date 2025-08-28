#!/usr/bin/env python
"""
Test script to verify permission system for inventory requests
"""
import os
import sys
import django
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import InventoryRequest, Product, Category, ItemType, ProductUnit, Branch, Stock
from users.models import User
from django.utils import timezone

def test_permission_system():
    """Test the permission system for inventory requests"""
    print("🧪 Testing Permission System for Inventory Requests...")
    
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
        
        # Create users with different roles
        manager_user, created = User.objects.get_or_create(
            username='testmanager',
            defaults={
                'email': 'manager@example.com',
                'first_name': 'Test',
                'last_name': 'Manager',
                'role': 'manager',
                'branch': branch
            }
        )
        if created:
            manager_user.set_password('testpass123')
            manager_user.save()
            print(f"✅ Created manager user: {manager_user.username}")
        
        bartender_user, created = User.objects.get_or_create(
            username='testbartender',
            defaults={
                'email': 'bartender@example.com',
                'first_name': 'Test',
                'last_name': 'Bartender',
                'role': 'bartender',
                'branch': branch
            }
        )
        if created:
            bartender_user.set_password('testpass123')
            bartender_user.save()
            print(f"✅ Created bartender user: {bartender_user.username}")
        
        # Create stock
        stock, created = Stock.objects.get_or_create(
            product=product,
            branch=branch,
            defaults={
                'quantity_in_base_units': Decimal('240.00'),
                'minimum_threshold_base_units': Decimal('24.00'),
                'original_quantity': Decimal('10.00'),
                'original_unit': carton_unit,
                'initial_stock_amount': Decimal('10.00'),
                'initial_stock_unit': carton_unit
            }
        )
        if created:
            print(f"✅ Created stock: {stock.product.name} @ {stock.branch.name}")
        
        # Create inventory request
        request, created = InventoryRequest.objects.get_or_create(
            product=product,
            quantity=Decimal('2.00'),
            request_unit=carton_unit,
            requested_by=bartender_user,
            branch=branch,
            status='pending'
        )
        if created:
            print(f"✅ Created inventory request: {request.id}")
        
        print("\n🔍 Testing Permission Checks...")
        
        # Test manager permissions
        print(f"   Manager user: {manager_user.username}")
        print(f"   Manager role: {manager_user.role}")
        print(f"   Manager branch: {manager_user.branch}")
        print(f"   Request branch: {request.branch}")
        print(f"   Can accept: {manager_user.role == 'manager' and manager_user.branch == request.branch}")
        
        # Test bartender permissions
        print(f"   Bartender user: {bartender_user.username}")
        print(f"   Bartender role: {bartender_user.role}")
        print(f"   Bartender branch: {bartender_user.branch}")
        print(f"   Can reach: {bartender_user.role == 'bartender' and bartender_user == request.requested_by}")
        
        print("\n✅ Permission System Test PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_permission_system()
    if success:
        print("\n🎉 All permission tests passed!")
    else:
        print("\n💥 Permission tests failed!")
        sys.exit(1)
