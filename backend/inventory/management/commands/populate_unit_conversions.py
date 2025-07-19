from django.core.management.base import BaseCommand
from inventory.models import UnitConversion, Product

class Command(BaseCommand):
    help = 'Populate UnitConversion table with sample conversion data'

    def handle(self, *args, **options):
        # Clear existing conversions
        UnitConversion.objects.all().delete()
        
        # Get all products
        products = Product.objects.all()
        
        # Sample conversion data
        conversions_data = [
            # Carton conversions
            {'from_unit': 'carton', 'to_unit': 'bottle', 'multiplier': 24},
            {'from_unit': 'carton', 'to_unit': 'shot', 'multiplier': 384},  # 24 bottles * 16 shots
            
            # Bottle conversions
            {'from_unit': 'bottle', 'to_unit': 'shot', 'multiplier': 16},
            
            # Litre conversions
            {'from_unit': 'litre', 'to_unit': 'shot', 'multiplier': 33},
            
            # Unit conversions
            {'from_unit': 'unit', 'to_unit': 'shot', 'multiplier': 1},
        ]
        
        created_count = 0
        
        for conversion_data in conversions_data:
            for product in products:
                conversion, created = UnitConversion.objects.get_or_create(
                    product=product,
                    from_unit=conversion_data['from_unit'],
                    to_unit=conversion_data['to_unit'],
                    defaults={'multiplier': conversion_data['multiplier']}
                )
                if created:
                    created_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} unit conversions for {products.count()} products'
            )
        ) 