#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from users.models import User
from branches.models import Branch, Table
from orders.models import Order, OrderItem
from inventory.models import Stock, Product, InventoryRequest, BarmanStock
from menu.models import MenuItem, MenuCategory
from payments.models import Payment, Income
from decimal import Decimal

def test_comprehensive_branch_filtering():
    print("=== Testing Comprehensive Branch Filtering ===")
    
    try:
        # Get test data
        bole_branch = Branch.objects.get(name='Bole Branch')
        coca_product = Product.objects.get(name='Coca')
        
        # Get users for different roles
        manager_user = User.objects.filter(role='manager', branch=bole_branch).first()
        waiter_user = User.objects.filter(role='waiter', branch=bole_branch).first()
        cashier_user = User.objects.filter(role='cashier', branch=bole_branch).first()
        meat_user = User.objects.filter(role='meat', branch=bole_branch).first()
        bartender_user = User.objects.filter(role='bartender', branch=bole_branch).first()
        
        if not manager_user:
            print("❌ No manager user found for Bole Branch")
            return
            
        print(f"✅ Found manager: {manager_user.username}")
        print(f"✅ Found waiter: {waiter_user.username if waiter_user else 'None'}")
        print(f"✅ Found cashier: {cashier_user.username if cashier_user else 'None'}")
        print(f"✅ Found meat: {meat_user.username if meat_user else 'None'}")
        print(f"✅ Found bartender: {bartender_user.username if bartender_user else 'None'}")
        
        # Test 1: Inventory Requests filtering
        print("\n=== Testing Inventory Requests Filtering ===")
        
        bole_requests = InventoryRequest.objects.filter(branch=bole_branch)
        print(f"Bole Branch has {bole_requests.count()} inventory requests")
        
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
        
        from django.db import models
        bole_menu_items = MenuItem.objects.filter(
            models.Q(product__store_stocks__branch=bole_branch) | 
            models.Q(product__isnull=True)
        ).distinct()
        
        print(f"Bole Branch has {bole_menu_items.count()} relevant menu items")
        
        # Test 5: Orders filtering
        print("\n=== Testing Orders Filtering ===")
        
        bole_orders = Order.objects.filter(branch=bole_branch)
        print(f"Bole Branch has {bole_orders.count()} orders")
        
        # Test 6: Tables filtering
        print("\n=== Testing Tables Filtering ===")
        
        bole_tables = Table.objects.filter(branch=bole_branch)
        print(f"Bole Branch has {bole_tables.count()} tables")
        
        # Test 7: Payments filtering
        print("\n=== Testing Payments Filtering ===")
        
        bole_payments = Payment.objects.filter(order__branch=bole_branch)
        print(f"Bole Branch has {bole_payments.count()} payments")
        
        # Test 8: Income filtering
        print("\n=== Testing Income Filtering ===")
        
        bole_income = Income.objects.filter(branch=bole_branch)
        print(f"Bole Branch has {bole_income.count()} income records")
        
        # Test 9: Users filtering
        print("\n=== Testing Users Filtering ===")
        
        bole_users = User.objects.filter(branch=bole_branch)
        print(f"Bole Branch has {bole_users.count()} users")
        
        print(f"\n✅ Comprehensive branch filtering test completed")
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_comprehensive_branch_filtering() 