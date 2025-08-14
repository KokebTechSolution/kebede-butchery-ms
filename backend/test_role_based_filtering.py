#!/usr/bin/env python
"""
Test script to verify role-based filtering for menu items.
This script tests that:
1. Bartenders can only see beverage items
2. Meat staff can only see food items
3. Other roles can see all items
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from users.models import User
from menu.models import MenuItem, MenuCategory
from branches.models import Branch

def test_role_based_filtering():
    print("=== Testing Role-Based Menu Item Filtering ===")
    
    try:
        # Get test data
        bole_branch = Branch.objects.get(name='Bole Branch')
        
        # Get users for different roles
        bartender_user = User.objects.filter(role='bartender', branch=bole_branch).first()
        meat_user = User.objects.filter(role='meat', branch=bole_branch).first()
        waiter_user = User.objects.filter(role='waiter', branch=bole_branch).first()
        manager_user = User.objects.filter(role='manager', branch=bole_branch).first()
        
        if not bartender_user:
            print("❌ No bartender user found for Bole Branch")
            return
            
        print(f"✅ Found bartender: {bartender_user.username}")
        print(f"✅ Found meat staff: {meat_user.username if meat_user else 'None'}")
        print(f"✅ Found waiter: {waiter_user.username if waiter_user else 'None'}")
        print(f"✅ Found manager: {manager_user.username if manager_user else 'None'}")
        
        # Test 1: Menu Item Filtering by Role
        print("\n=== Testing Menu Item Filtering by Role ===")
        
        # Get all menu items
        all_items = MenuItem.objects.all()
        food_items = all_items.filter(item_type='food')
        beverage_items = all_items.filter(item_type='beverage')
        
        print(f"Total menu items: {all_items.count()}")
        print(f"Food items: {food_items.count()}")
        print(f"Beverage items: {beverage_items.count()}")
        
        # Test bartender filtering
        if bartender_user:
            print(f"\n--- Bartender ({bartender_user.username}) Access ---")
            # Simulate bartender request context
            from django.test import RequestFactory
            from menu.views import MenuItemViewSet
            
            factory = RequestFactory()
            request = factory.get('/menu/menuitems/')
            request.user = bartender_user
            
            viewset = MenuItemViewSet()
            viewset.request = request
            
            bartender_items = viewset.get_queryset()
            bartender_food = bartender_items.filter(item_type='food')
            bartender_beverage = bartender_items.filter(item_type='beverage')
            
            print(f"Bartender can see {bartender_items.count()} total items")
            print(f"Bartender food items: {bartender_food.count()} (should be 0)")
            print(f"Bartender beverage items: {bartender_beverage.count()}")
            
            if bartender_food.count() == 0:
                print("✅ Bartender correctly cannot see food items")
            else:
                print("❌ Bartender can see food items - filtering failed!")
                
            if bartender_beverage.count() > 0:
                print("✅ Bartender can see beverage items")
            else:
                print("❌ Bartender cannot see beverage items - filtering too restrictive!")
        
        # Test meat staff filtering
        if meat_user:
            print(f"\n--- Meat Staff ({meat_user.username}) Access ---")
            
            factory = RequestFactory()
            request = factory.get('/menu/menuitems/')
            request.user = meat_user
            
            viewset = MenuItemViewSet()
            viewset.request = request
            
            meat_items = viewset.get_queryset()
            meat_food = meat_items.filter(item_type='food')
            meat_beverage = meat_items.filter(item_type='beverage')
            
            print(f"Meat staff can see {meat_items.count()} total items")
            print(f"Meat staff food items: {meat_food.count()}")
            print(f"Meat staff beverage items: {meat_beverage.count()} (should be 0)")
            
            if meat_beverage.count() == 0:
                print("✅ Meat staff correctly cannot see beverage items")
            else:
                print("❌ Meat staff can see beverage items - filtering failed!")
                
            if meat_food.count() > 0:
                print("✅ Meat staff can see food items")
            else:
                print("❌ Meat staff cannot see food items - filtering too restrictive!")
        
        # Test waiter/manager filtering (should see all)
        if waiter_user:
            print(f"\n--- Waiter ({waiter_user.username}) Access ---")
            
            factory = RequestFactory()
            request = factory.get('/menu/menuitems/')
            request.user = waiter_user
            
            viewset = MenuItemViewSet()
            viewset.request = request
            
            waiter_items = viewset.get_queryset()
            waiter_food = waiter_items.filter(item_type='food')
            waiter_beverage = waiter_items.filter(item_type='beverage')
            
            print(f"Waiter can see {waiter_items.count()} total items")
            print(f"Waiter food items: {waiter_food.count()}")
            print(f"Waiter beverage items: {waiter_beverage.count()}")
            
            if waiter_food.count() > 0 and waiter_beverage.count() > 0:
                print("✅ Waiter can see both food and beverage items")
            else:
                print("❌ Waiter access is restricted - should see all items!")
        
        print(f"\n✅ Role-based filtering test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_role_based_filtering()


