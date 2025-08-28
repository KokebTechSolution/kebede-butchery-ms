#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from django.test import RequestFactory
from inventory.views import ProductViewSet
from inventory.serializers import ProductWithStockSerializer
from inventory.models import Product

def test_api_response():
    print("Testing API response for /api/inventory/stocks/")
    print("=" * 80)
    
    # Create a mock request
    factory = RequestFactory()
    request = factory.get('/api/inventory/stocks/')
    
    # Get the viewset
    viewset = ProductViewSet()
    viewset.request = request
    
    # Get products with stocks
    products = Product.objects.all()
    
    print(f"Found {products.count()} products")
    print()
    
    for product in products:
        print(f"Product: {product.name}")
        
        # Serialize the product
        serializer = ProductWithStockSerializer(product, context={'request': request})
        data = serializer.data
        
        if 'store_stocks' in data and data['store_stocks']:
            for stock_data in data['store_stocks']:
                print(f"  Stock ID: {stock_data.get('id')}")
                print(f"  Branch: {stock_data.get('branch', {}).get('name', 'N/A')}")
                print(f"  quantity_in_base_units: {stock_data.get('quantity_in_base_units')}")
                print(f"  original_quantity: {stock_data.get('original_quantity')}")
                print(f"  original_unit: {stock_data.get('original_unit', {}).get('unit_name', 'N/A') if stock_data.get('original_unit') else 'None'}")
                print(f"  base_unit: {data.get('base_unit', {}).get('unit_name', 'N/A') if data.get('base_unit') else 'None'}")
                print()
        else:
            print("  No stocks found")
            print()
        
        print("-" * 40)

if __name__ == '__main__':
    test_api_response()
