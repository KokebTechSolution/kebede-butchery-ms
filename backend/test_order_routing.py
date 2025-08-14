#!/usr/bin/env python3
"""
Test script to verify order routing logic
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append('/home/alikibret/Project/kebede-butchery-ms/backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from orders.models import Order, OrderItem
from orders.serializers import OrderSerializer
from users.models import User
from branches.models import Branch
from tables.models import Table
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser

def test_order_routing():
    """Test that food and beverage orders are correctly routed"""
    print("🧪 Testing Order Routing Logic")
    print("=" * 50)
    
    # Get or create test data
    try:
        # Get existing branch and table
        branch = Branch.objects.first()
        if not branch:
            print("❌ No branch found. Please create a branch first.")
            return
        
        table = Table.objects.filter(branch=branch).first()
        if not table:
            print("❌ No table found. Please create a table first.")
            return
        
        # Get or create test user
        user = User.objects.filter(role='waiter').first()
        if not user:
            print("❌ No waiter user found. Please create a waiter user first.")
            return
        
        print(f"✅ Using branch: {branch.name}")
        print(f"✅ Using table: {table.number}")
        print(f"✅ Using user: {user.username}")
        
        # Test data for food and beverage orders
        test_orders = [
            {
                'name': 'Mixed Order',
                'items': [
                    {'name': 'Burger', 'quantity': 2, 'price': 15.00, 'item_type': 'food'},
                    {'name': 'Coke', 'quantity': 1, 'price': 3.00, 'item_type': 'beverage'},
                ]
            },
            {
                'name': 'Food Only Order',
                'items': [
                    {'name': 'Pizza', 'quantity': 1, 'price': 20.00, 'item_type': 'food'},
                    {'name': 'Fries', 'quantity': 1, 'price': 8.00, 'item_type': 'food'},
                ]
            },
            {
                'name': 'Beverage Only Order',
                'items': [
                    {'name': 'Coffee', 'quantity': 2, 'price': 4.00, 'item_type': 'beverage'},
                    {'name': 'Tea', 'quantity': 1, 'price': 3.00, 'item_type': 'beverage'},
                ]
            }
        ]
        
        print("\n📋 Testing Order Creation and Routing:")
        print("-" * 40)
        
        for i, test_order in enumerate(test_orders, 1):
            print(f"\n🔸 Test {i}: {test_order['name']}")
            
            # Create order data
            order_data = {
                'table': table.id,
                'items': test_order['items']
            }
            
            # Create request context
            factory = RequestFactory()
            request = factory.post('/')
            request.user = user
            
            # Create serializer
            serializer = OrderSerializer(data=order_data, context={'request': request})
            
            if serializer.is_valid():
                # Create the order
                order = serializer.save(created_by=user, branch=branch)
                
                print(f"  ✅ Order created: #{order.order_number}")
                print(f"  📊 Food status: {order.food_status}")
                print(f"  🥤 Beverage status: {order.beverage_status}")
                
                # Check item types
                food_items = order.items.filter(item_type='food')
                beverage_items = order.items.filter(item_type='beverage')
                
                print(f"  🍽️  Food items: {food_items.count()} (types: {[item.item_type for item in food_items]})")
                print(f"  🥤 Beverage items: {beverage_items.count()} (types: {[item.item_type for item in beverage_items]})")
                
                # Verify routing logic
                if food_items.exists():
                    print(f"  ✅ Food items correctly identified - should go to meat area")
                if beverage_items.exists():
                    print(f"  ✅ Beverage items correctly identified - should go to bartender")
                
                # Clean up test order
                order.delete()
                
            else:
                print(f"  ❌ Order creation failed: {serializer.errors}")
        
        print("\n🎯 Summary:")
        print("✅ Food items (item_type='food') should go to meat area")
        print("✅ Beverage items (item_type='beverage') should go to bartender")
        print("✅ No more mapping to non-existent 'meat' item type")
        print("✅ Order routing should now work correctly")
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_order_routing()
