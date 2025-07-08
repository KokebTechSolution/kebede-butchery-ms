# branches/models.py
from django.db import models

class Branch(models.Model):
    name = models.CharField(max_length=100) 
    city = models.CharField(max_length=100, null=True, blank=True)
    subcity = models.CharField(max_length=100, null=True, blank=True)
    wereda = models.CharField(max_length=100, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        parts = [self.name]
        if self.city:
            parts.append(self.city)
        if self.subcity:
            parts.append(self.subcity)
        if self.wereda:
            parts.append(self.wereda)
        return " - ".join(parts)
    def __str__(self):
        return f"{self.name} - {self.location}"

    @property
    def display_name(self):
        return f"{self.name} - {self.location}"
