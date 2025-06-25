from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
        ('not_applicable', 'Not Applicable'),
    ]

    order_number = models.CharField(max_length=255, unique=True)
    table_number = models.IntegerField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_orders')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_orders')
    
    food_status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    drink_status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    
    branch = models.ForeignKey('branches.Branch', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_number

    @property
    def food_items(self):
        return self.items.filter(item_type='food')

    @property
    def drink_items(self):
        return self.items.filter(item_type='drink')

class OrderItem(models.Model):
    ORDER_ITEM_TYPE = [
        ('food', 'Food'),
        ('drink', 'Drink'),
        ('meat', 'Meat'),
    ]
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    item_type = models.CharField(max_length=20, choices=ORDER_ITEM_TYPE)

    def __str__(self):
        return f"{self.name} x {self.quantity}"

