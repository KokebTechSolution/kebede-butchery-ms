from django.db import models

from django.db import models
from django.conf import settings

class InventoryItem(models.Model):
    name = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=0)
    branch = models.ForeignKey('core.Branch', on_delete=models.CASCADE)
    passed_to_bartender = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.quantity})"

class InventoryRequest(models.Model):
    REQUEST_STATUS = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=REQUEST_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request {self.item.name} x {self.quantity} by {self.requested_by.username}"

