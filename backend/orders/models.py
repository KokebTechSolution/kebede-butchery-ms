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
        return self.items.filter(item_type='food')

    @property
    def beverage_items(self):
        return self.items.filter(item_type='beverage')

    def all_items_completed(self):
        return all(item.status == 'accepted' for item in self.items.all())

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
    UNIT_TYPES = [
        ('carton', 'Carton'),
        ('bottle', 'Bottle'),
        ('litre', 'Litre'),
        ('unit', 'Unit'),
        ('shot', 'Shot'),
    ]
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    item_type = models.CharField(max_length=20, choices=ORDER_ITEM_TYPE)
    unit_type = models.CharField(max_length=20, choices=UNIT_TYPES, default='unit')
    status = models.CharField(max_length=20, choices=ITEM_STATUS, default='pending')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"{self.name} x {self.quantity} {self.unit_type}"

