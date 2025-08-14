#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Stock, Product, Branch, InventoryRequest, InventoryTransaction
from users.models import User
from decimal import Decimal

def test_inventory_fix():
    print("=== Testing Inventory Fix ===")
    
    try:
        # Get test data
        coca_product = Product.objects.get(name='Coca')
        bole_branch = Branch.objects.get(name='Bole Branch')
        test_user = User.objects.filter(role='bartender').first()
        
        if not test_user:
            print("No bartender user found for testing")
            return
        
        # Get current stock
        stock = Stock.objects.get(product=coca_product, branch=bole_branch)
        print(f"Current Coca stock: {stock.quantity_in_base_units}")
        
        # Create a test request
        request = InventoryRequest.objects.create(
            product=coca_product,
            quantity=Decimal('2.00'),
            request_unit=coca_product.base_unit,  # Use base unit for simplicity
            status='accepted',
            requested_by=test_user,
            branch=bole_branch,
            responded_by=test_user
        )
        
        print(f"Created test request: {request.pk}")
        
        # Simulate marking as reached
        request.status = 'fulfilled'
        request.reached_status = True
        request.save()
        
        # Check if transaction was created
        transaction = InventoryTransaction.objects.filter(
            notes__contains=f"Fulfilled request #{request.pk}"
        ).first()
        
        if transaction:
            print(f"✅ Transaction created successfully: {transaction.id}")
            print(f"Transaction details: quantity={transaction.quantity}, quantity_in_base_units={transaction.quantity_in_base_units}")
        else:
            print("❌ No transaction created")
        
        # Check stock after transaction
        stock.refresh_from_db()
        print(f"Stock after transaction: {stock.quantity_in_base_units}")
        
        # Try to create another transaction for the same request (should fail)
        print("\n=== Testing Duplicate Prevention ===")
        try:
            request.status = 'fulfilled'
            request.reached_status = True
            request.save()
            print("❌ Duplicate transaction was created (should have been prevented)")
        except Exception as e:
            print(f"✅ Duplicate prevention working: {e}")
        
        # Clean up test request
        request.delete()
        print("\n=== Test completed ===")
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_inventory_fix() 