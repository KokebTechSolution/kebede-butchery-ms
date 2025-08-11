from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from inventory.models import Product  
class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
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

    def __str__(self):
        return self.order_number

    @property
    def food_items(self):
        return self.items.filter(item_type__in=['food', 'meat'])

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

