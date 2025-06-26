from django.db import models
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes


# ✅ Top-Level: Food or Beverage
class ItemType(models.Model):
    type_name = models.CharField(max_length=50, unique=True)  # Example: 'Food', 'Beverage'

    def __str__(self):
        return self.type_name


# ✅ Subcategory: e.g., Soft Drink, Meat, Beer
class Category(models.Model):
    item_type = models.ForeignKey(ItemType, on_delete=models.CASCADE)
    category_name = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.category_name} ({self.item_type.type_name})"


# ✅ Product: Multi-Unit Inventory Model
class Product(models.Model):
    UNIT_CHOICES = (
        ('kg', 'Kilogram'),
        ('piece', 'Piece'),
        ('plate', 'Plate'),
        ('shot', 'Shot'),
        ('bottle', 'Bottle'),
        ('carton', 'Carton'),
    )

    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    unit_type = models.CharField(max_length=20, choices=UNIT_CHOICES)

    # Beverage-specific fields
    quantity_per_carton = models.IntegerField(default=0, blank=True, null=True)
    volume_per_bottle_ml = models.IntegerField(default=0, blank=True, null=True)
    volume_per_shot_ml = models.IntegerField(default=0, blank=True, null=True)

    stock_in_bottles = models.IntegerField(default=0, blank=True, null=True)
    stock_in_ml = models.IntegerField(default=0, blank=True, null=True)

    # Food-specific fields
    stock_in_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, blank=True, null=True)
    stock_in_pieces = models.IntegerField(default=0, blank=True, null=True)

    # Low stock control
    running_out = models.BooleanField(default=False)
    minimum_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def shots_per_bottle(self):
        if self.volume_per_bottle_ml and self.volume_per_shot_ml:
            return self.volume_per_bottle_ml // self.volume_per_shot_ml
        return 0

    def total_shots_available(self):
        if self.stock_in_ml and self.volume_per_shot_ml:
            return self.stock_in_ml // self.volume_per_shot_ml
        return 0

    def add_stock(self, quantity, unit_type):
        if unit_type == 'carton':
            bottles = quantity * self.quantity_per_carton
            self.stock_in_bottles += bottles
            self.stock_in_ml = self.stock_in_bottles * self.volume_per_bottle_ml
        elif unit_type == 'bottle':
            self.stock_in_bottles += quantity
            self.stock_in_ml = self.stock_in_bottles * self.volume_per_bottle_ml
        elif unit_type == 'shot':
            self.stock_in_ml += quantity * self.volume_per_shot_ml
            self.stock_in_bottles = self.stock_in_ml // self.volume_per_bottle_ml
        elif unit_type == 'kg':
            self.stock_in_kg += quantity
        elif unit_type == 'piece':
            self.stock_in_pieces += quantity
        elif unit_type == 'plate':
            self.stock_in_pieces += quantity
        self.save()

    def remove_stock(self, quantity, unit_type):
        if unit_type == 'shot':
            ml_to_deduct = quantity * self.volume_per_shot_ml
            if self.stock_in_ml < ml_to_deduct:
                raise ValueError("Insufficient stock in shots!")
            self.stock_in_ml -= ml_to_deduct
            self.stock_in_bottles = self.stock_in_ml // self.volume_per_bottle_ml

        elif unit_type == 'bottle':
            if self.stock_in_bottles < quantity:
                raise ValueError("Insufficient stock in bottles!")
            self.stock_in_bottles -= quantity
            self.stock_in_ml = self.stock_in_bottles * self.volume_per_bottle_ml

        elif unit_type == 'carton':
            bottles_to_deduct = quantity * self.quantity_per_carton
            if self.stock_in_bottles < bottles_to_deduct:
                raise ValueError("Insufficient stock in cartons!")
            self.stock_in_bottles -= bottles_to_deduct
            self.stock_in_ml = self.stock_in_bottles * self.volume_per_bottle_ml

        elif unit_type == 'kg':
            if self.stock_in_kg < quantity:
                raise ValueError("Insufficient stock in kg!")
            self.stock_in_kg -= quantity

        elif unit_type in ['piece', 'plate']:
            if self.stock_in_pieces < quantity:
                raise ValueError("Insufficient stock in pieces!")
            self.stock_in_pieces -= quantity

        self.save()

    def check_running_out(self):
        if self.unit_type in ['kg', 'plate'] and self.stock_in_kg <= self.minimum_threshold:
            self.running_out = True
        elif self.unit_type == 'piece' and self.stock_in_pieces <= self.minimum_threshold:
            self.running_out = True
        elif self.unit_type in ['bottle', 'carton'] and self.stock_in_bottles <= self.minimum_threshold:
            self.running_out = True
        elif self.unit_type == 'shot' and self.stock_in_ml <= (self.minimum_threshold * self.volume_per_shot_ml):
            self.running_out = True
        else:
            self.running_out = False
        self.save()


# ✅ Sales: Records Each Sale
class Sale(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_type = models.CharField(max_length=20, choices=Product.UNIT_CHOICES)
    sale_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Sale: {self.product.name} ({self.quantity} {self.unit_type})"


# ✅ Stock Movement: Restock, Sale, Wastage Tracking
class StockMovement(models.Model):
    MOVEMENT_CHOICES = (
        ('restock', 'Restock'),
        ('sale', 'Sale'),
        ('wastage', 'Wastage'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_CHOICES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_type = models.CharField(max_length=20, choices=Product.UNIT_CHOICES)
    movement_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.movement_type.title()} - {self.product.name} ({self.quantity} {self.unit_type})"
