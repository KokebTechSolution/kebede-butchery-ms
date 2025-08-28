from django.core.management.base import BaseCommand
from inventory.models import ItemType, Category

class Command(BaseCommand):
    help = 'Set up initial Food and Beverage item types and categories'

    def handle(self, *args, **options):
        self.stdout.write('Setting up Food and Beverage structure...')
        
        # Create Food item type
        food_type, created = ItemType.objects.get_or_create(
            type_name='food',
            defaults={
                'description': 'Food items including meat, vegetables, and prepared dishes'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created Food item type: {food_type}'))
        else:
            self.stdout.write(f'Food item type already exists: {food_type}')
        
        # Create Beverage item type
        beverage_type, created = ItemType.objects.get_or_create(
            type_name='beverage',
            defaults={
                'description': 'Beverage items including alcoholic and non-alcoholic drinks'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created Beverage item type: {beverage_type}'))
        else:
            self.stdout.write(f'Beverage item type already exists: {beverage_type}')
        
        # Create Food categories
        food_categories = [
            {'name': 'Meat', 'description': 'Fresh meat and meat products', 'sort_order': 1},
            {'name': 'Vegetables', 'description': 'Fresh vegetables and greens', 'sort_order': 2},
            {'name': 'Grains', 'description': 'Rice, bread, and grain products', 'sort_order': 3},
            {'name': 'Dairy', 'description': 'Milk, cheese, and dairy products', 'sort_order': 4},
            {'name': 'Spices', 'description': 'Herbs, spices, and seasonings', 'sort_order': 5},
            {'name': 'Prepared Food', 'description': 'Ready-to-eat and prepared dishes', 'sort_order': 6},
        ]
        
        for cat_data in food_categories:
            category, created = Category.objects.get_or_create(
                item_type=food_type,
                category_name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'sort_order': cat_data['sort_order'],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created Food category: {category.category_name}'))
            else:
                self.stdout.write(f'Food category already exists: {category.category_name}')
        
        # Create Beverage categories
        beverage_categories = [
            {'name': 'Soft Drinks', 'description': 'Non-alcoholic carbonated and non-carbonated drinks', 'sort_order': 1},
            {'name': 'Alcoholic Beer', 'description': 'Beer and ale products', 'sort_order': 2},
            {'name': 'Alcoholic Wine', 'description': 'Wine and wine-based products', 'sort_order': 3},
            {'name': 'Alcoholic Spirits', 'description': 'Hard liquor and spirits', 'sort_order': 4},
            {'name': 'Hot Beverages', 'description': 'Coffee, tea, and hot drinks', 'sort_order': 5},
            {'name': 'Juices', 'description': 'Fresh and packaged fruit juices', 'sort_order': 6},
            {'name': 'Energy Drinks', 'description': 'Energy and sports drinks', 'sort_order': 7},
        ]
        
        for cat_data in beverage_categories:
            category, created = Category.objects.get_or_create(
                item_type=beverage_type,
                category_name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'sort_order': cat_data['sort_order'],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created Beverage category: {category.category_name}'))
            else:
                self.stdout.write(f'Beverage category already exists: {category.category_name}')
        
        self.stdout.write(self.style.SUCCESS('Food and Beverage structure setup completed!'))
        
        # Display summary
        self.stdout.write('\nSummary:')
        self.stdout.write(f'  - Item Types: {ItemType.objects.count()}')
        self.stdout.write(f'  - Food Categories: {Category.objects.filter(item_type=food_type).count()}')
        self.stdout.write(f'  - Beverage Categories: {Category.objects.filter(item_type=beverage_type).count()}')
        self.stdout.write(f'  - Total Categories: {Category.objects.count()}')
