from django.core.management.base import BaseCommand
from inventory.models import Category, ItemType
from menu.models import MenuCategory

class Command(BaseCommand):
    help = 'Check and create categories for menu system'

    def handle(self, *args, **options):
        self.stdout.write("🔍 Checking categories in database...")
        
        # Check inventory categories
        self.stdout.write("\n📊 Inventory Categories:")
        inventory_categories = Category.objects.all()
        self.stdout.write(f"Found {inventory_categories.count()} inventory categories")
        for cat in inventory_categories:
            self.stdout.write(f"  - {cat.category_name} ({cat.item_type.type_name})")
        
        # Check menu categories
        self.stdout.write("\n📊 Menu Categories:")
        menu_categories = MenuCategory.objects.all()
        self.stdout.write(f"Found {menu_categories.count()} menu categories")
        for cat in menu_categories:
            self.stdout.write(f"  - {cat.name}")
        
        # Check item types
        self.stdout.write("\n📊 Item Types:")
        item_types = ItemType.objects.all()
        self.stdout.write(f"Found {item_types.count()} item types")
        for it in item_types:
            self.stdout.write(f"  - {it.type_name}")
        
        # Create some test data if none exists
        if inventory_categories.count() == 0:
            self.stdout.write("\n➕ Creating test categories...")
            
            # Create item types if they don't exist
            beverage_type, created = ItemType.objects.get_or_create(type_name='Beverage')
            food_type, created = ItemType.objects.get_or_create(type_name='Food')
            
            # Create some categories
            categories_data = [
                ('Soft Drinks', beverage_type),
                ('Beer', beverage_type),
                ('Wine', beverage_type),
                ('Spirits', beverage_type),
                ('Main Course', food_type),
                ('Appetizers', food_type),
                ('Desserts', food_type),
            ]
            
            for cat_name, item_type in categories_data:
                category, created = Category.objects.get_or_create(
                    category_name=cat_name,
                    item_type=item_type
                )
                if created:
                    self.stdout.write(f"  ✅ Created: {cat_name}")
                else:
                    self.stdout.write(f"  ℹ️  Already exists: {cat_name}")
        
        self.stdout.write("\n✅ Category check complete!") 