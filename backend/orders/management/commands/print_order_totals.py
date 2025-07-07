# from django.core.management.base import BaseCommand
# from orders.models import Order

# class Command(BaseCommand):
#     help = 'Print all orders, their items, item statuses, and the order total_money.'

#     def handle(self, *args, **options):
#         for order in Order.objects.all():
#             self.stdout.write(f'Order: {order.order_number} | Total: {order.total_money}')
#             for item in order.items.all():
#                 self.stdout.write(f'  Item: {item.name} | Qty: {item.quantity} | Price: {item.price} | Status: {item.status}')
#             self.stdout.write('---') 