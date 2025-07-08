from django.core.management.base import BaseCommand
from orders.models import Order
from django.db.models import Count

class Command(BaseCommand):
    help = 'Find and clean up duplicate orders by order_number, keeping only the first occurrence.'

    def handle(self, *args, **options):
        dupes = Order.objects.values('order_number').annotate(count=Count('id')).filter(count__gt=1)
        total_deleted = 0
        for d in dupes:
            orders = list(Order.objects.filter(order_number=d['order_number']).order_by('id'))
            # Keep the first, delete the rest
            for o in orders[1:]:
                self.stdout.write(f"Deleting Order ID: {o.id}, Order Number: {o.order_number}, Created By: {o.created_by}")
                o.delete()
                total_deleted += 1
        self.stdout.write(self.style.SUCCESS(f"Cleanup complete. Deleted {total_deleted} duplicate orders.")) 