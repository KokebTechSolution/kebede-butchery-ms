from django.core.management.base import BaseCommand
from inventory.models import InventoryTransaction, Stock, BarmanStock
from decimal import Decimal

class Command(BaseCommand):
    help = 'Fix stock values by recalculating from transactions'

    def handle(self, *args, **options):
        self.stdout.write('Fixing stock values...')
        
        # Get all stocks
        stocks = Stock.objects.all()
        
        for stock in stocks:
            self.stdout.write(f'Processing stock for {stock.product.name} at {stock.branch.name}')
            
            # Calculate what the stock should be based on transactions
            # Start with the original stock value (you might need to set this manually)
            # For now, let's assume we want to reset to a reasonable value
            
            # Get all transactions for this stock
            incoming_transactions = InventoryTransaction.objects.filter(
                to_stock_main=stock
            ).exclude(transaction_type='store_to_barman')
            
            outgoing_transactions = InventoryTransaction.objects.filter(
                from_stock_main=stock
            ).exclude(transaction_type='store_to_barman')
            
            # Calculate net change
            total_incoming = sum(t.quantity_in_base_units for t in incoming_transactions)
            total_outgoing = sum(t.quantity_in_base_units for t in outgoing_transactions)
            
            # For store_to_barman transactions, we need to subtract from store stock
            store_to_barman_transactions = InventoryTransaction.objects.filter(
                from_stock_main=stock,
                transaction_type='store_to_barman'
            )
            
            total_transferred_out = sum(t.quantity_in_base_units for t in store_to_barman_transactions)
            
            # Calculate what the stock should be
            # This is a simplified calculation - you might need to adjust based on your business logic
            current_stock = stock.quantity_in_base_units
            self.stdout.write(f'Current stock: {current_stock}')
            self.stdout.write(f'Total incoming: {total_incoming}')
            self.stdout.write(f'Total outgoing: {total_outgoing}')
            self.stdout.write(f'Total transferred out: {total_transferred_out}')
            
            # If the stock seems too high, we can reset it
            # For now, let's just show the information
            self.stdout.write(f'Stock {stock.product.name} at {stock.branch.name}: {current_stock}')
        
        self.stdout.write(self.style.SUCCESS('Stock value analysis completed')) 