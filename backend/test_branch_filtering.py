#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Stock, Product, Branch, InventoryRequest, BarmanStock
from menu.models import MenuItem
from users.models import User
from decimal import Decimal

def test_branch_filtering():
    print("=== Testing Branch Filtering ===")
    
    try:
        # Get test data
        bole_branch = Branch.objects.get(name='Bole Branch')
        coca_product = Product.objects.get(name='Coca')
        
        # Get users
        manager_user = User.objects.filter(role='manager', branch=bole_branch).first()
        bartender_user = User.objects.filter(role='bartender', branch=bole_branch).first()
        
        if not manager_user:
            print("❌ No manager user found for Bole Branch")
            return
            
        if not bartender_user:
            print("❌ No bartender user found for Bole Branch")
            return
        
        print(f"✅ Found manager: {manager_user.username}")
        print(f"✅ Found bartender: {bartender_user.username}")
        
        # Test 1: Inventory Requests filtering
        print("\n=== Testing Inventory Requests Filtering ===")
        
        # Create a test request for Bole Branch
        test_request = InventoryRequest.objects.create(
            product=coca_product,
            quantity=Decimal('5.00'),
            request_unit=coca_product.base_unit,
            status='pending',
            requested_by=bartender_user,
            branch=bole_branch
        )
        
        print(f"✅ Created test request: {test_request.id}")
        
        # Test filtering for manager
        manager_requests = InventoryRequest.objects.filter(branch=manager_user.branch)
        print(f"Manager can see {manager_requests.count()} requests for their branch")
        
        # Test filtering for bartender
        bartender_requests = InventoryRequest.objects.filter(branch=bartender_user.branch)
        print(f"Bartender can see {bartender_requests.count()} requests for their branch")
        
        # Test 2: Stock filtering
        print("\n=== Testing Stock Filtering ===")
        
        bole_stocks = Stock.objects.filter(branch=bole_branch)
        print(f"Bole Branch has {bole_stocks.count()} stock records")
        
        # Test 3: Barman Stock filtering
        print("\n=== Testing Barman Stock Filtering ===")
        
        bole_barman_stocks = BarmanStock.objects.filter(branch=bole_branch)
        print(f"Bole Branch has {bole_barman_stocks.count()} barman stock records")
        
        # Test 4: Menu Items filtering
        print("\n=== Testing Menu Items Filtering ===")
        
        # Get menu items that have products with stock in Bole Branch
        from django.db import models
        bole_menu_items = MenuItem.objects.filter(
            models.Q(product__store_stocks__branch=bole_branch) | 
            models.Q(product__isnull=True)
        ).distinct()
        
        print(f"Bole Branch has {bole_menu_items.count()} relevant menu items")
        
        # Clean up
        test_request.delete()
        print(f"\n✅ Test completed and cleaned up")
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_branch_filtering() 