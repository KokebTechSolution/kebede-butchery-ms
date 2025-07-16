from django.db import models
from django.utils import timezone
from branches.models import Branch  # Adjust import path as needed
from django.contrib.auth import get_user_model
User = get_user_model()
from django.core.exceptions import ValidationError

from django.db import models
from django.db.models import Sum, F
from django.core.exceptions import ValidationError


class ItemType(models.Model):
    type_name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.type_name


class Category(models.Model):
    item_type = models.ForeignKey(ItemType, on_delete=models.CASCADE)
    category_name = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.category_name} ({self.item_type.type_name})"

class Product(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    uses_carton = models.BooleanField(default=False)
    bottles_per_carton = models.IntegerField(default=0, null=True, blank=True)
    receipt_image = models.ImageField(upload_to='receipts/', null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import Sum
class Stock(models.Model):
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    branch = models.ForeignKey('branches.Branch', on_delete=models.CASCADE)

    carton_quantity = models.PositiveIntegerField(default=0)
    bottle_quantity = models.PositiveIntegerField(default=0)
    unit_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    minimum_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    running_out = models.BooleanField(default=False)

    class Meta:
        unique_together = ('product', 'branch')
        verbose_name = "Stock"
        verbose_name_plural = "Stocks"

    def __str__(self):
        return f"{self.branch.name} — {self.product.name}"

    def clean(self):
        """Ensure no negative values are saved."""
        errors = {}
        if self.carton_quantity < 0:
            errors['carton_quantity'] = 'Carton quantity cannot be negative.'
        if self.bottle_quantity < 0:
            errors['bottle_quantity'] = 'Bottle quantity cannot be negative.'
        if self.unit_quantity < 0:
            errors['unit_quantity'] = 'Unit quantity cannot be negative.'
        if self.minimum_threshold < 0:
            errors['minimum_threshold'] = 'Minimum threshold cannot be negative.'

        if errors:
            raise ValidationError(errors)

    def get_total_stock(self):
        """Returns total stock in standard units (bottles or units)."""
        if self.product.uses_carton:
            bottles_from_cartons = self.carton_quantity * self.product.bottles_per_carton
            return bottles_from_cartons + self.bottle_quantity
        return float(self.unit_quantity)

    @classmethod
    def get_aggregated_stock(cls, product):
        """Aggregate total stock across all branches for the product."""
        stocks = cls.objects.filter(product=product)
        if product.uses_carton:
            result = stocks.aggregate(
                total_cartons=Sum('carton_quantity'),
                total_bottles=Sum('bottle_quantity')
            )
            total_cartons = result['total_cartons'] or 0
            total_bottles = result['total_bottles'] or 0
            return (total_cartons * product.bottles_per_carton) + total_bottles
        else:
            return float(stocks.aggregate(total=Sum('unit_quantity'))['total'] or 0.0)

    def check_running_out(self):
        """
        Checks if the aggregated stock is below 25% of threshold.
        Only activates if minimum_threshold > 0.
        Updates only if the `running_out` value changes.
        """
        total = self.get_aggregated_stock(self.product)
        threshold = float(self.minimum_threshold)

        if threshold == 0:
            new_status = False
        else:
            new_status = total <= (threshold / 4)

        if self.running_out != new_status:
            self.running_out = new_status
            # Avoid recursion: update only this field without calling check again
            super(Stock, self).save(update_fields=['running_out'])

        return self.running_out

    def should_alert(self):
        """Return True if alert should be triggered (used in dashboards/notifications)."""
        return self.running_out

    def save(self, *args, **kwargs):
        """Validate, save and update running_out status without recursion."""
        self.full_clean()
        super().save(*args, **kwargs)

        # Only check running_out if not already updating just that
        if not kwargs.get('update_fields') or 'running_out' not in kwargs.get('update_fields', []):
            self.check_running_out()


class InventoryTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('restock', 'Restock'),
        ('sale', 'Sale'),
        ('wastage', 'Wastage'),
    )

    UNIT_TYPES = (
        ('carton', 'Carton'),
        ('bottle', 'Bottle'),
        ('unit', 'Unit'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_type = models.CharField(max_length=10, choices=UNIT_TYPES)
    transaction_date = models.DateTimeField(default=timezone.now)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.transaction_type.title()} - {self.product.name} ({self.quantity} {self.unit_type}) at {self.branch.name}"


class InventoryRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )

    UNIT_TYPES = (
        ('carton', 'Carton'),
        ('bottle', 'Bottle'),
        ('unit', 'Unit'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_type = models.CharField(max_length=10, choices=UNIT_TYPES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    reached_status = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.product.name} request at {self.branch.name} - {self.status}"





class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('create', 'Create'),
        ('update', 'Update'),
        ('restock', 'Restock'),
        ('sale', 'Sale'),
        ('wastage', 'Wastage'),
        ('request', 'Inventory Request'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    unit_type = models.CharField(max_length=10, null=True, blank=True)
    action_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    branch = models.ForeignKey(Branch, null=True, blank=True, on_delete=models.SET_NULL)
    timestamp = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)

    def __str__(self):
        return f"[{self.timestamp}] {self.action_type} - {self.product.name} by {self.action_by}"


class BarmanStock(models.Model):
    stock = models.ForeignKey('Stock', on_delete=models.CASCADE, related_name='barman_stocks')
    bartender = models.ForeignKey(User, on_delete=models.CASCADE)

    carton_quantity = models.PositiveIntegerField(default=0)
    bottle_quantity = models.PositiveIntegerField(default=0)
    unit_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    minimum_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    running_out = models.BooleanField(default=False)

    class Meta:
        unique_together = ('stock', 'bartender')
        verbose_name = "Barman Stock"
        verbose_name_plural = "Barman Stocks"

    def __str__(self):
        return f"{self.bartender.username} — {self.stock.branch.name} — {self.stock.product.name}"

    def clean(self):
        errors = {}
        if self.carton_quantity < 0:
            errors['carton_quantity'] = 'Carton quantity cannot be negative.'
        if self.bottle_quantity < 0:
            errors['bottle_quantity'] = 'Bottle quantity cannot be negative.'
        if self.unit_quantity < 0:
            errors['unit_quantity'] = 'Unit quantity cannot be negative.'
        if self.minimum_threshold < 0:
            errors['minimum_threshold'] = 'Minimum threshold cannot be negative.'
        if errors:
            raise ValidationError(errors)

    def get_total_stock(self):
        product = self.stock.product
        if product.uses_carton:
            bottles_from_cartons = self.carton_quantity * product.bottles_per_carton
            return bottles_from_cartons + self.bottle_quantity
        return float(self.unit_quantity)

    def check_running_out(self):
        total = self.get_total_stock()
        threshold = float(self.minimum_threshold)

        new_status = threshold > 0 and total <= (threshold / 4)
        if self.running_out != new_status:
            self.running_out = new_status
            super().save(update_fields=['running_out'])

        return self.running_out

    def should_alert(self):
        return self.running_out

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

        if not kwargs.get('update_fields') or 'running_out' not in kwargs.get('update_fields', []):
            self.check_running_out()