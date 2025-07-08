<<<<<<< HEAD
# branches/models.py
=======
>>>>>>> b8091a2069fb7237cfe0af3fe8ea54b747de83f7
from django.db import models

class Branch(models.Model):
    name = models.CharField(max_length=100) 
    city = models.CharField(max_length=100, null=True, blank=True)
    subcity = models.CharField(max_length=100, null=True, blank=True)
    wereda = models.CharField(max_length=100, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
<<<<<<< HEAD
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
=======
        return self.name

class Table(models.Model):
    number = models.PositiveIntegerField()
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='tables')
    seats = models.PositiveIntegerField(default=4)
    status = models.CharField(max_length=20, default='available')  # e.g., available, occupied

    class Meta:
        unique_together = ('number', 'branch')

    def __str__(self):
        return f"Table {self.number} ({self.branch.name})"
>>>>>>> b8091a2069fb7237cfe0af3fe8ea54b747de83f7
