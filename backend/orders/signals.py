from django.db.models.signals import post_save
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
            print(f"[DEBUG] Order signal - Product: {product.name}, Order quantity: {quantity}, Uses carton: {hasattr(product, 'uses_carton') and product.uses_carton}")
            print(f"[DEBUG] Order signal - Stock calculated_base_units: {stock.calculated_base_units}, Stock input_quantity: {stock.input_quantity}")
            
            if hasattr(product, 'uses_carton') and product.uses_carton:
                # For carton-based products, check if we have enough in cartons
                bottles_per_carton = getattr(product, 'bottles_per_carton', 1)
                print(f"[DEBUG] Order signal - Bottles per carton: {bottles_per_carton}")
                
                if hasattr(stock, 'carton_quantity') and stock.carton_quantity >= quantity:
                    stock.carton_quantity -= quantity
                    deducted = True
                    quantity_in_base_units = quantity * bottles_per_carton
                    print(f"[DEBUG] Order signal - Deducted from carton_quantity: {quantity} cartons = {quantity_in_base_units} bottles")
                elif stock.calculated_base_units >= quantity * bottles_per_carton:
                    # Calculate quantity in base units
                    quantity_in_base_units = quantity * bottles_per_carton
                    deducted = True
                    print(f"[DEBUG] Order signal - Deducted from calculated_base_units: {quantity} cartons = {quantity_in_base_units} bottles")
                else:
                    print(f"[DEBUG] Order signal - Not enough stock: {stock.calculated_base_units} < {quantity * bottles_per_carton}")
            else:
                # For non-carton products, check base units directly
                if stock.calculated_base_units >= quantity:
                    quantity_in_base_units = quantity
                    deducted = True
                    print(f"[DEBUG] Order signal - Deducted from calculated_base_units: {quantity} units")
                else:
                    print(f"[DEBUG] Order signal - Not enough stock: {stock.calculated_base_units} < {quantity}")
            
            print(f"[DEBUG] Order signal - Final deducted: {deducted}, quantity_in_base_units: {quantity_in_base_units}")

            if deducted:
                # Create InventoryTransaction to handle stock adjustment properly
                transaction = InventoryTransaction.objects.create(
                    product=product,
                    transaction_type='sale',
                    quantity=quantity,
                    transaction_unit=transaction_unit,
                    from_stock_main=stock,
                    initiated_by=user,
                    branch=branch,
                    notes=f"Sale from order #{instance.order_number}"
                )
                
                # Set the quantity_in_base_units directly to avoid double calculation
                transaction.quantity_in_base_units = -quantity_in_base_units  # Negative for sales
                transaction._skip_quantity_calculation = True
                transaction.save(skip_stock_adjustment=False)  # Let it handle stock adjustment

                # Log Audit
                AuditLog.objects.create(
                    user=user,
                    action='sale',
                    object_id=product.id,
                    content_type_id=ContentType.objects.get_for_model(product).id,
                    details={
                        'product_name': product.name,
                        'quantity': str(quantity),
                        'transaction_unit_name': transaction_unit.unit_name,
                        'order_number': instance.order_number,
                        'branch_name': branch.name
                    },
                    notes=f"Sale from order #{instance.order_number}"
                )
            else:
                print(f"🚫 Not enough stock for product: {product.name} at branch {branch.name}")
