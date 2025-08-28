#!/usr/bin/env python
"""
Fix Product Relationships Script

This script fixes the product relationships by:
1. Creating default ItemType if none exist
2. Creating default Category if none exist  
3. Updating existing products to have proper item_type and category relationships
4. Ensuring all products have the required fields populated
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Product, Category, ItemType, ProductUnit
from django.db import transaction

def create_default_data():
    """Create default ItemType, Category, and ProductUnit if they don't exist"""
    
    # Create default ItemType
    default_item_type, created = ItemType.objects.get_or_create(
        type_name='General',
        defaults={'type_name': 'General'}
    )
    if created:
        print(f"✅ Created default ItemType: {default_item_type.type_name}")
    else:
        print(f"✅ Using existing ItemType: {default_item_type.type_name}")
    
    # Create default Category
    default_category, created = Category.objects.get_or_create(
        category_name='General',
        item_type=default_item_type,
        defaults={'category_name': 'General', 'item_type': default_item_type}
    )
    if created:
        print(f"✅ Created default Category: {default_category.category_name}")
    else:
        print(f"✅ Using existing Category: {default_category.category_name}")
    
    # Create default ProductUnit
    default_base_unit, created = ProductUnit.objects.get_or_create(
        unit_name='piece',
        defaults={'unit_name': 'piece', 'is_liquid_unit': False}
    )
    if created:
        print(f"✅ Created default base unit: {default_base_unit.unit_name}")
    else:
        print(f"✅ Using existing base unit: {default_base_unit.unit_name}")
    
    default_input_unit, created = ProductUnit.objects.get_or_create(
        unit_name='box',
        defaults={'unit_name': 'box', 'is_liquid_unit': False}
    )
    if created:
        print(f"✅ Created default input unit: {default_input_unit.unit_name}")
    else:
        print(f"✅ Using existing input unit: {default_input_unit.unit_name}")
    
    return default_item_type, default_category, default_base_unit, default_input_unit

def fix_product_relationships():
    """Fix existing products to have proper relationships"""
    
    print("\n🔧 Fixing Product Relationships...")
    
    # Get default values
    default_item_type, default_category, default_base_unit, default_input_unit = create_default_data()
    
    # Get all products
    products = Product.objects.all()
    print(f"📊 Found {products.count()} products to fix")
    
    fixed_count = 0
    for product in products:
        needs_update = False
        
        # Fix item_type if missing
        if not product.item_type:
            product.item_type = default_item_type
            needs_update = True
            print(f"  🔧 Fixed item_type for {product.name}")
        
        # Fix category if missing
        if not product.category:
            product.category = default_category
            needs_update = True
            print(f"  🔧 Fixed category for {product.name}")
        
        # Fix base_unit if missing
        if not product.base_unit:
            product.base_unit = default_base_unit
            needs_update = True
            print(f"  🔧 Fixed base_unit for {product.name}")
        
        # Fix input_unit if missing
        if not product.input_unit:
            product.input_unit = default_input_unit
            needs_update = True
            print(f"  🔧 Fixed input_unit for {product.name}")
        
        # Fix conversion_amount if missing
        if not product.conversion_amount:
            product.conversion_amount = 1.0  # Default 1:1 conversion
            needs_update = True
            print(f"  🔧 Fixed conversion_amount for {product.name}")
        
        # Fix base_unit_price if missing
        if not product.base_unit_price:
            product.base_unit_price = 0.00  # Default price
            needs_update = True
            print(f"  🔧 Fixed base_unit_price for {product.name}")
        
        if needs_update:
            try:
                product.save()
                fixed_count += 1
            except Exception as e:
                print(f"  ❌ Error saving {product.name}: {e}")
    
    print(f"\n✅ Fixed {fixed_count} products")
    return fixed_count

def verify_fixes():
    """Verify that all products now have proper relationships"""
    
    print("\n🔍 Verifying Fixes...")
    
    products = Product.objects.all()
    issues_found = 0
    
    for product in products:
        if not product.item_type:
            print(f"  ❌ {product.name} still missing item_type")
            issues_found += 1
        
        if not product.category:
            print(f"  ❌ {product.name} still missing category")
            issues_found += 1
        
        if not product.base_unit:
            print(f"  ❌ {product.name} still missing base_unit")
            issues_found += 1
        
        if not product.input_unit:
            print(f"  ❌ {product.name} still missing input_unit")
            issues_found += 1
        
        if not product.conversion_amount:
            print(f"  ❌ {product.name} still missing conversion_amount")
            issues_found += 1
    
    if issues_found == 0:
        print("  ✅ All products have proper relationships!")
    else:
        print(f"  ⚠️ Found {issues_found} issues that need manual attention")
    
    return issues_found

def main():
    """Main function to run the fix"""
    
    print("🚀 Starting Product Relationship Fix...")
    print("=" * 50)
    
    try:
        with transaction.atomic():
            # Fix the relationships
            fixed_count = fix_product_relationships()
            
            # Verify the fixes
            issues_found = verify_fixes()
            
            if issues_found == 0:
                print("\n🎉 SUCCESS: All product relationships have been fixed!")
                print(f"📊 Fixed {fixed_count} products")
            else:
                print(f"\n⚠️  PARTIAL SUCCESS: Fixed {fixed_count} products, but {issues_found} issues remain")
                
    except Exception as e:
        print(f"\n❌ ERROR: Failed to fix product relationships: {e}")
        print("Rolling back changes...")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
