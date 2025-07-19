import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')
django.setup()

from inventory.models import Product, Category, ItemType, Stock, BarmanStock
from users.models import User
from branches.models import Branch
from decimal import Decimal

def create_test_data():
    print("Creating test data for barman stock...")
    
    # Create item type if it doesn't exist
    item_type, created = ItemType.objects.get_or_create(type_name='beverage')
    if created:
        print(f"Created item type: {item_type.type_name}")
    
    # Create category if it doesn't exist
    category, created = Category.objects.get_or_create(
        category_name='Beer',
        item_type=item_type
    )
    if created:
        print(f"Created category: {category.category_name}")
    
    # Create product if it doesn't exist
    product, created = Product.objects.get_or_create(
        name='Heineken Beer',
        defaults={
            'category': category,
            'base_unit': 'bottle',
            'price_per_unit': Decimal('5.00')
        }
    )
    if created:
        print(f"Created product: {product.name}")
    
    # Create branch if it doesn't exist
    branch, created = Branch.objects.get_or_create(
        name='Main Branch',
        defaults={'location': 'Addis Ababa'}
    )
    if created:
        print(f"Created branch: {branch.name}")
    
    # Create stock if it doesn't exist
    stock, created = Stock.objects.get_or_create(
        product=product,
        branch=branch,
        defaults={
            'minimum_threshold': Decimal('10.00'),
            'running_out': False
        }
    )
    if created:
        print(f"Created stock for {product.name} at {branch.name}")
    
    # Create a test user (bartender) if it doesn't exist
    bartender, created = User.objects.get_or_create(
        username='test_bartender',
        defaults={
            'first_name': 'Test',
            'last_name': 'Bartender',
            'email': 'bartender@test.com',
            'role': 'bartender',
            'branch': branch
        }
    )
    if created:
        print(f"Created bartender: {bartender.username}")
    
    # Create barman stock if it doesn't exist
    barman_stock, created = BarmanStock.objects.get_or_create(
        stock=stock,
        bartender=bartender,
        defaults={
            'carton_quantity': Decimal('2.00'),
            'bottle_quantity': Decimal('24.00'),
            'litre_quantity': Decimal('0.00'),
            'unit_quantity': Decimal('0.00'),
            'shot_quantity': Decimal('0.00'),
            'minimum_threshold': Decimal('5.00'),
            'running_out': False
        }
    )
    if created:
        print(f"Created barman stock for {bartender.username}")
        print(f"  - Carton quantity: {barman_stock.carton_quantity}")
        print(f"  - Bottle quantity: {barman_stock.bottle_quantity}")
    else:
        print(f"Barman stock already exists for {bartender.username}")
        print(f"  - Carton quantity: {barman_stock.carton_quantity}")
        print(f"  - Bottle quantity: {barman_stock.bottle_quantity}")
    
    print("\nTest data creation completed!")
    print(f"Bartender ID: {bartender.id}")
    print(f"Branch ID: {branch.id}")
    print(f"Product: {product.name}")

if __name__ == "__main__":
    create_test_data() 