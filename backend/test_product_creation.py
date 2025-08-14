#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Stock, Product, Branch, ProductUnit, Category, ItemType, InventoryTransaction
from decimal import Decimal

def test_product_creation():
    print("=== Testing Product Creation Fix ===")
    
    try:
        # Get test data
        bole_branch = Branch.objects.get(name='Bole Branch')
        beverage_type = ItemType.objects.get(type_name='Beverage')
        soft_drink_category = Category.objects.get(category_name='Soft Drink')
        bottle_unit = ProductUnit.objects.get(unit_name='bottle')
        carton_unit = ProductUnit.objects.get(unit_name='carton')
        
        # Test data
        test_product_name = "TEST_PRODUCT_DELETE_ME"
        input_quantity = Decimal('10.00')  # 10 cartons
        conversion_amount = Decimal('24.00')  # 24 bottles per carton
        expected_base_units = input_quantity * conversion_amount  # 240 bottles
        
        print(f"Test data:")
        print(f"  Product name: {test_product_name}")
        print(f"  Input quantity: {input_quantity} cartons")
        print(f"  Conversion: {conversion_amount} bottles per carton")
        print(f"  Expected base units: {expected_base_units}")
        
        # Clean up any existing test product
        Product.objects.filter(name=test_product_name).delete()
        
        # Create product data similar to frontend
        product_data = {
            'name': test_product_name,
            'description': 'Test product for double calculation fix',
            'base_unit_price': Decimal('23.00'),
            'base_unit_id': bottle_unit.id,
            'category_id': soft_drink_category.id,
            'stock': {
                'branch_id': bole_branch.id,
                'quantity_in_base_units': expected_base_units,
                'original_quantity': input_quantity,
                'original_unit_id': carton_unit.id,
                'minimum_threshold_base_units': Decimal('24.00'),
            },
            'measurement': {
                'from_unit_id': carton_unit.id,
                'to_unit_id': bottle_unit.id,
                'amount_per': conversion_amount,
                'is_default_sales_unit': True,
            },
        }
        
        print(f"\nCreating product with data: {product_data}")
        
        # Import the viewset to test the creation
        from inventory.views import ProductViewSet
        viewset = ProductViewSet()
        
        # Create the product using the same logic as the API
        created_product = viewset.create_product_with_related(product_data)
        
        print(f"✅ Product created successfully: {created_product.id}")
        
        # Check the stock
        stock = Stock.objects.get(product=created_product, branch=bole_branch)
        print(f"Stock details:")
        print(f"  quantity_in_base_units: {stock.quantity_in_base_units}")
        print(f"  original_quantity: {stock.original_quantity}")
        print(f"  original_unit: {stock.original_unit.unit_name}")
        
        # Check if the quantity is correct (should be 240, not 480)
        if stock.quantity_in_base_units == expected_base_units:
            print(f"✅ SUCCESS: Stock quantity is correct ({stock.quantity_in_base_units})")
        else:
            print(f"❌ FAILED: Stock quantity is wrong. Expected {expected_base_units}, got {stock.quantity_in_base_units}")
        
        # Check the transaction
        transaction = InventoryTransaction.objects.filter(
            product=created_product,
            transaction_type='restock'
        ).first()
        
        if transaction:
            print(f"Transaction details:")
            print(f"  quantity_in_base_units: {transaction.quantity_in_base_units}")
            print(f"  quantity: {transaction.quantity}")
            print(f"  transaction_unit: {transaction.transaction_unit.unit_name}")
            
            if transaction.quantity_in_base_units == expected_base_units:
                print(f"✅ SUCCESS: Transaction quantity is correct ({transaction.quantity_in_base_units})")
            else:
                print(f"❌ FAILED: Transaction quantity is wrong. Expected {expected_base_units}, got {transaction.quantity_in_base_units}")
        else:
            print("❌ FAILED: No transaction found")
        
        # Clean up
        created_product.delete()
        print(f"\n✅ Test completed and cleaned up")
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_product_creation() 