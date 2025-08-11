from orders.models import Order, OrderItem
from django.db import transaction
import json

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
        # Get current order
        current_order = Order.objects.select_related('table').prefetch_related('items').get(id=order_id)
        
        # Get waiter actions
        actions = get_waiter_actions(order_id)
        
        # Check if there was an error getting actions
        if 'error' in actions:
            return {
                'success': False,
                'error': f"Failed to get waiter actions: {actions['error']}"
            }
        
        if not actions['actions']['edit']['enabled']:
            return {
                'success': False,
                'error': f"Edit not allowed: {actions['actions']['edit']['reason']}"
            }
        
        # Check if this is a quantity reduction (not allowed after acceptance)
        if current_order.beverage_status in ['accepted', 'preparing', 'completed']:
            current_items = {item.name: item.quantity for item in current_order.items.all()}
            
            for item in updated_items:
                item_name = item.get('name')
                new_quantity = item.get('quantity', 0)
                current_quantity = current_items.get(item_name, 0)
                
                if new_quantity < current_quantity:
                    return {
                        'success': False,
                        'error': f"Cannot reduce quantity of '{item_name}' from {current_quantity} to {new_quantity} after order acceptance"
                    }
        
        # Ensure product_id is present for new items only
        current_item_names = {item.name for item in current_order.items.all()}
        for item in updated_items:
            item_name = item.get('name')
            # Only check product_id for new items
            if item_name not in current_item_names:
                if not item.get('product_id') and not item.get('product'):
                    return {
                        'success': False,
                        'error': f"Product ID is required for new item '{item_name}'"
                    }
        
        return {
            'success': True,
            'message': 'Order update validation passed'
        }
        
    except Order.DoesNotExist:
        return {
            'success': False,
            'error': f'Order with ID {order_id} not found'
        }
    except Exception as e:
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
        # Validate the update
        validation = validate_order_update(order_id, updated_items, user)
        if not validation['success']:
            return validation
        
        # Get the order
        order = Order.objects.get(id=order_id)
        
        # Get current items for comparison
        current_items = {item.name: item for item in order.items.all()}
        
        # Process updated items
        new_items = []
        updated_existing = []
        
        for item_data in updated_items:
            item_name = item_data.get('name')
            
            if item_name in current_items:
                # Update existing item
                current_item = current_items[item_name]
                new_quantity = item_data.get('quantity', current_item.quantity)
                
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
                # Map menu item types to order item types
                item_type = item_data.get('item_type')
                if item_type == 'food':
                    item_type = 'meat'  # Map 'food' to 'meat'
                # 'beverage' stays as 'beverage'
                
                new_item = OrderItem.objects.create(
                    order=order,
                    name=item_name,
                    quantity=item_data.get('quantity', 1),
                    price=item_data.get('price', 0),
                    item_type=item_type,
                    product_id=item_data.get('product_id') or item_data.get('product'),
                    status='pending'
                )
                new_items.append(new_item)
        
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

