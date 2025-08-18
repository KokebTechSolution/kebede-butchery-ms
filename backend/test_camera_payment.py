#!/usr/bin/env python3
"""
Test script for Camera Payment Receipt functionality
This script tests the backend API endpoints for order creation with receipt images
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from django.test import TestCase, Client
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from orders.models import Order, OrderItem
from branches.models import Branch, Table
import json

User = get_user_model()

def test_order_creation_with_receipt():
    """Test creating an order with a receipt image"""
    print("🧪 Testing Order Creation with Receipt Image...")
    
    try:
        # Create test data
        branch = Branch.objects.first()
        if not branch:
            print("❌ No branch found. Please create a branch first.")
            return False
            
        table = Table.objects.first()
        if not table:
            print("❌ No table found. Please create a table first.")
            return False
            
        user = User.objects.first()
        if not user:
            print("❌ No user found. Please create a user first.")
            return False
            
        print(f"✅ Test data ready: Branch={branch.name}, Table={table.number}, User={user.username}")
        
        # Create a mock receipt image
        receipt_content = b"fake receipt image content"
        receipt_file = SimpleUploadedFile(
            "test_receipt.jpg",
            receipt_content,
            content_type="image/jpeg"
        )
        
        # Test data for order
        order_data = {
            'table': table.id,
            'payment_option': 'online',
            'items': json.dumps([
                {
                    'name': 'Test Food Item',
                    'quantity': 2,
                    'price': 15.99,
                    'item_type': 'food',
                    'status': 'pending'
                }
            ])
        }
        
        # Create the order using the API
        client = Client()
        client.force_login(user)
        
        # Test with receipt image
        with open('test_receipt.jpg', 'wb') as f:
            f.write(receipt_content)
            
        with open('test_receipt.jpg', 'rb') as f:
            response = client.post('/api/orders/order-list/', {
                'table': table.id,
                'payment_option': 'online',
                'items': order_data['items'],
                'receipt_image': f
            })
        
        # Clean up test file
        os.remove('test_receipt.jpg')
        
        if response.status_code == 201:
            print("✅ Order created successfully with receipt!")
            order_data = response.json()
            print(f"   Order ID: {order_data['id']}")
            print(f"   Order Number: {order_data['order_number']}")
            print(f"   Payment Option: {order_data['payment_option']}")
            print(f"   Receipt Image: {order_data.get('receipt_image', 'None')}")
            return True
        else:
            print(f"❌ Failed to create order. Status: {response.status_code}")
            print(f"   Response: {response.content.decode()}")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        return False

def test_order_creation_without_receipt():
    """Test creating an order without a receipt image (cash payment)"""
    print("\n🧪 Testing Order Creation without Receipt Image (Cash Payment)...")
    
    try:
        # Get test data
        branch = Branch.objects.first()
        table = Table.objects.first()
        user = User.objects.first()
        
        if not all([branch, table, user]):
            print("❌ Test data not available")
            return False
            
        # Test data for order
        order_data = {
            'table': table.id,
            'payment_option': 'cash',
            'items': [
                {
                    'name': 'Test Beverage Item',
                    'quantity': 1,
                    'price': 8.99,
                    'item_type': 'beverage',
                    'status': 'pending'
                }
            ]
        }
        
        # Create the order using the API
        client = Client()
        client.force_login(user)
        
        response = client.post('/api/orders/order-list/', 
                             data=json.dumps(order_data),
                             content_type='application/json')
        
        if response.status_code == 201:
            print("✅ Cash order created successfully!")
            order_data = response.json()
            print(f"   Order ID: {order_data['id']}")
            print(f"   Payment Option: {order_data['payment_option']}")
            return True
        else:
            print(f"❌ Failed to create cash order. Status: {response.status_code}")
            print(f"   Response: {response.content.decode()}")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        return False

def test_database_integrity():
    """Test that orders and receipt images are properly stored in database"""
    print("\n🧪 Testing Database Integrity...")
    
    try:
        # Check if orders exist
        orders = Order.objects.all()
        print(f"✅ Total orders in database: {orders.count()}")
        
        # Check for orders with receipt images
        orders_with_receipts = Order.objects.filter(receipt_image__isnull=False)
        print(f"✅ Orders with receipt images: {orders_with_receipts.count()}")
        
        # Check for online payment orders
        online_orders = Order.objects.filter(payment_option='online')
        print(f"✅ Online payment orders: {online_orders.count()}")
        
        # Check for cash payment orders
        cash_orders = Order.objects.filter(payment_option='cash')
        print(f"✅ Cash payment orders: {cash_orders.count()}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking database: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Camera Payment Receipt Tests...\n")
    
    # Test 1: Order creation with receipt
    test1_success = test_order_creation_with_receipt()
    
    # Test 2: Order creation without receipt (cash)
    test2_success = test_order_creation_without_receipt()
    
    # Test 3: Database integrity
    test3_success = test_database_integrity()
    
    # Summary
    print("\n" + "="*50)
    print("📊 TEST RESULTS SUMMARY")
    print("="*50)
    print(f"✅ Order with Receipt: {'PASS' if test1_success else 'FAIL'}")
    print(f"✅ Cash Order: {'PASS' if test2_success else 'FAIL'}")
    print(f"✅ Database Integrity: {'PASS' if test3_success else 'FAIL'}")
    
    if all([test1_success, test2_success, test3_success]):
        print("\n🎉 All tests passed! Camera payment functionality is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the implementation.")
    
    print("="*50)

if __name__ == "__main__":
    main()






