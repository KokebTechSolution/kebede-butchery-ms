from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from orders.models import Order, OrderItem
from inventory.models import Stock, InventoryTransaction, AuditLog, BarmanStock, StockUnit
from django.utils import timezone
from django.db import transaction as db_transaction
from decimal import Decimal

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

            # Skip if no product linked (food items without inventory products)
            if not product:
                continue

            try:
                stock = Stock.objects.select_for_update().get(product=product, branch=branch)
            except Stock.DoesNotExist:
                print(f"⚠️ No stock for {product.name} in branch {branch.name}")
                continue

            deducted = False

            # For beverage items, reduce from barman stock first
            if item.item_type == 'beverage':
                deducted = reduce_barman_stock_for_beverage(item, stock, branch, user, instance)
            else:
                # For food items, use existing logic
                deducted = reduce_main_stock_for_food(product, stock, quantity, unit_type)

            if deducted:
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

@receiver(post_save, sender=OrderItem)
def handle_order_item_stock_reduction(sender, instance, created, **kwargs):
    """
    Handle stock reduction when new items are added to existing orders
    """
    if not created:
        return  # Only handle new items being added
    
    # Skip if this is part of a new order (handled by Order signal)
    if instance.order.created_at == instance.order.updated_at:
        return  # This is a new order, let the Order signal handle it
    
    # Only handle beverage items
    if instance.item_type != 'beverage' or not instance.product:
        return
    
    order = instance.order
    branch = order.branch
    user = order.created_by
    
    with db_transaction.atomic():
        try:
            stock = Stock.objects.select_for_update().get(product=instance.product, branch=branch)
        except Stock.DoesNotExist:
            print(f"⚠️ No stock for {instance.product.name} in branch {branch.name}")
            return
        
        # Reduce from barman stock
        if reduce_barman_stock_for_beverage(instance, stock, branch, user, order):
            # Log InventoryTransaction
            InventoryTransaction.objects.create(
                product=instance.product,
                transaction_type='sale',
                quantity=instance.quantity,
                unit_type='unit',  # Default unit type for new items
                branch=branch
            )

            # Log Audit
            AuditLog.objects.create(
                product=instance.product,
                action_type='sale',
                quantity=instance.quantity,
                unit_type='unit',
                action_by=user,
                branch=branch,
                note=f"Additional item sale from order #{order.order_number}"
            )
        else:
            print(f"🚫 Not enough barman stock for product: {instance.product.name} at branch {branch.name}")

@receiver(post_delete, sender=Order)
def handle_order_cancellation_stock_restoration(sender, instance, **kwargs):
    """
    Restore stock when an order is cancelled/deleted
    """
    branch = instance.branch
    user = instance.created_by
    
    with db_transaction.atomic():
        for item in instance.items.all():
            if not item.product:
                continue
                
            try:
                stock = Stock.objects.select_for_update().get(product=item.product, branch=branch)
            except Stock.DoesNotExist:
                continue
            
            # For beverage items, restore to barman stock
            if item.item_type == 'beverage':
                restore_barman_stock_for_beverage(item, stock, branch, user, instance)
            else:
                # For food items, restore to main stock
                restore_main_stock_for_food(item.product, stock, item.quantity, 'unit')

def restore_barman_stock_for_beverage(item, stock, branch, user, order):
    """
    Restore barman stock when beverage orders are cancelled
    """
    product = item.product
    quantity = item.quantity
    
    # Get barman stocks for this product
    barman_stocks = BarmanStock.objects.select_for_update().filter(
        stock=stock
    ).order_by('unit_type')
    
    # Try to restore to the first available barman stock
    restored = False
    for barman_stock in barman_stocks:
        if barman_stock.unit_type in ['bottle', 'shot', 'unit']:  # Prefer smaller units for restoration
            barman_stock.quantity += quantity
            barman_stock.save()
            restored = True
            
            # Log the restoration
            AuditLog.objects.create(
                product=product,
                action_type='restock',
                quantity=quantity,
                unit_type=barman_stock.unit_type,
                action_by=user,
                branch=branch,
                note=f"Stock restored from cancelled order #{order.order_number}"
            )
            
            print(f"✅ Restored {quantity} {barman_stock.unit_type} to barman stock for {product.name}")
            break
    
    if not restored:
        print(f"⚠️ Could not restore {quantity} units to barman stock for {product.name}")

def restore_main_stock_for_food(product, stock, quantity, unit_type):
    """
    Restore main stock for food items
    """
    try:
        stock_unit = StockUnit.objects.select_for_update().get(
            stock=stock, 
            unit_type=unit_type
        )
        stock_unit.quantity += quantity
        stock_unit.save()
        print(f"✅ Restored {quantity} {unit_type} to main stock for {product.name}")
    except StockUnit.DoesNotExist:
        print(f"⚠️ No stock unit found for {product.name} with unit type {unit_type}")

def reduce_barman_stock_for_beverage(item, stock, branch, user, order):
    """
    Reduce barman stock for beverage items based on unit type used.
    Priority: carton -> bottle -> shot -> unit
    """
    product = item.product
    quantity = item.quantity
    
    # Get all barman stocks for this product in this branch
    barman_stocks = BarmanStock.objects.select_for_update().filter(
        stock=stock
    ).order_by('unit_type')  # Order to prioritize certain unit types
    
    # Define priority order for unit types
    unit_priority = ['carton', 'bottle', 'shot', 'unit', 'litre']
    
    # Sort barman stocks by priority
    sorted_barman_stocks = []
    for priority_unit in unit_priority:
        for barman_stock in barman_stocks:
            if barman_stock.unit_type == priority_unit:
                sorted_barman_stocks.append(barman_stock)
    
    # Try to reduce from barman stock in priority order
    remaining_quantity = quantity
    unit_type_used = None
    
    for barman_stock in sorted_barman_stocks:
        if remaining_quantity <= 0:
            break
            
        if barman_stock.quantity > 0:
            # Calculate how much we can take from this unit type
            quantity_to_take = min(remaining_quantity, barman_stock.quantity)
            
            # Reduce barman stock
            barman_stock.quantity -= quantity_to_take
            barman_stock.save()
            
            # Update remaining quantity
            remaining_quantity -= quantity_to_take
            
            # Set unit type used (use the first unit type we successfully reduced from)
            if unit_type_used is None:
                unit_type_used = barman_stock.unit_type
            
            print(f"✅ Reduced {quantity_to_take} {barman_stock.unit_type} from barman stock for {product.name}")
    
    # If we couldn't reduce all from barman stock, try main stock as fallback
    if remaining_quantity > 0:
        print(f"⚠️ Could not reduce {remaining_quantity} units from barman stock, trying main stock")
        if reduce_main_stock_for_food(product, stock, remaining_quantity, 'unit'):
            # If main stock reduction succeeds, use 'unit' as the unit type
            if unit_type_used is None:
                unit_type_used = 'unit'
        else:
            print(f"🚫 Not enough stock in main inventory either for {product.name}")
            return False
    
    # Update the item's unit_type for logging purposes
    if unit_type_used:
        # We could add a unit_type field to OrderItem if needed for tracking
        pass
    
    return True

def reduce_main_stock_for_food(product, stock, quantity, unit_type):
    """
    Reduce main stock for food items (existing logic)
    """
    deducted = False
    
    # Check if product uses carton system
    if hasattr(product, 'uses_carton') and product.uses_carton:
        if hasattr(stock, 'carton_quantity') and stock.carton_quantity >= quantity:
            stock.carton_quantity -= quantity
            unit_type = 'carton'
            deducted = True
        elif hasattr(stock, 'bottle_quantity') and stock.bottle_quantity >= quantity * getattr(product, 'bottles_per_carton', 1):
            stock.bottle_quantity -= quantity * getattr(product, 'bottles_per_carton', 1)
            unit_type = 'bottle'
            deducted = True
    else:
        # Use StockUnit system
        try:
            stock_unit = StockUnit.objects.select_for_update().get(
                stock=stock, 
                unit_type=unit_type
            )
            if stock_unit.quantity >= quantity:
                stock_unit.quantity -= quantity
                stock_unit.save()
                deducted = True
        except StockUnit.DoesNotExist:
            print(f"⚠️ No stock unit found for {product.name} with unit type {unit_type}")
    
    return deducted
