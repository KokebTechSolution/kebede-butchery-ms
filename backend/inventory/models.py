from django.db import models
from django.utils import timezone


# ✅ Top-Level: Food or Beverage
class ItemType(models.Model):
    type_name = models.CharField(max_length=50, unique=True)  # Example: 'Food', 'Beverage'

    def __str__(self):
        return self.type_name


# ✅ Subcategory: e.g., Soft Drink, Hot Drink, Beer
class Category(models.Model):
    item_type = models.ForeignKey(ItemType, on_delete=models.CASCADE)
    category_name = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.category_name} ({self.item_type.type_name})"


# ✅ Product Model: Simplified with Flexible Fields
class Product(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    
    # Pricing
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Control carton and bottle tracking
    uses_carton = models.BooleanField(default=False)  # Does this product have cartons?
    bottles_per_carton = models.IntegerField(default=0, null=True, blank=True)

    # Stock levels
    carton_quantity = models.IntegerField(default=0, null=True, blank=True)
    bottle_quantity = models.IntegerField(default=0, null=True, blank=True)

    # For food or items tracked by units only
    unit_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)

    # Minimum stock warning
    minimum_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    running_out = models.BooleanField(default=False)

    # Receipt image per product entry
    receipt_image = models.ImageField(upload_to='receipts/', null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def total_bottles_in_stock(self):
        if self.uses_carton:
            return (self.carton_quantity * self.bottles_per_carton) + self.bottle_quantity
        return self.bottle_quantity

    def check_running_out(self):
        # For bottle-based products
        if self.uses_carton:
            if self.total_bottles_in_stock <= self.minimum_threshold:
                self.running_out = True
            else:
                self.running_out = False

        # For unit-based products (like Food)
        else:
            if self.unit_quantity <= self.minimum_threshold:
                self.running_out = True
            else:
                self.running_out = False

        self.save()


# ✅ Inventory Transactions: Restock, Sale, Wastage
class InventoryTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('restock', 'Restock'),
        ('sale', 'Sale'),
        ('wastage', 'Wastage'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)  # Can represent cartons, bottles, or units
    unit_type = models.CharField(max_length=10, choices=(('carton', 'Carton'), ('bottle', 'Bottle'), ('unit', 'Unit')))
    transaction_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.transaction_type.title()} - {self.product.name} ({self.quantity} {self.unit_type})"
