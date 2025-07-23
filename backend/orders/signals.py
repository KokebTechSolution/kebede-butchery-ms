from django.db.models.signals import post_save
from django.dispatch import receiver
from orders.models import Order, OrderItem
from inventory.models import Stock, InventoryTransaction, AuditLog
from django.utils import timezone
from django.db import transaction as db_transaction

@receiver(post_save, sender=Order)
def handle_order_stock_and_logs(sender, instance, created, **kwargs):
    if not created:
        return  # Only act on new orders

    branch = instance.branch
    user = instance.created_by

    with db_transaction.atomic():
        for item in instance.items.all():
            product = item.product
            quantity = item.quantity
            unit_type = 'unit'  # default unless overridden below

            try:
                stock = Stock.objects.select_for_update().get(product=product, branch=branch)
            except Stock.DoesNotExist:
                print(f"⚠️ No stock for {product.name} in branch {branch.name}")
                continue

            deducted = False

            # Deduct carton
            if product.uses_carton:
                if stock.carton_quantity >= quantity:
                    stock.carton_quantity -= quantity
                    unit_type = 'carton'
                    deducted = True
                elif stock.quantity_in_base_units >= quantity * product.bottles_per_carton:
                    stock.quantity_in_base_units -= quantity * product.bottles_per_carton
                    unit_type = 'bottle'
                    deducted = True
            else:
                if stock.unit_quantity >= quantity:
                    stock.unit_quantity -= quantity
                    unit_type = 'unit'
                    deducted = True

            if deducted:
                stock.save()

                # Log InventoryTransaction
                InventoryTransaction.objects.create(
                    product=product,
                    transaction_type='sale',
                    quantity=quantity,
                    unit_type=unit_type,
                    branch=branch
                )

                # Log Audit
                AuditLog.objects.create(
                    product=product,
                    action_type='sale',
                    quantity=quantity,
                    unit_type=unit_type,
                    action_by=user,
                    branch=branch,
                    note=f"Sale from order #{instance.order_number}"
                )
            else:
                print(f"🚫 Not enough stock for product: {product.name} at branch {branch.name}")
