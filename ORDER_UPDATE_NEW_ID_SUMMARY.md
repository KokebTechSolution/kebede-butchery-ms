# Order Update - New Order ID Functionality

## Problem Solved

Previously, when updating an order, the system would modify the existing order in place. This caused issues because:
- The order status would remain as "completed" or "ready"
- Kitchen/bartender staff wouldn't see it as a new order to prepare
- It was confusing to track which items were new vs. existing

## New Solution

**When updating an order, the system now creates a completely NEW order with:**
- ✅ **New Order ID** - Completely different database record
- ✅ **New Order Number** - Sequential numbering (e.g., 20250810-09 → 20250810-10)
- ✅ **Same Table** - Preserves the customer's table assignment
- ✅ **Fresh Status** - Always starts as "pending" for new preparation
- ✅ **New Items** - All items are fresh and ready for preparation

## How It Works

### 1. Order Update Process
```python
# When is_edit=True and original_order_id is provided:
if is_edit and original_order_id:
    # Get the original order
    original_order = Order.objects.get(id=original_order_id)
    
    # Generate NEW order number
    new_order_number = generate_next_order_number()
    
    # Create NEW order with same table but new ID
    updated_order = Order.objects.create(
        order_number=new_order_number,
        table=original_order.table,  # Keep same table
        created_by=user,
        branch=original_order.branch,
        food_status='pending',      # Always fresh
        beverage_status='pending'   # Always fresh
    )
    
    # Add all items to the new order
    for item_data in items_data:
        OrderItem.objects.create(
            order=updated_order,  # New order, not original
            # ... item details
            status='pending'      # All items start pending
        )
```

### 2. Benefits for Staff
- **Bartenders**: See completely new beverage orders to prepare
- **Kitchen Staff**: See completely new food orders to prepare  
- **Waiters**: Can track multiple orders for the same table
- **Management**: Clear separation between original and updated orders

### 3. Order Numbering
- Original Order: `20250810-09`
- Updated Order: `20250810-10`
- Each update gets the next sequential number
- No duplicate order numbers

## Test Results

✅ **Test Passed Successfully**
- Initial Order ID: 48, Order Number: 20250810-09
- Updated Order ID: 49, Order Number: 20250810-10
- IDs are different: True
- Order numbers are different: True
- Same table: True (preserved)
- Both statuses are 'pending': True (fresh preparation)

## Files Modified

### `backend/orders/views.py`
- **Lines 66-120**: Updated `perform_create` method in `OrderListView`
- Changed from modifying existing order to creating new order
- Added proper order number generation for updates
- Ensured table and branch preservation

## API Usage

### Update Order Request
```json
{
  "table": 5,
  "is_edit": true,
  "original_order_id": 48,
  "items": [
    {
      "name": "Updated Beer",
      "quantity": 3,
      "price": 5.00,
      "item_type": "beverage"
    },
    {
      "name": "Updated Pizza", 
      "quantity": 2,
      "price": 15.00,
      "item_type": "food"
    }
  ]
}
```

### Response
- **New Order ID**: 49
- **New Order Number**: 20250810-10
- **Same Table**: 5
- **Status**: Both food and beverage start as "pending"
- **Items**: Fresh items ready for preparation

## Impact

1. **Kitchen Efficiency**: Staff see clear new orders to prepare
2. **Order Tracking**: Better separation between original and updated orders
3. **Customer Experience**: Same table, but fresh preparation cycle
4. **System Clarity**: No confusion about order status or completion

## Next Steps

The system now properly handles order updates by creating new orders with fresh IDs while preserving the customer's table assignment. This ensures that:

- Bartenders receive new beverage orders to prepare
- Kitchen staff receive new food orders to prepare
- Each update is treated as a completely fresh order
- Order history is properly maintained
- No status confusion between original and updated orders

