#!/usr/bin/env python
"""
Comprehensive System Test Script
Tests all major components of the Kebede Butchery Management System
"""

import os
import sys
import django
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db import transaction
from inventory.models import (
    ItemType, Category, Product, ProductUnit, ProductMeasurement,
    Stock, BarmanStock, InventoryTransaction, InventoryRequest, AuditLog
)
from branches.models import Branch
from orders.models import Order, OrderItem

User = get_user_model()

def test_user_management():
    """Test user management functionality"""
    print("🔍 Testing User Management...")
    
    try:
        # Test user creation
        user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User',
            phone_number='1234567890',
            role='waiter'
        )
        print("✅ User creation successful")
        
        # Test user update with is_active
        user.is_active = False
        user.save()
        print("✅ User is_active update successful")
        
        # Test user serialization
        from users.serializers import UserListSerializer
        serializer = UserListSerializer(user)
        data = serializer.data
        assert 'is_active' in data
        assert 'updated_at' in data
        print("✅ User serialization successful")
        
        user.delete()
        print("✅ User deletion successful")
        
    except Exception as e:
        print(f"❌ User management test failed: {e}")
        return False
    
    return True

def test_inventory_models():
    """Test inventory model creation and relationships"""
    print("🔍 Testing Inventory Models...")
    
    try:
        # Create basic units
        item_type = ItemType.objects.create(type_name='Beverage')
        category = Category.objects.create(
            item_type=item_type,
            category_name='Soft Drinks'
        )
        
        # Create units
        bottle_unit = ProductUnit.objects.create(
            unit_name='bottle',
            abbreviation='btl',
            is_liquid_unit=True
        )
        carton_unit = ProductUnit.objects.create(
            unit_name='carton',
            abbreviation='ctn',
            is_liquid_unit=False
        )
        
        # Create product
        product = Product.objects.create(
            name='Test Pepsi',
            category=category,
            base_unit=bottle_unit,
            base_unit_price=Decimal('50.00'),
            volume_per_base_unit_ml=Decimal('500.00')
        )
        
        # Create measurement conversion
        measurement = ProductMeasurement.objects.create(
            product=product,
            from_unit=carton_unit,
            to_unit=bottle_unit,
            amount_per=Decimal('24.00'),
            is_default_sales_unit=True
        )
        
        print("✅ Inventory model creation successful")
        
        # Test conversion factor
        conversion = product.get_conversion_factor(carton_unit, bottle_unit)
        assert conversion == Decimal('24.00')
        print("✅ Product conversion factor calculation successful")
        
        # Cleanup
        product.delete()
        category.delete()
        item_type.delete()
        bottle_unit.delete()
        carton_unit.delete()
        
    except Exception as e:
        print(f"❌ Inventory models test failed: {e}")
        return False
    
    return True

def test_stock_management():
    """Test stock management functionality"""
    print("🔍 Testing Stock Management...")
    
    try:
        # Create test data
        branch = Branch.objects.create(name='Test Branch', location='Test Location')
        item_type = ItemType.objects.create(type_name='Beverage')
        category = Category.objects.create(item_type=item_type, category_name='Soft Drinks')
        bottle_unit = ProductUnit.objects.create(unit_name='bottle', abbreviation='btl')
        product = Product.objects.create(
            name='Test Product',
            category=category,
            base_unit=bottle_unit,
            base_unit_price=Decimal('50.00')
        )
        
        # Create stock
        stock = Stock.objects.create(
            product=product,
            branch=branch,
            quantity_in_base_units=Decimal('100.00'),
            minimum_threshold_base_units=Decimal('10.00'),
            original_quantity=Decimal('4.00'),
            original_unit=bottle_unit
        )
        
        print("✅ Stock creation successful")
        
        # Test stock adjustment
        stock.adjust_quantity(Decimal('10.00'), bottle_unit, is_addition=False)
        assert stock.quantity_in_base_units == Decimal('90.00')
        print("✅ Stock adjustment successful")
        
        # Test running out status
        stock.quantity_in_base_units = Decimal('5.00')
        stock.save()
        assert stock.running_out == True
        print("✅ Running out status calculation successful")
        
        # Cleanup
        stock.delete()
        product.delete()
        category.delete()
        item_type.delete()
        bottle_unit.delete()
        branch.delete()
        
    except Exception as e:
        print(f"❌ Stock management test failed: {e}")
        return False
    
    return True

def test_inventory_transactions():
    """Test inventory transaction functionality"""
    print("🔍 Testing Inventory Transactions...")
    
    try:
        # Create test data
        branch = Branch.objects.create(name='Test Branch', location='Test Location')
        user = User.objects.create_user(username='testuser', password='testpass')
        item_type = ItemType.objects.create(type_name='Beverage')
        category = Category.objects.create(item_type=item_type, category_name='Soft Drinks')
        bottle_unit = ProductUnit.objects.create(unit_name='bottle', abbreviation='btl')
        product = Product.objects.create(
            name='Test Product',
            category=category,
            base_unit=bottle_unit,
            base_unit_price=Decimal('50.00')
        )
        stock = Stock.objects.create(
            product=product,
            branch=branch,
            quantity_in_base_units=Decimal('100.00'),
            minimum_threshold_base_units=Decimal('10.00')
        )
        
        # Test restock transaction
        transaction = InventoryTransaction.objects.create(
            product=product,
            transaction_type='restock',
            quantity=Decimal('10.00'),
            transaction_unit=bottle_unit,
            to_stock_main=stock,
            initiated_by=user,
            branch=branch,
            price_at_transaction=Decimal('45.00'),
            notes='Test restock'
        )
        
        print("✅ Inventory transaction creation successful")
        
        # Verify stock was updated
        stock.refresh_from_db()
        assert stock.quantity_in_base_units == Decimal('110.00')
        print("✅ Stock update from transaction successful")
        
        # Test sale transaction
        sale_transaction = InventoryTransaction.objects.create(
            product=product,
            transaction_type='sale',
            quantity=Decimal('5.00'),
            transaction_unit=bottle_unit,
            from_stock_main=stock,
            initiated_by=user,
            branch=branch,
            price_at_transaction=Decimal('50.00'),
            notes='Test sale'
        )
        
        # Verify stock was reduced
        stock.refresh_from_db()
        assert stock.quantity_in_base_units == Decimal('105.00')
        print("✅ Sale transaction successful")
        
        # Cleanup
        sale_transaction.delete()
        transaction.delete()
        stock.delete()
        product.delete()
        category.delete()
        item_type.delete()
        bottle_unit.delete()
        user.delete()
        branch.delete()
        
    except Exception as e:
        print(f"❌ Inventory transactions test failed: {e}")
        return False
    
    return True

def test_inventory_requests():
    """Test inventory request functionality"""
    print("🔍 Testing Inventory Requests...")
    
    try:
        # Create test data
        branch = Branch.objects.create(name='Test Branch', location='Test Location')
        user = User.objects.create_user(username='testuser', password='testpass')
        item_type = ItemType.objects.create(type_name='Beverage')
        category = Category.objects.create(item_type=item_type, category_name='Soft Drinks')
        bottle_unit = ProductUnit.objects.create(unit_name='bottle', abbreviation='btl')
        product = Product.objects.create(
            name='Test Product',
            category=category,
            base_unit=bottle_unit,
            base_unit_price=Decimal('50.00')
        )
        
        # Create inventory request
        request = InventoryRequest.objects.create(
            product=product,
            quantity=Decimal('10.00'),
            request_unit=bottle_unit,
            requested_by=user,
            branch=branch,
            notes='Test request'
        )
        
        print("✅ Inventory request creation successful")
        
        # Test request status update
        request.status = 'accepted'
        request.responded_by = user
        request.save()
        
        assert request.status == 'accepted'
        print("✅ Inventory request status update successful")
        
        # Cleanup
        request.delete()
        product.delete()
        category.delete()
        item_type.delete()
        bottle_unit.delete()
        user.delete()
        branch.delete()
        
    except Exception as e:
        print(f"❌ Inventory requests test failed: {e}")
        return False
    
    return True

def test_audit_logging():
    """Test audit logging functionality"""
    print("🔍 Testing Audit Logging...")
    
    try:
        from django.contrib.contenttypes.models import ContentType
        
        # Create test data
        user = User.objects.create_user(username='testuser', password='testpass')
        item_type = ItemType.objects.create(type_name='Beverage')
        category = Category.objects.create(item_type=item_type, category_name='Soft Drinks')
        product = Product.objects.create(
            name='Test Product',
            category=category
        )
        
        # Create audit log entry
        audit_log = AuditLog.objects.create(
            user=user,
            action='product_created',
            object_id=product.id,
            content_type=ContentType.objects.get_for_model(product),
            details={
                'product_name': product.name,
                'category_name': category.category_name
            },
            notes='Test audit log entry'
        )
        
        print("✅ Audit log creation successful")
        
        # Test audit log methods
        assert audit_log.logged_object_display() == product.name
        print("✅ Audit log methods successful")
        
        # Cleanup
        audit_log.delete()
        product.delete()
        category.delete()
        item_type.delete()
        user.delete()
        
    except Exception as e:
        print(f"❌ Audit logging test failed: {e}")
        return False
    
    return True

def main():
    """Run all tests"""
    print("🚀 Starting Comprehensive System Test...")
    print("=" * 50)
    
    tests = [
        test_user_management,
        test_inventory_models,
        test_stock_management,
        test_inventory_transactions,
        test_inventory_requests,
        test_audit_logging
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
            print()
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {e}")
            print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! System is working correctly.")
        return True
    else:
        print("⚠️ Some tests failed. Please check the errors above.")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1) 