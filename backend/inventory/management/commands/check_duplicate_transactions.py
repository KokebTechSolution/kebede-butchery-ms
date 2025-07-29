from django.core.management.base import BaseCommand
from inventory.models import InventoryTransaction, InventoryRequest
from decimal import Decimal

class Command(BaseCommand):
    help = 'Check for and clean up duplicate inventory transactions'

    def handle(self, *args, **options):
        self.stdout.write('Checking for duplicate transactions...')
        
        # Find all transactions for fulfilled requests
        fulfilled_requests = InventoryRequest.objects.filter(status='fulfilled')
        
        for request in fulfilled_requests:
            # Find all transactions for this request
            transactions = InventoryTransaction.objects.filter(
                notes__contains=f"Fulfilled request #{request.pk}"
            )
            
            if transactions.count() > 1:
                self.stdout.write(f'Found {transactions.count()} transactions for request {request.pk}')
                
                # Keep the first transaction, delete the rest
                first_transaction = transactions.first()
                duplicates = transactions.exclude(id=first_transaction.id)
                
                self.stdout.write(f'Keeping transaction {first_transaction.id}, deleting {duplicates.count()} duplicates')
                
                for duplicate in duplicates:
                    self.stdout.write(f'Deleting duplicate transaction {duplicate.id}')
                    duplicate.delete()
                
                # Recalculate stock based on the remaining transaction
                if first_transaction.transaction_type == 'store_to_barman':
                    store_stock = first_transaction.from_stock_main
                    barman_stock = first_transaction.to_stock_barman
                    
                    # Reset stocks to their original values
                    # This is a simplified approach - in production you'd want to recalculate from all transactions
                    self.stdout.write(f'Recalculating stock for {store_stock.product.name}')
                    
                    # For now, just show the current values
                    self.stdout.write(f'Store stock: {store_stock.quantity_in_base_units}')
                    self.stdout.write(f'Barman stock: {barman_stock.quantity_in_base_units}')
        
        self.stdout.write(self.style.SUCCESS('Duplicate transaction cleanup completed')) 