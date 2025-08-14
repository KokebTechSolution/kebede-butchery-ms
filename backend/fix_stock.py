#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Stock, Product, Branch
from decimal import Decimal

def reset_coca_stock():
    print("Resetting Coca stock...")
    
    try:
        # Find Coca product
        coca_product = Product.objects.get(name='Coca')
        bole_branch = Branch.objects.get(name='Bole Branch')
        
        # Get the stock
        stock = Stock.objects.get(product=coca_product, branch=bole_branch)
        
        print(f"Current Coca stock: {stock.quantity_in_base_units}")
        
        # Reset to 220 (or whatever the correct value should be)
        correct_value = Decimal('220.00')
        stock.quantity_in_base_units = correct_value
        stock.save()
        
        print(f"Reset Coca stock to: {stock.quantity_in_base_units}")
        print("Coca stock reset successfully")
        
    except Product.DoesNotExist:
        print("Coca product not found")
    except Branch.DoesNotExist:
        print("Bole Branch not found")
    except Stock.DoesNotExist:
        print("Coca stock not found")
    except Exception as e:
        print(f"Error: {e}")

def check_duplicate_transactions():
    print("\nChecking for duplicate transactions...")
    
    from inventory.models import InventoryTransaction, InventoryRequest
    
    # Find all transactions for fulfilled requests
    fulfilled_requests = InventoryRequest.objects.filter(status='fulfilled')
    
    for request in fulfilled_requests:
        # Find all transactions for this request
        transactions = InventoryTransaction.objects.filter(
            notes__contains=f"Fulfilled request #{request.pk}"
        )
        
        if transactions.count() > 1:
            print(f"Found {transactions.count()} transactions for request {request.pk}")
            
            # Keep the first transaction, delete the rest
            first_transaction = transactions.first()
            duplicates = transactions.exclude(id=first_transaction.id)
            
            print(f"Keeping transaction {first_transaction.id}, deleting {duplicates.count()} duplicates")
            
            for duplicate in duplicates:
                print(f"Deleting duplicate transaction {duplicate.id}")
                duplicate.delete()
    
    print("Duplicate transaction cleanup completed")

if __name__ == "__main__":
    print("=== Stock Fix Script ===")
    reset_coca_stock()
    check_duplicate_transactions()
    print("\n=== Script completed ===")
    print("\nNow test the inventory request functionality:")
    print("1. Create a new inventory request for Coca (quantity 2)")
    print("2. Accept it as a manager")
    print("3. Mark it as 'reached'")
    print("4. Check if the stock value is correct (should be 218, not 270)") 