from django.core.management.base import BaseCommand
from inventory.models import Stock, Product, Branch
from decimal import Decimal

class Command(BaseCommand):
    help = 'Reset Coca stock to correct value'

    def handle(self, *args, **options):
        self.stdout.write('Resetting Coca stock...')
        
        try:
            # Find Coca product
            coca_product = Product.objects.get(name='Coca')
            bole_branch = Branch.objects.get(name='Bole Branch')
            
            # Get the stock
            stock = Stock.objects.get(product=coca_product, branch=bole_branch)
            
            self.stdout.write(f'Current Coca stock: {stock.quantity_in_base_units}')
            
            # Reset to 220 (or whatever the correct value should be)
            correct_value = Decimal('220.00')
            stock.quantity_in_base_units = correct_value
            stock.save()
            
            self.stdout.write(f'Reset Coca stock to: {stock.quantity_in_base_units}')
            self.stdout.write(self.style.SUCCESS('Coca stock reset successfully'))
            
        except Product.DoesNotExist:
            self.stdout.write(self.style.ERROR('Coca product not found'))
        except Branch.DoesNotExist:
            self.stdout.write(self.style.ERROR('Bole Branch not found'))
        except Stock.DoesNotExist:
            self.stdout.write(self.style.ERROR('Coca stock not found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}')) 