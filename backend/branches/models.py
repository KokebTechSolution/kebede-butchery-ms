from django.db import models
from django.conf import settings

class Branch(models.Model):
    name = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class Table(models.Model):
    number = models.PositiveIntegerField()
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='tables')
    seats = models.PositiveIntegerField(default=4)
    status = models.CharField(max_length=20, default='available')  # e.g., available, occupied
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_tables'
    )

    class Meta:
        unique_together = ('number', 'created_by')

    def __str__(self):
        return f"Table {self.number} ({self.branch.name})"
