from django.core.management.base import BaseCommand
from django.db import connection
from orders.models import Order

class Command(BaseCommand):
    help = 'Reset the PostgreSQL sequence for the orders table to fix duplicate key constraint violations'

    def handle(self, *args, **options):
        self.stdout.write('🔄 Resetting orders table sequence...')
        
        try:
            with connection.cursor() as cursor:
                # Get the maximum ID from the orders table
                cursor.execute("SELECT MAX(id) FROM orders_order")
                max_id = cursor.fetchone()[0]
                
                if max_id is None:
                    max_id = 0
                
                # Reset the sequence to the next value after the maximum ID
                next_id = max_id + 1
                cursor.execute(f"SELECT setval('orders_order_id_seq', {next_id}, false)")
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Successfully reset orders sequence to {next_id}'
                    )
                )
                self.stdout.write(f'📊 Current max order ID: {max_id}')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'❌ Error resetting sequence: {str(e)}'
                )
            )
            return False
        
        return True
