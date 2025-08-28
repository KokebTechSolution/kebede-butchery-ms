from django.core.management.base import BaseCommand
from inventory.models import Category
from menu.models import MenuCategory

class Command(BaseCommand):
    help = 'Sync existing inventory categories to menu categories'

    def handle(self, *args, **options):
        self.stdout.write('Syncing inventory categories to menu categories...')
        
        synced_count = 0
        created_count = 0
        
        for inventory_category in Category.objects.all():
            try:
                # Map item_type to menu item_type
                item_type = inventory_category.item_type.type_name if inventory_category.item_type else ''
                menu_item_type = 'beverage' if 'beverage' in item_type.lower() else 'food'
                
                # Try to get existing or create new
                menu_category, created = MenuCategory.objects.get_or_create(
                    name=inventory_category.category_name,
                    item_type=menu_item_type,
                    defaults={
                        'name': inventory_category.category_name,
                        'item_type': menu_item_type
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Created MenuCategory: {menu_category.name} ({menu_category.item_type})')
                    )
                else:
                    synced_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'⚠️ Already exists: {menu_category.name} ({menu_category.item_type})')
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error syncing category {inventory_category.category_name}: {e}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Sync complete! Created: {created_count}, Already existed: {synced_count}'
            )
        )
