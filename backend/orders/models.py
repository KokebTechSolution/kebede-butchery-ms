from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from inventory.models import Product  
from django.utils import timezone
from decimal import Decimal

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('not_applicable', 'Not Applicable'),
    ]
    order_number = models.CharField(max_length=255, unique=True)
    table = models.ForeignKey('branches.Table', on_delete=models.CASCADE, null=True, blank=True, related_name='orders')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_orders')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_orders')
    
    food_status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    beverage_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    branch = models.ForeignKey('branches.Branch', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    total_money = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    waiter_notified_beverage = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending', null=True, blank=True)
    cashier_status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('printed', 'Printed')],
        default='pending'
    )
    payment_option = models.CharField(
        max_length=20,
        choices=[('cash', 'Cash'), ('online', 'Online')],
        null=True, blank=True
    )
    receipt_image = models.ImageField(
        upload_to='receipts/',
        null=True,
        blank=True,
        help_text='Payment receipt image for online payments'
    )

    def __str__(self):
        return self.order_number

    @property
    def food_items(self):
        return self.items.filter(item_type='food')

    @property
    def beverage_items(self):
        return self.items.filter(item_type='beverage')

    def all_items_completed(self):
        return all(item.status == 'accepted' for item in self.items.all())
    
    def has_pending_beverage_items(self):
        """Check if there are any pending beverage items that need approval"""
        return self.beverage_items.filter(status='pending').exists()
    
    def has_pending_food_items(self):
        """Check if there are any pending food items that need approval"""
        return self.food_items.filter(status='pending').exists()
    
    def calculate_beverage_status(self):
        """Calculate beverage status based on item statuses"""
        beverage_items = self.beverage_items
        if not beverage_items.exists():
            return 'not_applicable'
        
        if beverage_items.filter(status='pending').exists():
            return 'pending'
        elif beverage_items.filter(status='rejected').exists():
            return 'rejected'
        elif beverage_items.filter(status='accepted').exists():
            if beverage_items.filter(status='accepted').count() == beverage_items.count():
                return 'completed'
            else:
                return 'pending'
        else:
            return 'pending'
    
    def calculate_food_status(self):
        """Calculate food status based on item statuses"""
        food_items = self.food_items
        if not food_items.exists():
            return 'not_applicable'
        
        if food_items.filter(status='pending').exists():
            return 'pending'
        elif food_items.filter(status='rejected').exists():
            return 'rejected'
        elif food_items.filter(status='accepted').exists():
            if food_items.filter(status='accepted').count() == food_items.count():
                return 'completed'
            else:
                return 'pending'
        else:
            return 'pending'

    def get_total_amount(self):
        return sum(item.price * item.quantity for item in self.items.all())
    
    def recalculate_total(self):
        """Recalculate the total amount based on current items"""
        total = sum(item.price * item.quantity for item in self.items.all())
        self.total_money = total
        self.save()
        return total

class OrderItem(models.Model):
    ORDER_ITEM_TYPE = [
        ('food', 'Food'),
        ('beverage', 'beverage'),
        ('meat', 'Meat'),
    ]
    ITEM_STATUS = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    item_type = models.CharField(max_length=20, choices=ORDER_ITEM_TYPE)
    status = models.CharField(max_length=20, choices=ITEM_STATUS, default='pending')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    def __str__(self):
        return f"{self.name} x {self.quantity}"


class OrderUpdate(models.Model):
    UPDATE_TYPES = [
        ('addition', 'Item Addition'),
        ('modification', 'Item Modification'),
        ('removal', 'Item Removal'),
        ('quantity_change', 'Quantity Change'),
        ('status_change', 'Status Change'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    
    # Link to the original order
    original_order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='updates')
    
    # Update details
    update_type = models.CharField(max_length=20, choices=UPDATE_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Items being modified (JSON field to store the changes)
    items_changes = models.JSONField(default=dict, help_text="JSON containing the items being added/modified/removed")
    
    # Metadata
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='order_updates_created')
    processed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='order_updates_processed')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(auto_now_add=False, null=True, blank=True)
    
    # Notes and reasons
    notes = models.TextField(blank=True, help_text="Additional notes about this update")
    rejection_reason = models.TextField(blank=True, help_text="Reason for rejection if applicable")
    
    # Financial tracking
    total_addition_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Order Update'
        verbose_name_plural = 'Order Updates'
    
    def __str__(self):
        return f"Update {self.id} for Order {self.original_order.id} - {self.get_update_type_display()}"
    
    def get_total_cost(self):
        """Calculate total cost of the update"""
        if self.update_type == 'addition':
            return self.total_addition_cost
        elif self.update_type == 'modification':
            # Calculate cost difference
            return self.total_addition_cost
        return Decimal('0.00')
    
    def is_pending(self):
        return self.status == 'pending'
    
    def can_be_processed(self):
        return self.status == 'pending'
    
    def mark_accepted(self, processed_by_user, notes=""):
        self.status = 'accepted'
        self.processed_by = processed_by_user
        self.processed_at = timezone.now()
        self.notes = notes
        self.save()
        
        # Apply the update to the original order
        self.apply_to_original_order()
    
    def mark_rejected(self, processed_by_user, reason=""):
        self.status = 'rejected'
        self.processed_by = processed_by_user
        self.processed_at = timezone.now()
        self.rejection_reason = reason
        self.save()
    
    def apply_to_original_order(self):
        """Apply the accepted update to the original order"""
        if self.status != 'accepted':
            return
        
        original_order = self.original_order
        
        if self.update_type == 'addition':
            # Add new items to the original order
            new_items = self.items_changes.get('items', [])
            for item_data in new_items:
                try:
                    # Create new order item with proper type conversion
                    OrderItem.objects.create(
                        order=original_order,
                        name=item_data['name'],
                        quantity=int(item_data['quantity']),
                        price=Decimal(str(item_data['price'])),
                        item_type=item_data.get('item_type', 'food'),
                        status='pending'
                    )
                except (ValueError, TypeError, KeyError) as e:
                    # Skip invalid items
                    print(f"Warning: Skipping invalid item in order update: {item_data}, error: {e}")
                    continue
            
            # Update order total
            original_order.total_money += self.total_addition_cost
            original_order.save()
            
        elif self.update_type == 'modification':
            # Modify existing items
            modifications = self.items_changes.get('modifications', [])
            for mod in modifications:
                try:
                    item = OrderItem.objects.get(id=mod['item_id'], order=original_order)
                    if 'quantity' in mod:
                        item.quantity = int(mod['quantity'])
                    if 'price' in mod:
                        item.price = Decimal(str(mod['price']))
                    if 'status' in mod:
                        item.status = mod['status']
                    item.save()
                except (OrderItem.DoesNotExist, ValueError, TypeError) as e:
                    print(f"Warning: Failed to modify item {mod.get('item_id')}: {e}")
                    pass  # Item might have been deleted or has invalid data
        
        elif self.update_type == 'removal':
            # Remove items from order
            removals = self.items_changes.get('removals', [])
            for removal in removals:
                try:
                    item = OrderItem.objects.get(id=removal['item_id'], order=original_order)
                    item.delete()
                except OrderItem.DoesNotExist:
                    pass
        
        # Recalculate order total
        original_order.recalculate_total()
        original_order.save()
    
    def recalculate_total(self):
        """Recalculate the total cost of this update"""
        if self.update_type == 'addition':
            items = self.items_changes.get('items', [])
            total = Decimal('0.00')
            for item in items:
                try:
                    price = Decimal(str(item['price']))
                    quantity = int(item['quantity'])
                    total += price * quantity
                except (ValueError, TypeError, KeyError):
                    # Skip invalid items
                    continue
            self.total_addition_cost = total
            self.save()

