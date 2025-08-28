#!/usr/bin/env python
"""
Create Sample Data Script

This script creates sample products and stocks to demonstrate the new simplified inventory system.
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Product, Category, ItemType, ProductUnit, Stock
from branches.models import Branch
from django.db import transaction
from decimal import Decimal

def create_sample_data():
    """Create sample products and stocks"""
    
    print("🚀 Creating Sample Data...")
    print("=" * 50)
    
    try:
        with transaction.atomic():
            
            # Get or create branches
            branch1, created = Branch.objects.get_or_create(
                name='Main Branch',
                defaults={'location': 'Addis Ababa, Ethiopia'}
            )
            if created:
                print(f"✅ Created branch: {branch1.name}")
            else:
                print(f"✅ Using existing branch: {branch1.name}")
            
            # Get existing ItemType and Category
            item_type = ItemType.objects.get(type_name='General')
            category = Category.objects.get(category_name='General')
            
            # Create sample products
            sample_products = [
                {
                    'name': 'Pepsi Cola',
                    'description': 'Refreshing carbonated soft drink',
                    'item_type': item_type,
                    'category': category,
                    'base_unit_price': Decimal('25.00'),
                    'conversion_amount': Decimal('24.00'),  # 24 bottles per carton
                },
                {
                    'name': 'Mirinda Orange',
                    'description': 'Orange flavored soft drink',
                    'item_type': item_type,
                    'category': category,
                    'base_unit_price': Decimal('22.00'),
                    'conversion_amount': Decimal('24.00'),  # 24 bottles per carton
                },
                {
                    'name': 'Coca Cola',
                    'description': 'Classic cola drink',
                    'item_type': item_type,
                    'category': category,
                    'base_unit_price': Decimal('28.00'),
                    'conversion_amount': Decimal('24.00'),  # 24 bottles per carton
                },
                {
                    'name': 'Fanta',
                    'description': 'Fruit flavored soft drink',
                    'item_type': category,
                    'category': category,
                    'base_unit_price': Decimal('24.00'),
                    'conversion_amount': Decimal('24.00'),  # 24 bottles per carton
                }
            ]
            
            # Get units
            base_unit = ProductUnit.objects.get(unit_name='piece')
            input_unit = ProductUnit.objects.get(unit_name='box')
            
            created_products = []
            for product_data in sample_products:
                # Fix the item_type assignment for Fanta
                if product_data['name'] == 'Fanta':
                    product_data['item_type'] = item_type
                
                product, created = Product.objects.get_or_create(
                    name=product_data['name'],
                    defaults={
                        'description': product_data['description'],
                        'item_type': product_data['item_type'],
                        'category': product_data['category'],
                        'base_unit': base_unit,
                        'input_unit': input_unit,
                        'base_unit_price': product_data['base_unit_price'],
                        'conversion_amount': product_data['conversion_amount'],
                    }
                )
                
                if created:
                    print(f"✅ Created product: {product.name}")
                else:
                    print(f"✅ Using existing product: {product.name}")
                
                created_products.append(product)
            
            # Create stocks for each product
            for product in created_products:
                stock, created = Stock.objects.get_or_create(
                    product=product,
                    branch=branch1,
                    defaults={
                        'input_quantity': Decimal('10.00'),  # 10 cartons
                        'calculated_base_units': product.conversion_amount * Decimal('10.00'),  # 240 bottles
                        'minimum_threshold_base_units': Decimal('50.00'),  # 50 bottles
                    }
                )
                
                if created:
                    print(f"✅ Created stock for {product.name}: {stock.input_quantity} {product.input_unit.unit_name} = {stock.calculated_base_units} {product.base_unit.unit_name}")
                else:
                    print(f"✅ Using existing stock for {product.name}")
            
            print(f"\n🎉 SUCCESS: Created {len(created_products)} sample products with stocks!")
            print("You can now view the inventory dashboard to see the new simplified structure.")
            
    except Exception as e:
        print(f"\n❌ ERROR: Failed to create sample data: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = create_sample_data()
    sys.exit(0 if success else 1)
