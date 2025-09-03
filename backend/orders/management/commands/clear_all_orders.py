from django.core.management.base import BaseCommand
from django.db import connection
from orders.models import Order, OrderItem

class Command(BaseCommand):
    help = 'Clear all orders, order items, payments, and income records, then reset sequences to start fresh'

    def handle(self, *args, **options):
        self.stdout.write('🧹 Clearing all orders, order items, payments, and income records...')
        
        try:
            # Delete income records first (they reference payments)
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM payments_income")
                income_deleted = cursor.rowcount
            self.stdout.write(f'🗑️ Deleted {income_deleted} income records')
            
            # Delete payment records (they reference orders)
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM payments_payment")
                payments_deleted = cursor.rowcount
            self.stdout.write(f'🗑️ Deleted {payments_deleted} payment records')
            
            # Delete all order items (they reference orders)
            order_items_count = OrderItem.objects.count()
            OrderItem.objects.all().delete()
            self.stdout.write(f'🗑️ Deleted {order_items_count} order items')
            
            # Delete all orders (now safe to delete)
            orders_count = Order.objects.count()
            Order.objects.all().delete()
            self.stdout.write(f'🗑️ Deleted {orders_count} orders')
            
            # Reset sequences to start from 1
            with connection.cursor() as cursor:
                cursor.execute("SELECT setval('orders_order_id_seq', 1, false)")
                cursor.execute("SELECT setval('orders_orderitem_id_seq', 1, false)")
            
            self.stdout.write(
                self.style.SUCCESS(
                    '✅ Successfully cleared all orders, items, payments, and income!'
                )
            )
            self.stdout.write('🔄 Sequences reset to start from ID 1')
            self.stdout.write('📊 Database is now clean and ready for fresh testing!')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'❌ Error clearing data: {str(e)}'
                )
            )
            return False
        
        return True
