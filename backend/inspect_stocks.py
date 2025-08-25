#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Stock

def inspect_stocks():
    print("Inspecting Stock records...")
    print("=" * 80)
    
    stocks_with_issues = []
    total_stocks = 0
    
    for stock in Stock.objects.all():
        total_stocks += 1
        print(f"Stock ID: {stock.id}")
        print(f"Product: {stock.product.name}")
        print(f"Branch: {stock.branch.name}")
        print(f"quantity_in_base_units: {stock.quantity_in_base_units}")
        print(f"original_quantity: {stock.original_quantity}")
        print(f"original_unit: {stock.original_unit.unit_name if stock.original_unit else 'None'}")
        print(f"base_unit: {stock.product.base_unit.unit_name if stock.product.base_unit else 'None'}")
        print(f"minimum_threshold_base_units: {stock.minimum_threshold_base_units}")
        
        # Check for issues
        if stock.original_quantity is None or stock.original_quantity == 0 or stock.original_unit is None:
            stocks_with_issues.append({
                'id': stock.id,
                'product': stock.product.name,
                'issue': 'Missing original_quantity or original_unit'
            })
        
        print("-" * 40)
    
    print(f"\nSUMMARY:")
    print(f"Total stocks: {total_stocks}")
    print(f"Stocks with issues: {len(stocks_with_issues)}")
    
    if stocks_with_issues:
        print("\nStocks that need fixing:")
        for issue in stocks_with_issues:
            print(f"- Stock {issue['id']}: {issue['product']} - {issue['issue']}")

if __name__ == '__main__':
    inspect_stocks()
