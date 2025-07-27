from django.core.management.base import BaseCommand
from inventory.models import Stock, BarmanStock
from decimal import Decimal

class Command(BaseCommand):
    help = 'Fix stock display issues by correcting original_quantity values'

    def add_arguments(self, parser):
        parser.add_argument(
            '--check-only',
            action='store_true',
            help='Only check for issues without fixing them',
        )

    def handle(self, *args, **options):
        check_only = options['check_only']
        
        self.stdout.write("Checking Stock records...")
        stock_issues = []
        
        for stock in Stock.objects.all():
            if stock.original_unit and stock.quantity_in_base_units > 0:
                try:
                    # Calculate what original_quantity should be
                    conversion_factor = stock.product.get_conversion_factor(stock.original_unit, stock.product.base_unit)
                    expected_original_quantity = stock.quantity_in_base_units / conversion_factor
                    
                    # Check if there's a significant difference
                    if abs(stock.original_quantity - expected_original_quantity) > Decimal('0.01'):
                        stock_issues.append({
                            'type': 'Stock',
                            'id': stock.id,
                            'product': stock.product.name,
                            'current_original_quantity': stock.original_quantity,
                            'expected_original_quantity': expected_original_quantity,
                            'quantity_in_base_units': stock.quantity_in_base_units,
                            'original_unit': stock.original_unit.unit_name,
                            'base_unit': stock.product.base_unit.unit_name,
                            'conversion_factor': conversion_factor
                        })
                        
                        if not check_only:
                            stock.original_quantity = expected_original_quantity.quantize(Decimal('0.01'))
                            stock.save(update_fields=['original_quantity'])
                            self.stdout.write(f"Fixed Stock {stock.id}: {stock.product.name}")
                            
                except Exception as e:
                    self.stdout.write(f"Error processing Stock {stock.id}: {e}")
        
        self.stdout.write("Checking BarmanStock records...")
        barman_issues = []
        
        for barman_stock in BarmanStock.objects.all():
            if barman_stock.original_unit and barman_stock.quantity_in_base_units > 0:
                try:
                    # Calculate what original_quantity should be
                    conversion_factor = barman_stock.stock.product.get_conversion_factor(barman_stock.original_unit, barman_stock.stock.product.base_unit)
                    expected_original_quantity = barman_stock.quantity_in_base_units / conversion_factor
                    
                    # Check if there's a significant difference
                    if barman_stock.original_quantity and abs(barman_stock.original_quantity - expected_original_quantity) > Decimal('0.01'):
                        barman_issues.append({
                            'type': 'BarmanStock',
                            'id': barman_stock.id,
                            'product': barman_stock.stock.product.name,
                            'current_original_quantity': barman_stock.original_quantity,
                            'expected_original_quantity': expected_original_quantity,
                            'quantity_in_base_units': barman_stock.quantity_in_base_units,
                            'original_unit': barman_stock.original_unit.unit_name,
                            'base_unit': barman_stock.stock.product.base_unit.unit_name,
                            'conversion_factor': conversion_factor
                        })
                        
                        if not check_only:
                            barman_stock.original_quantity = expected_original_quantity.quantize(Decimal('0.01'))
                            barman_stock.save(update_fields=['original_quantity'])
                            self.stdout.write(f"Fixed BarmanStock {barman_stock.id}: {barman_stock.stock.product.name}")
                            
                except Exception as e:
                    self.stdout.write(f"Error processing BarmanStock {barman_stock.id}: {e}")
        
        # Summary
        total_issues = len(stock_issues) + len(barman_issues)
        
        if check_only:
            self.stdout.write(f"\nFound {total_issues} issues:")
            for issue in stock_issues + barman_issues:
                self.stdout.write(f"- {issue['type']} {issue['id']}: {issue['product']}")
                self.stdout.write(f"  Current: {issue['current_original_quantity']} {issue['original_unit']}")
                self.stdout.write(f"  Expected: {issue['expected_original_quantity']} {issue['original_unit']}")
                self.stdout.write(f"  Base units: {issue['quantity_in_base_units']} {issue['base_unit']}")
                self.stdout.write(f"  Conversion: 1 {issue['original_unit']} = {issue['conversion_factor']} {issue['base_unit']}")
                self.stdout.write("")
        else:
            self.stdout.write(f"\nFixed {total_issues} issues.")
            
        self.stdout.write(self.style.SUCCESS('Done!')) 