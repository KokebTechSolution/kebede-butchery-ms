from django.core.management.base import BaseCommand
from menu.models import MenuCategory
from inventory.models import Category as InventoryCategory, ItemType

class Command(BaseCommand):
    help = 'Populate menu categories automatically from inventory categories or create default ones'

    def add_arguments(self, parser):
        parser.add_argument(
            '--from-inventory',
            action='store_true',
            help='Create menu categories based on existing inventory categories',
        )
        parser.add_argument(
            '--default',
            action='store_true',
            help='Create default menu categories',
        )

    def handle(self, *args, **options):
        if options['from_inventory']:
            self.create_from_inventory()
        elif options['default']:
            self.create_default_categories()
        else:
            # Default behavior: try inventory first, then fallback to defaults
            if InventoryCategory.objects.exists():
                self.create_from_inventory()
            else:
                self.create_default_categories()

    def create_from_inventory(self):
        """Create menu categories based on existing inventory categories"""
        self.stdout.write('Creating menu categories from inventory categories...')
        
        # Get all inventory categories
        inventory_categories = InventoryCategory.objects.all()
        
        if not inventory_categories.exists():
            self.stdout.write(self.style.WARNING('No inventory categories found. Creating default categories instead.'))
            self.create_default_categories()
            return

        created_count = 0
        for inv_cat in inventory_categories:
            # Create menu category name based on inventory category
            menu_cat_name = self.generate_menu_category_name(inv_cat)
            
            # Check if menu category already exists
            if not MenuCategory.objects.filter(name=menu_cat_name).exists():
                MenuCategory.objects.create(name=menu_cat_name)
                created_count += 1
                self.stdout.write(f'Created menu category: {menu_cat_name}')

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} menu categories from inventory categories.')
        )

    def create_default_categories(self):
        """Create default menu categories"""
        self.stdout.write('Creating default menu categories...')
        
        # Simplified categories for waiter interface (FOOD and DRINK)
        default_categories = [
            # Main food categories
            'Main Dishes',
            'Appetizers', 
            'Desserts',
            'Snacks',
            'Sides',
            'Salads',
            'Soups',
            'Grilled Items',
            'Fried Items',
            'Pasta & Rice',
            'Bread & Pastries',
            
            # Main beverage categories
            'Alcoholic Drinks',
            'Non-Alcoholic Drinks',
            'Hot Drinks',
            'Cold Drinks',
            'Juices',
            'Smoothies',
            'Coffee & Tea',
            'Wine & Spirits',
            'Beer & Cider',
            'Soft Drinks',
            'Water',
        ]

        created_count = 0
        for cat_name in default_categories:
            if not MenuCategory.objects.filter(name=cat_name).exists():
                MenuCategory.objects.create(name=cat_name)
                created_count += 1
                self.stdout.write(f'Created menu category: {cat_name}')

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} default menu categories.')
        )

    def generate_menu_category_name(self, inventory_category):
        """Generate appropriate menu category name from inventory category"""
        item_type = inventory_category.item_type.type_name.lower()
        category_name = inventory_category.category_name
        
        # Map inventory categories to menu categories
        if 'beverage' in item_type or 'drink' in item_type:
            if any(word in category_name.lower() for word in ['beer', 'wine', 'spirit', 'alcohol']):
                return 'Alcoholic Drinks'
            elif any(word in category_name.lower() for word in ['juice', 'soda', 'water', 'tea', 'coffee']):
                return 'Non-Alcoholic Drinks'
            else:
                return 'Beverages'
        elif 'food' in item_type:
            if any(word in category_name.lower() for word in ['main', 'entree', 'dish']):
                return 'Main Dishes'
            elif any(word in category_name.lower() for word in ['appetizer', 'starter', 'snack']):
                return 'Appetizers'
            elif any(word in category_name.lower() for word in ['dessert', 'sweet', 'cake']):
                return 'Desserts'
            elif any(word in category_name.lower() for word in ['salad', 'vegetable']):
                return 'Salads'
            elif any(word in category_name.lower() for word in ['soup', 'broth']):
                return 'Soups'
            elif any(word in category_name.lower() for word in ['bread', 'pastry', 'bun']):
                return 'Bread & Pastries'
            else:
                return 'Main Dishes'
        else:
            # Default mapping
            return category_name 