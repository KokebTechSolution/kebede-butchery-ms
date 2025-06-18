from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    phone = models.CharField(max_length=20, blank=True)
    branch = models.ForeignKey('core.Branch', on_delete=models.SET_NULL, null=True, blank=True)

    def is_waiter(self):
        return self.groups.filter(name="Waiter").exists()

    def is_bartender(self):
        return self.groups.filter(name="Bartender").exists()

    def is_manager(self):
        return self.groups.filter(name="Manager").exists()

    # You can add more role-checking methods here...
