from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [
        ('waiter', 'Waiter'),
        ('bartender', 'Bartender'),
        ('meat', 'Meat Counter'),
        ('cashier', 'Cashier'),
        ('manager', 'Branch Manager'),
        ('owner', 'Owner'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    branch = models.ForeignKey('branches.Branch', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
