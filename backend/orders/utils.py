from orders.models import Order, OrderItem
from django.db import transaction
import json
from decimal import Decimal
from orders.models import OrderUpdate

def get_waiter_actions(order_id):
    """
    Determine available waiter actions based on order status and beverage acceptance.
    
    Args:
        order_id (int): The ID of the order to check
        
    Returns:
        dict: JSON object with enabled/disabled actions
    """
    try:
        # Get the order with related items
        order = Order.objects.select_related('table', 'created_by').prefetch_related('items').get(id=order_id)
        
        # Check if order has beverage items
        has_beverages = order.items.filter(item_type='beverage').exists()
        
        # Check if order has food items
        has_food = order.items.filter(item_type='food').exists()
        
        # Get beverage status
        beverage_status = order.beverage_status
        
        # Initialize actions
        actions = {
            'edit': {
                'enabled': False,
                'reason': '',
                'restrictions': []
            },
            'cancel': {
                'enabled': False,
                'reason': '',
                'restrictions': []
            },
            'print_bill': {
                'enabled': False,
                'reason': '',
                'restrictions': []
            },
            'add_items': {
                'enabled': False,
                'reason': '',
                'restrictions': []
            }
        }
        
        # Rule 1: If order contains beverages, it must be sent to bartender for acceptance
        if has_beverages and beverage_status == 'pending':
            actions['edit']['enabled'] = True
            actions['edit']['reason'] = 'Order pending bartender acceptance - can edit freely'
            actions['cancel']['enabled'] = True
            actions['cancel']['reason'] = 'Order pending bartender acceptance - can cancel freely'
            actions['print_bill']['enabled'] = False
            actions['print_bill']['reason'] = 'Cannot print bill before order is accepted'
            actions['add_items']['enabled'] = True
            actions['add_items']['reason'] = 'Can add items before acceptance'
            
        # Rule 2: Before order is accepted by bartender, waiter can freely edit or cancel
        elif has_beverages and beverage_status == 'not_applicable':
            actions['edit']['enabled'] = True
            actions['edit']['reason'] = 'No beverages in order - can edit freely'
            actions['cancel']['enabled'] = True
            actions['cancel']['reason'] = 'No beverages in order - can cancel freely'
            actions['print_bill']['enabled'] = False
            actions['print_bill']['reason'] = 'Cannot print bill before order is accepted'
            actions['add_items']['enabled'] = True
            actions['add_items']['reason'] = 'Can add items before acceptance'
            
        # Rule 3 & 4: After beverage order is accepted by bartender
        elif has_beverages and beverage_status in ['accepted', 'preparing', 'completed']:
            actions['edit']['enabled'] = True
            actions['edit']['reason'] = 'Order accepted - can only increase quantities or add new items'
            actions['edit']['restrictions'] = [
                'Cannot reduce quantity of existing items',
                'Cannot remove existing items',
                'Can only increase quantities or add new items'
            ]
            actions['cancel']['enabled'] = False
            actions['cancel']['reason'] = 'Cannot cancel order after bartender acceptance'
            actions['print_bill']['enabled'] = True
            actions['print_bill']['reason'] = 'Order accepted - can print bill'
            actions['add_items']['enabled'] = True
            actions['add_items']['reason'] = 'Can add new items after acceptance'
            
        # Rule 5: Food-only orders
        elif has_food and not has_beverages:
            # Check food status for food-only orders
            food_status = order.food_status
            if food_status == 'pending':
                actions['edit']['enabled'] = True
                actions['edit']['reason'] = 'Food order pending - can edit freely'
                actions['cancel']['enabled'] = True
                actions['cancel']['reason'] = 'Food order pending - can cancel freely'
                actions['print_bill']['enabled'] = False
                actions['print_bill']['reason'] = 'Cannot print bill before food is accepted'
                actions['add_items']['enabled'] = True
                actions['add_items']['reason'] = 'Can add items before acceptance'
            elif food_status in ['accepted', 'preparing', 'completed']:
                actions['edit']['enabled'] = True
                actions['edit']['reason'] = 'Food order accepted - can only increase quantities or add new items'
                actions['edit']['restrictions'] = [
                    'Cannot reduce quantity of existing items',
                    'Cannot remove existing items',
                    'Can only increase quantities or add new items'
                ]
                actions['cancel']['enabled'] = False
                actions['cancel']['reason'] = 'Cannot cancel order after food acceptance'
                actions['print_bill']['enabled'] = True
                actions['print_bill']['reason'] = 'Food order accepted - can print bill'
                actions['add_items']['enabled'] = True
                actions['add_items']['reason'] = 'Can add new items after acceptance'
                
        # Rule 6: Printed orders
        if order.cashier_status == 'printed':
            actions['edit']['enabled'] = False
            actions['edit']['reason'] = 'Order already printed - cannot edit'
            actions['cancel']['enabled'] = False
            actions['cancel']['reason'] = 'Order already printed - cannot cancel'
            actions['print_bill']['enabled'] = False
            actions['print_bill']['reason'] = 'Order already printed'
            actions['add_items']['enabled'] = False
            actions['add_items']['reason'] = 'Order already printed - cannot add items'
            
        # Additional context
        context = {
            'order_id': order_id,
            'order_number': order.order_number,
            'table_number': order.table.number if order.table else None,
            'has_beverages': has_beverages,
            'has_food': has_food,
            'beverage_status': beverage_status,
            'food_status': order.food_status,
            'cashier_status': order.cashier_status,
            'total_money': float(order.total_money) if order.total_money else 0,
            'items_count': order.items.count(),
            'actions': actions
        }
        
        return context
        
    except Order.DoesNotExist:
        return {
            'error': f'Order with ID {order_id} not found',
            'actions': {
                'edit': {'enabled': False, 'reason': 'Order not found'},
                'cancel': {'enabled': False, 'reason': 'Order not found'},
                'print_bill': {'enabled': False, 'reason': 'Order not found'},
                'add_items': {'enabled': False, 'reason': 'Order not found'}
            }
        }
    except Exception as e:
        return {
            'error': f'Error processing order {order_id}: {str(e)}',
            'actions': {
                'edit': {'enabled': False, 'reason': 'System error'},
                'cancel': {'enabled': False, 'reason': 'System error'},
                'print_bill': {'enabled': False, 'reason': 'System error'},
                'add_items': {'enabled': False, 'reason': 'System error'}
            }
        }


def validate_order_update(order_id, updated_items, user):
    """
    Validate if the order update is allowed based on waiter action rules.
    
    Args:
        order_id (int): The ID of the order to update
        updated_items (list): List of items to update/add
        user: The user making the update
        
    Returns:
        dict: Validation result with success/error status and message
    """
    try:
        print(f"[DEBUG] validate_order_update - Starting validation for order {order_id}")
        print(f"[DEBUG] validate_order_update - Updated items: {updated_items}")
        print(f"[DEBUG] validate_order_update - User: {user.username if user else 'None'}")
        
        # Get current order
        current_order = Order.objects.select_related('table').prefetch_related('items').get(id=order_id)
        print(f"[DEBUG] validate_order_update - Found order: {current_order.order_number}")
        
        # Get waiter actions
        actions = get_waiter_actions(order_id)
        print(f"[DEBUG] validate_order_update - Waiter actions: {actions}")
        
        # Check if there was an error getting actions
        if 'error' in actions:
            print(f"[DEBUG] validate_order_update - Error getting actions: {actions['error']}")
            return {
                'success': False,
                'error': f"Failed to get waiter actions: {actions['error']}"
            }
        
        if not actions['actions']['edit']['enabled']:
            print(f"[DEBUG] validate_order_update - Edit not allowed: {actions['actions']['edit']['reason']}")
            return {
                'success': False,
                'error': f"Edit not allowed: {actions['actions']['edit']['reason']}"
            }
        
        print(f"[DEBUG] validate_order_update - Edit is allowed")
        
        # Check if this is a quantity reduction (not allowed after acceptance)
        if current_order.beverage_status in ['accepted', 'preparing', 'completed']:
            current_items = {item.name: item.quantity for item in current_order.items.all()}
            
            for item in updated_items:
                item_name = item.get('name')
                new_quantity = item.get('quantity', 0)
                current_quantity = current_items.get(item_name, 0)
                
                if new_quantity < current_quantity:
                    print(f"[DEBUG] validate_order_update - Quantity reduction not allowed: {item_name} {current_quantity} -> {new_quantity}")
                    return {
                        'success': False,
                        'error': f"Cannot reduce quantity of '{item_name}' from {current_quantity} to {new_quantity} after order acceptance"
                    }
        
        # Ensure product_id is present for new items only (but be flexible for food items)
        current_item_names = {item.name for item in current_order.items.all()}
        print(f"[DEBUG] validate_order_update - Current item names: {current_item_names}")
        
        for item in updated_items:
            item_name = item.get('name')
            item_type = item.get('item_type', 'food')
            
            print(f"[DEBUG] validate_order_update - Validating item: {item_name} (type: {item_type})")
            
            # Only check product_id for new items
            if item_name not in current_item_names:
                print(f"[DEBUG] validate_order_update - {item_name} is a new item")
                
                # For food items, product_id is optional
                if item_type == 'food':
                    # Food items don't require product_id
                    print(f"[DEBUG] validate_order_update - {item_name} is food item, product_id not required")
                    continue
                elif item_type == 'beverage':
                    # Beverage items require product_id for inventory tracking
                    product_id = item.get('product_id') or item.get('product')
                    print(f"[DEBUG] validate_order_update - {item_name} is beverage item, product_id: {product_id}")
                    if not product_id:
                        print(f"[DEBUG] validate_order_update - {item_name} missing product_id")
                        return {
                            'success': False,
                            'error': f"Product ID is required for beverage item '{item_name}'"
                        }
                else:
                    # For other item types, require product_id
                    product_id = item.get('product_id') or item.get('product')
                    print(f"[DEBUG] validate_order_update - {item_name} is {item_type} item, product_id: {product_id}")
                    if not product_id:
                        print(f"[DEBUG] validate_order_update - {item_name} missing product_id")
                        return {
                            'success': False,
                            'error': f"Product ID is required for new item '{item_name}'"
                        }
            else:
                print(f"[DEBUG] validate_order_update - {item_name} is existing item, no validation needed")
        
        print(f"[DEBUG] validate_order_update - All validations passed")
        return {
            'success': True,
            'message': 'Order update validation passed'
        }
        
    except Order.DoesNotExist:
        print(f"[DEBUG] validate_order_update - Order {order_id} not found")
        return {
            'success': False,
            'error': f'Order with ID {order_id} not found'
        }
    except Exception as e:
        print(f"[DEBUG] validate_order_update - Exception: {str(e)}")
        return {
            'success': False,
            'error': f'Validation error: {str(e)}'
        }


@transaction.atomic
def update_order_with_validation(order_id, updated_items, user):
    """
    Update order with proper validation and workflow logic.
    
    Args:
        order_id (int): The ID of the order to update
        updated_items (list): List of items to update/add
        user: The user making the update
        
    Returns:
        dict: Update result with success/error status and updated order data
    """
    try:
        print(f"[DEBUG] update_order_with_validation - Starting update for order {order_id}")
        print(f"[DEBUG] update_order_with_validation - Updated items: {updated_items}")
        print(f"[DEBUG] update_order_with_validation - User: {user.username if user else 'None'}")
        
        # Validate the update
        validation = validate_order_update(order_id, updated_items, user)
        if not validation['success']:
            print(f"[DEBUG] update_order_with_validation - Validation failed: {validation['error']}")
            return validation
        
        print(f"[DEBUG] update_order_with_validation - Validation passed")
        
        # Get the order
        order = Order.objects.get(id=order_id)
        print(f"[DEBUG] update_order_with_validation - Found order: {order.order_number}")
        
        # Get current items for comparison
        current_items = {item.name: item for item in order.items.all()}
        print(f"[DEBUG] update_order_with_validation - Current items: {list(current_items.keys())}")
        
        # Process updated items
        new_items = []
        updated_existing = []
        
        for item_data in updated_items:
            item_name = item_data.get('name')
            print(f"[DEBUG] update_order_with_validation - Processing item: {item_name}")
            
            if item_name in current_items:
                # Update existing item
                current_item = current_items[item_name]
                new_quantity = item_data.get('quantity', current_item.quantity)
                
                print(f"[DEBUG] update_order_with_validation - Updating existing item {item_name}: quantity {current_item.quantity} -> {new_quantity}")
                
                # Check if quantity is being reduced (not allowed after acceptance)
                if order.beverage_status in ['accepted', 'preparing', 'completed'] and new_quantity < current_item.quantity:
                    return {
                        'success': False,
                        'error': f"Cannot reduce quantity of '{item_name}' from {current_item.quantity} to {new_quantity}"
                    }
                
                current_item.quantity = new_quantity
                current_item.price = item_data.get('price', current_item.price)
                current_item.save()
                updated_existing.append(current_item)
                
            else:
                # Add new item
                print(f"[DEBUG] update_order_with_validation - Creating new item: {item_name}")
                print(f"[DEBUG] update_order_with_validation - Item data: {item_data}")
                
                try:
                    new_item = OrderItem.objects.create(
                        order=order,
                        name=item_name,
                        quantity=item_data.get('quantity', 1),
                        price=item_data.get('price', 0),
                        item_type=item_data.get('item_type'),
                        product_id=item_data.get('product_id') or item_data.get('product'),
                        status='pending'
                    )
                    new_items.append(new_item)
                    print(f"[DEBUG] update_order_with_validation - Successfully created new item: {new_item.id}")
                except Exception as e:
                    print(f"[ERROR] update_order_with_validation - Failed to create item {item_name}: {str(e)}")
                    raise
        
        # Update order total - include all items regardless of status for updates
        total = 0
        for item in order.items.all():
            # For updates, include all items in the total calculation
            total += float(item.price) * item.quantity
        
        order.total_money = total
        order.save()
        
        # Recalculate order status based on current item statuses
        if new_items or updated_existing:
            # Recalculate beverage status
            new_beverage_status = order.calculate_beverage_status()
            if new_beverage_status != order.beverage_status:
                print(f"[DEBUG] Updating beverage_status from '{order.beverage_status}' to '{new_beverage_status}'")
                order.beverage_status = new_beverage_status
            
            # Recalculate food status
            new_food_status = order.calculate_food_status()
            if new_food_status != order.food_status:
                print(f"[DEBUG] Updating food_status from '{order.food_status}' to '{new_food_status}'")
                order.food_status = new_food_status
            
            order.save()
        
        return {
            'success': True,
            'message': f'Order updated successfully. {len(updated_existing)} items updated, {len(new_items)} new items added.',
            'order_id': order_id,
            'updated_items': updated_existing,
            'new_items': new_items,
            'total_money': float(total)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Update failed: {str(e)}'
        }


@transaction.atomic
def edit_order(order_id, new_items, user=None):
    """
    Edit an existing order by adding new items while preserving accepted items.
    
    This function follows a specific process:
    1. Transaction Safety: All operations are atomic
    2. Fetch Order: Retrieve order by order_id
    3. Separate Items: Split into accepted (keep) and pending (remove) groups
    4. Log Edit Request: Insert record into orders_orderupdate table
    5. Remove Old Pending Items: Delete pending items
    6. Add New Items: Create new OrderItem records with 'pending' status
    7. Update Main Order: Reset statuses and recalculate total
    8. Commit Transaction: All changes are committed together
    
    Args:
        order_id (int): The ID of the order to edit
        new_items (list): List of new items to add to the order
        user: The user making the edit (optional)
        
    Returns:
        dict: Result with success/error status and updated order data
    """
    try:
        # Step 1: Fetch Order
        try:
            order = Order.objects.select_related('table', 'branch').prefetch_related('items').get(id=order_id)
        except Order.DoesNotExist:
            return {
                'success': False,
                'error': f'Order with ID {order_id} not found'
            }
        
        # Step 2: Separate Items into accepted and pending groups
        accepted_items = []
        pending_items = []
        
        for item in order.items.all():
            if item.status == 'accepted':
                accepted_items.append(item)
            elif item.status == 'pending':
                pending_items.append(item)
        
        print(f"[DEBUG] edit_order - Order {order_id}: {len(accepted_items)} accepted items, {len(pending_items)} pending items")
        
        # Step 3: Log the Edit Request
        # Calculate total addition cost
        total_addition_cost = Decimal('0.00')
        for item in new_items:
            try:
                price = Decimal(str(item.get('price', 0)))
                quantity = int(item.get('quantity', 1))
                total_addition_cost += price * quantity
            except (ValueError, TypeError):
                # Skip invalid items
                continue
        
        # Determine update type
        update_type = 'edit' if pending_items else 'add_items'
        
        # Convert new_items to JSON-serializable format
        serializable_new_items = []
        for item in new_items:
            try:
                serializable_item = {
                    'name': item.get('name', 'Unknown Item'),
                    'quantity': int(item.get('quantity', 1)),
                    'price': float(item.get('price', 0)),
                    'item_type': item.get('item_type', 'food'),
                    'product_id': item.get('product_id')
                }
                serializable_new_items.append(serializable_item)
            except (ValueError, TypeError):
                # Skip invalid items
                continue
        
        # Check if we have any valid items
        if not serializable_new_items:
            return {
                'success': False,
                'error': 'No valid items provided for order update'
            }
        
        # Create OrderUpdate record
        order_update = OrderUpdate.objects.create(
            original_order=order,
            update_type=update_type,
            status='pending',
            items_changes={
                'items': serializable_new_items,
                'removed_pending_items': [
                    {
                        'id': item.id,
                        'name': item.name,
                        'quantity': item.quantity,
                        'price': float(item.price),
                        'item_type': item.item_type
                    } for item in pending_items
                ],
                'accepted_items_preserved': [
                    {
                        'id': item.id,
                        'name': item.name,
                        'quantity': item.quantity,
                        'price': float(item.price),
                        'item_type': item.item_type
                    } for item in accepted_items
                ]
            },
            total_addition_cost=total_addition_cost,
            created_by=user
        )
        
        print(f"[DEBUG] edit_order - Created OrderUpdate record {order_update.id} with type '{update_type}'")
        
        # Step 4: Remove Old Pending Items
        if pending_items:
            pending_item_ids = [item.id for item in pending_items]
            deleted_count = OrderItem.objects.filter(id__in=pending_item_ids).delete()[0]
            print(f"[DEBUG] edit_order - Deleted {deleted_count} pending items")
        
        # Step 5: Add New Items
        new_order_items = []
        for item_data in new_items:
            try:
                new_item = OrderItem.objects.create(
                    order=order,
                    name=item_data.get('name', 'Unknown Item'),
                    quantity=int(item_data.get('quantity', 1)),
                    price=Decimal(str(item_data.get('price', 0))),
                    item_type=item_data.get('item_type', 'food'),
                    status='pending',
                    product_id=item_data.get('product_id')
                )
                new_order_items.append(new_item)
                print(f"[DEBUG] edit_order - Created new item: {new_item.name} x {new_item.quantity}")
            except (ValueError, TypeError) as e:
                print(f"[ERROR] edit_order - Invalid item data: {item_data}, error: {e}")
                continue
        
        # Step 6: Update Main Order
        # Reset statuses to 'pending' if new items were added
        has_new_food = any(item.item_type == 'food' for item in new_order_items)
        has_new_beverage = any(item.item_type == 'beverage' for item in new_order_items)
        
        if has_new_food:
            order.food_status = 'pending'
            print(f"[DEBUG] edit_order - Reset food_status to 'pending'")
        
        if has_new_beverage:
            order.beverage_status = 'pending'
            print(f"[DEBUG] edit_order - Reset beverage_status to 'pending'")
        
        # Recalculate total_money as sum of all accepted + pending items
        total_money = sum(
            item.price * item.quantity 
            for item in accepted_items + new_order_items
        )
        order.total_money = total_money
        
        # Save the updated order
        order.save()
        
        print(f"[DEBUG] edit_order - Updated order total_money to {total_money}")
        
        # Step 7: Commit Transaction (handled by @transaction.atomic decorator)
        
        # Return success response with updated order data
        return {
            'success': True,
            'message': f'Order {order_id} updated successfully',
            'order_id': order_id,
            'order_update_id': order_update.id,
            'update_type': update_type,
            'accepted_items_preserved': len(accepted_items),
            'pending_items_removed': len(pending_items),
            'new_items_added': len(new_order_items),
            'total_addition_cost': float(total_addition_cost),
            'new_total_money': float(total_money),
            'order_update_status': 'pending'
        }
        
    except Exception as e:
        # Transaction will automatically rollback due to @transaction.atomic
        print(f"[ERROR] edit_order - Failed to edit order {order_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'success': False,
            'error': f'Failed to edit order: {str(e)}'
        }


def check_order_update_completion(order_update_id):
    """
    Check if all items in an order update have been accepted.
    If so, mark the order update as 'accepted'.
    
    Args:
        order_update_id (int): The ID of the OrderUpdate record
        
    Returns:
        bool: True if update was marked as accepted, False otherwise
    """
    try:
        order_update = OrderUpdate.objects.get(id=order_update_id)
        
        if order_update.status != 'pending':
            return False  # Already processed
        
        # Get the original order
        order = order_update.original_order
        
        # Get all items that were part of this update
        update_items = order_update.items_changes.get('items', [])
        update_item_names = {item['name'] for item in update_items}
        
        # Check if all new items from this update are accepted
        new_items = order.items.filter(
            name__in=update_item_names,
            status='pending'
        )
        
        if new_items.exists():
            # Still have pending items
            return False
        
        # All items are accepted, mark the update as accepted
        order_update.status = 'accepted'
        order_update.save()
        
        print(f"[DEBUG] check_order_update_completion - OrderUpdate {order_update_id} marked as accepted")
        return True
        
    except OrderUpdate.DoesNotExist:
        print(f"[ERROR] check_order_update_completion - OrderUpdate {order_update_id} not found")
        return False
    except Exception as e:
        print(f"[ERROR] check_order_update_completion - Error: {str(e)}")
        return False


def get_order_display_items(order_id):
    """
    Get all items for an order display, combining originally accepted items
    and newly accepted items from order updates.
    
    Args:
        order_id (int): The ID of the order
        
    Returns:
        dict: Order display data with items and metadata
    """
    try:
        order = Order.objects.prefetch_related('items').get(id=order_id)
        
        # Get all items for the order
        all_items = order.items.all()
        
        # Separate items by status
        accepted_items = [item for item in all_items if item.status == 'accepted']
        pending_items = [item for item in all_items if item.status == 'pending']
        
        # Get order updates for this order
        order_updates = OrderUpdate.objects.filter(
            original_order=order,
            status__in=['pending', 'accepted']
        ).order_by('created_at')
        
        return {
            'order_id': order_id,
            'order_number': order.order_number,
            'table': order.table.number if order.table else None,
            'total_money': float(order.total_money) if order.total_money else 0,
            'food_status': order.food_status,
            'beverage_status': order.beverage_status,
            'cashier_status': order.cashier_status,
            'items': {
                'accepted': [
                    {
                        'id': item.id,
                        'name': item.name,
                        'quantity': item.quantity,
                        'price': float(item.price),
                        'item_type': item.item_type,
                        'status': item.status
                    } for item in accepted_items
                ],
                'pending': [
                    {
                        'id': item.id,
                        'name': item.name,
                        'quantity': item.quantity,
                        'price': float(item.price),
                        'item_type': item.item_type,
                        'status': item.status
                    } for item in pending_items
                ]
            },
            'order_updates': [
                {
                    'id': update.id,
                    'update_type': update.update_type,
                    'status': update.status,
                    'created_at': update.created_at.isoformat(),
                    'total_addition_cost': float(update.total_addition_cost),
                    'items_changes': update.items_changes
                } for update in order_updates
            ],
            'total_items_count': len(all_items),
            'accepted_items_count': len(accepted_items),
            'pending_items_count': len(pending_items)
        }
        
    except Order.DoesNotExist:
        return {
            'success': False,
            'error': f'Order {order_id} not found'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Error getting order display: {str(e)}'
        }

