from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
User = get_user_model()

from branches.models import Branch

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
    base_unit = models.CharField(max_length=20, choices=[
        ('carton', 'Carton'), ('bottle', 'Bottle'), ('litre', 'Litre'), ('unit', 'Unit'), ('shot', 'Shot')
    ])
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    receipt_image = models.ImageField(upload_to='receipts/', null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class UnitConversion(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='conversions')
    from_unit = models.CharField(max_length=20)
    to_unit = models.CharField(max_length=20)
    multiplier = models.DecimalField(max_digits=10, decimal_places=4)

    def __str__(self):
        return f"{self.product.name}: {self.from_unit} -> {self.to_unit}"


class Stock(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    minimum_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    running_out = models.BooleanField(default=False)

    class Meta:
        unique_together = ('product', 'branch')

    def __str__(self):
        return f"{self.branch.name} - {self.product.name}"


class StockUnit(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='units')
    unit_type = models.CharField(max_length=20)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.unit_type}: {self.quantity} ({self.stock})"


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
        ('litre', 'Litre'),
        ('shot', 'Shot'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_type = models.CharField(max_length=10, choices=UNIT_TYPES)
    transaction_date = models.DateTimeField(default=timezone.now)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

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
        ('litre', 'Litre'),
        ('shot', 'Shot'),
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
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='barman_stocks')
    bartender = models.ForeignKey(User, on_delete=models.CASCADE)
    carton_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    bottle_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    litre_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    unit_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    shot_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    minimum_threshold = models.DecimalField(max_digits=10, decimal_places=5, default=0.00)
    running_out = models.BooleanField(default=False)

    class Meta:
        unique_together = ('stock', 'bartender')

    def __str__(self):
        return f"{self.bartender.username} — {self.stock.branch.name} — {self.stock.product.name}"

    def get_quantity_by_unit_type(self, unit_type):
        """Get quantity for a specific unit type"""
        unit_type_mapping = {
            'carton': self.carton_quantity,
            'bottle': self.bottle_quantity,
            'litre': self.litre_quantity,
            'unit': self.unit_quantity,
            'shot': self.shot_quantity,
        }
        return unit_type_mapping.get(unit_type, 0)

    def reduce_quantity_by_unit_type(self, unit_type, amount):
        """Reduce quantity for a specific unit type"""
        if unit_type == 'carton':
            self.carton_quantity = max(0, self.carton_quantity - amount)
        elif unit_type == 'bottle':
            self.bottle_quantity = max(0, self.bottle_quantity - amount)
        elif unit_type == 'litre':
            self.litre_quantity = max(0, self.litre_quantity - amount)
        elif unit_type == 'unit':
            self.unit_quantity = max(0, self.unit_quantity - amount)
        elif unit_type == 'shot':
            self.shot_quantity = max(0, self.shot_quantity - amount)

    def check_running_out(self):
        """Check if any unit type is running low"""
        total_quantity = (
            self.carton_quantity + 
            self.bottle_quantity + 
            self.litre_quantity + 
            self.unit_quantity + 
            self.shot_quantity
        )
        new_status = self.minimum_threshold > 0 and total_quantity <= self.minimum_threshold
        if self.running_out != new_status:
            self.running_out = new_status
            self.save(update_fields=['running_out'])
        return self.running_out

    def clean(self):
        if self.carton_quantity < 0 or self.bottle_quantity < 0 or self.litre_quantity < 0 or self.unit_quantity < 0 or self.shot_quantity < 0:
            raise ValidationError({"quantity": "Quantity cannot be negative."})
        if self.minimum_threshold < 0:
            raise ValidationError({"minimum_threshold": "Minimum threshold cannot be negative."})
