from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from orders.models import Order, OrderItem
from inventory.models import Stock, InventoryTransaction, AuditLog, ProductUnit
from django.utils import timezone
from django.db import transaction as db_transaction
from django.contrib.contenttypes.models import ContentType

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

            # Get the appropriate unit for this product
            try:
                transaction_unit = product.base_unit
            except:
                # Fallback to a default unit
                transaction_unit = ProductUnit.objects.filter(unit_name='unit').first()
                if not transaction_unit:
                    transaction_unit = ProductUnit.objects.first()

            # Deduct from stock based on product type
            if product.uses_carton:
                # For products that use cartons
                if stock.carton_qty >= quantity:
                    stock.carton_qty -= quantity
                    deducted = True
                    unit_type = 'carton'
                elif stock.bottle_qty >= quantity:
                    stock.bottle_qty -= quantity
                    deducted = True
                    unit_type = 'bottle'
                elif stock.unit_qty >= quantity:
                    stock.unit_qty -= quantity
                    deducted = True
                    unit_type = 'unit'
            else:
                # For products that don't use cartons
                if stock.unit_qty >= quantity:
                    stock.unit_qty -= quantity
                    deducted = True
                    unit_type = 'unit'
                elif stock.bottle_qty >= quantity:
                    stock.bottle_qty -= quantity
                    deducted = True
                    unit_type = 'bottle'

            if deducted:
                stock.save()
                print(f"✅ Stock deducted: {quantity} {unit_type} of {product.name} from {branch.name}")
                
                # Create inventory transaction record
                InventoryTransaction.objects.create(
                    product=product,
                    branch=branch,
                    transaction_type='deduction',
                    quantity=quantity,
                    unit_type=unit_type,
                    reason=f'Order #{instance.order_number}',
                    user=user,
                    timestamp=timezone.now()
                )
                
                # Create audit log
                AuditLog.objects.create(
                    user=user,
                    action='stock_deduction',
                    model_name='Stock',
                    object_id=stock.id,
                    details=f'Deducted {quantity} {unit_type} of {product.name} for order #{instance.order_number}',
                    timestamp=timezone.now()
                )
            else:
                print(f"❌ Insufficient stock for {product.name} in {branch.name}")

@receiver(post_save, sender=Order)
def update_table_status_on_order_change(sender, instance, **kwargs):
    """Update table status when order status changes"""
    if not instance.table:
        return
    
    try:
        # Update the table status based on the order
        instance.table.update_status_from_order(instance)
        print(f"✅ Table {instance.table.number} status updated to '{instance.table.status}' for order #{instance.order_number}")
    except Exception as e:
        print(f"❌ Error updating table status: {e}")

@receiver(post_delete, sender=Order)
def update_table_status_on_order_deletion(sender, instance, **kwargs):
    """Update table status when order is deleted"""
    if not instance.table:
        return
    
    try:
        # Check if there are other active orders for this table
        from orders.models import Order
        other_active_orders = Order.objects.filter(
            table=instance.table
        ).exclude(
            id=instance.id
        ).exclude(
            food_status__in=['completed', 'cancelled', 'rejected'],
            beverage_status__in=['completed', 'cancelled', 'rejected']
        )
        
        if other_active_orders.exists():
            # There are other active orders, update status based on the latest one
            latest_order = other_active_orders.latest('created_at')
            instance.table.update_status_from_order(latest_order)
        else:
            # No other active orders, mark table as available
            instance.table.update_status_from_order(None)
        
        print(f"✅ Table {instance.table.number} status updated after order deletion")
    except Exception as e:
        print(f"❌ Error updating table status after order deletion: {e}")

@receiver(post_save, sender=OrderItem)
def update_order_status_on_item_change(sender, instance, **kwargs):
    """Update order status when item status changes"""
    order = instance.order
    
    # Check if all items are completed
    all_items = order.items.all()
    food_items = all_items.filter(item_type='food')
    beverage_items = all_items.filter(item_type='beverage')
    
    # Update food status
    if food_items.exists():
        if all(item.status == 'completed' for item in food_items):
            order.food_status = 'completed'
        elif any(item.status == 'preparing' for item in food_items):
            order.food_status = 'preparing'
        elif any(item.status == 'pending' for item in food_items):
            order.food_status = 'pending'
    else:
        order.food_status = 'not_applicable'
    
    # Update beverage status
    if beverage_items.exists():
        if all(item.status == 'completed' for item in beverage_items):
            order.beverage_status = 'completed'
        elif any(item.status == 'preparing' for item in beverage_items):
            order.beverage_status = 'preparing'
        elif any(item.status == 'pending' for item in beverage_items):
            order.beverage_status = 'pending'
    else:
        order.beverage_status = 'not_applicable'
    
    order.save()
    
    # Update table status based on the new order status
    if order.table:
        order.table.update_status_from_order(order)
