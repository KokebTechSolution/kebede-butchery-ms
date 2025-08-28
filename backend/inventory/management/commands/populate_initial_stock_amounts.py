from django.core.management.base import BaseCommand
from inventory.models import Stock
from decimal import Decimal


class Command(BaseCommand):
    help = 'Populate initial_stock_amount and initial_stock_unit for existing stock records'

    def handle(self, *args, **options):
        self.stdout.write('Starting to populate initial stock amounts...')
        
        # Get all stock records that don't have initial_stock_amount set
        stocks_to_update = Stock.objects.filter(
            initial_stock_amount=Decimal('0.00'),
            original_quantity__gt=0
        )
        
        self.stdout.write(f'Found {stocks_to_update.count()} stocks to update')
        
        updated_count = 0
        for stock in stocks_to_update:
            try:
                # Set initial stock amount to current original_quantity
                if stock.original_quantity and stock.original_quantity > 0:
                    stock.initial_stock_amount = stock.original_quantity
                    stock.initial_stock_unit = stock.original_unit
                    
                    # Save without triggering the save method logic
                    Stock.objects.filter(id=stock.id).update(
                        initial_stock_amount=stock.initial_stock_amount,
                        initial_stock_unit=stock.initial_stock_unit
                    )
                    
                    updated_count += 1
                    self.stdout.write(
                        f'Updated {stock.product.name} @ {stock.branch.name}: '
                        f'Initial amount = {stock.initial_stock_amount} {stock.initial_stock_unit.unit_name if stock.initial_stock_unit else "N/A"}'
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error updating {stock.product.name} @ {stock.branch.name}: {str(e)}'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully updated {updated_count} stock records with initial amounts'
            )
        )
