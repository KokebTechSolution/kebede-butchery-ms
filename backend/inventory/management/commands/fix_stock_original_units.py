from django.core.management.base import BaseCommand
from inventory.models import Stock, ProductMeasurement, ProductUnit
from decimal import Decimal


class Command(BaseCommand):
    help = 'Fix stock original units to use the input unit (from_unit) instead of base unit'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        stocks = Stock.objects.all()
        fixed_count = 0
        skipped_count = 0
        
        self.stdout.write(f"Checking {stocks.count()} stocks for correct original units...")
        
        for stock in stocks:
            # Get the product's measurement that shows the input unit
            measurement = ProductMeasurement.objects.filter(
                product=stock.product,
                is_default_sales_unit=True
            ).first()
            
            if not measurement:
                self.stdout.write(f"⚠ {stock.product.name} - No default measurement found, skipping")
                skipped_count += 1
                continue
            
            # The from_unit should be the original unit (input unit)
            correct_original_unit = measurement.from_unit
            
            if stock.original_unit == correct_original_unit:
                self.stdout.write(f"✓ {stock.product.name} - Already has correct original unit: {correct_original_unit.unit_name}")
                skipped_count += 1
                continue
            
            self.stdout.write(f"⚠ {stock.product.name} - Current: {stock.original_unit.unit_name}, Should be: {correct_original_unit.unit_name}")
            
            if not dry_run:
                try:
                    # Recalculate original quantity based on the correct unit
                    if stock.original_unit != correct_original_unit:
                        # Convert from current original unit to base unit, then to correct original unit
                        current_to_base = stock.product.get_conversion_factor(stock.original_unit, stock.product.base_unit)
                        base_to_correct = stock.product.get_conversion_factor(stock.product.base_unit, correct_original_unit)
                        
                        # Calculate new original quantity
                        new_original_quantity = (stock.original_quantity * current_to_base * base_to_correct).quantize(Decimal('0.01'))
                        
                        stock.original_unit = correct_original_unit
                        stock.original_quantity = new_original_quantity
                        stock.save()
                        
                        self.stdout.write(f"✓ {stock.product.name} - Updated to {correct_original_unit.unit_name}: {new_original_quantity}")
                    else:
                        stock.original_unit = correct_original_unit
                        stock.save()
                        self.stdout.write(f"✓ {stock.product.name} - Updated original unit to {correct_original_unit.unit_name}")
                    
                    fixed_count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"✗ {stock.product.name} - Error: {e}"))
            else:
                self.stdout.write(f"Would fix {stock.product.name} - Set original unit to {correct_original_unit.unit_name}")
                fixed_count += 1
        
        # Summary
        self.stdout.write("")
        self.stdout.write("=" * 50)
        self.stdout.write("SUMMARY:")
        self.stdout.write(f"Stocks checked: {stocks.count()}")
        self.stdout.write(f"Stocks fixed: {fixed_count}")
        self.stdout.write(f"Stocks skipped: {skipped_count}")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN - No changes were made"))
        else:
            self.stdout.write(self.style.SUCCESS("Stock original units have been fixed!")) 