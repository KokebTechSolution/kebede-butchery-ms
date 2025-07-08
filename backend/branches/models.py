from django.db import models

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

    class Meta:
        unique_together = ('number', 'branch')

    def __str__(self):
        return f"Table {self.number} ({self.branch.name})"
