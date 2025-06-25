from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class Order(models.Model):
    ORDER_STATUS = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('served', 'Served'),
        ('cancelled', 'Cancelled'),
    ]
    order_number = models.CharField(max_length=20, unique=True, editable=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='orders', on_delete=models.SET_NULL, null=True, blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='assigned_orders', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='pending')
    table_number = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    branch = models.ForeignKey('branches.Branch', on_delete=models.CASCADE)

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

