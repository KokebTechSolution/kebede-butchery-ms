# Inventory Duplication Fix Summary

## Problem
When marking an inventory request as "reached", the stock quantities were being duplicated (e.g., 220 became 268 instead of 218).

## Root Cause
The `InventoryTransaction.save()` method was being called twice for the same transaction:
1. First call: When creating the transaction with `objects.create()`
2. Second call: When saving the transaction again with `quantity_in_base_units` set

This caused stock adjustments to be applied twice, resulting in incorrect stock values.

## Solution

### 1. Fixed InventoryTransaction.save() Method
**File**: `backend/inventory/models.py` (lines 571-630)

**Changes**:
- Added a check to prevent double stock adjustments using `_stock_adjustments_applied` flag
- Only apply stock adjustments once per transaction instance
- Added debug logging to track when adjustments are skipped

**Code**:
```python
# IMPORTANT: Only apply stock adjustments for NEW transactions
if hasattr(self, '_stock_adjustments_applied'):
    print(f"[DEBUG] Stock adjustments already applied for transaction {self.pk}, skipping")
    return
    
# Mark that we've applied stock adjustments for this transaction
self._stock_adjustments_applied = True
```

### 2. Fixed InventoryRequest.save() Method
**File**: `backend/inventory/models.py` (lines 740-760)

**Changes**:
- Set `quantity_in_base_units` directly during transaction creation
- Removed the second `save()` call that was causing double adjustments
- Added better duplicate transaction detection

**Code**:
```python
# Create InventoryTransaction with all values set at once to avoid double save
transaction = InventoryTransaction.objects.create(
    product=self.product,
    transaction_type='store_to_barman',
    quantity=self.quantity,
    transaction_unit=self.request_unit,
    quantity_in_base_units=quantity_in_base_units,  # Set this directly
    from_stock_main=store_stock,
    to_stock_barman=barman_stock,
    initiated_by=self.responded_by,
    notes=f"Fulfilled request #{self.pk} by {self.requested_by.username}.",
    branch=self.branch,
)
```

### 3. Enhanced Duplicate Detection
**File**: `backend/inventory/models.py` (lines 680-700)

**Changes**:
- Added multiple checks for existing transactions
- Check by request ID in notes
- Check by transaction details (product, bartender, quantity, unit)

## Testing Steps

### 1. Reset Current Stock
Run the fix script:
```bash
cd backend
python fix_stock.py
```

### 2. Test the Fix
1. Create a new inventory request for Coca (quantity 2 cartons)
2. Accept it as a manager
3. Mark it as "reached"
4. Verify stock changes from 220 → 218 (correct)
5. Try to mark the same request as "reached" again - should show error

### 3. Expected Behavior
- **First Request**: Stock changes from 220 → 218 (correct)
- **Duplicate Attempt**: Shows error message instead of creating duplicate transaction
- **Stock Accuracy**: No more incorrect values like 268 instead of 220

## Debug Output
The fix includes comprehensive debug logging to track:
- When transactions are created
- When stock adjustments are applied
- When duplicate transactions are detected
- Stock values before and after transactions

## Files Modified
1. `backend/inventory/models.py` - Main fix for transaction and request models
2. `backend/fix_stock.py` - Utility script to reset stock and clean duplicates
3. `backend/INVENTORY_FIX_SUMMARY.md` - This documentation

## Prevention
The fix prevents future duplication by:
- Using instance flags to track applied adjustments
- Setting all transaction values during creation
- Multiple duplicate detection checks
- Comprehensive logging for debugging 