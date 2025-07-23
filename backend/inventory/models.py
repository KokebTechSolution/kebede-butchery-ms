from django.db import models
from django.utils import timezone
from branches.models import Branch
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db.models import Sum, F
from decimal import Decimal, ROUND_DOWN

class ItemType(models.Model):
    """
    Defines broad categories like 'Beverage', 'Food', 'Merchandise'.
    """
    type_name = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Item Type"
        verbose_name_plural = "Item Types"
        ordering = ['type_name']

    def __str__(self):
        return self.type_name

class Category(models.Model):
    item_type = models.ForeignKey(ItemType, on_delete=models.CASCADE)
    category_name = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Product Category"
        verbose_name_plural = "Product Categories"
        unique_together = ('item_type', 'category_name')
        ordering = ['item_type__type_name', 'category_name']

    class Meta:
        unique_together = ('item_type', 'category_name') # Ensure unique category names per item type

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

    class Meta:
        verbose_name = "Product"
        verbose_name_plural = "Products"
        ordering = ['name']

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
            BarmanStock.objects.filter(id=self.id).update(running_out=new_status)
            self.running_out = new_status

    def save(self, *args, **kwargs):
        self.full_clean()
        is_new = self._state.adding
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
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # <-- Added field

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

    minimum_threshold = models.DecimalField(max_digits=10, decimal_places=5, default=0.00)
    running_out = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Inventory Request"
        verbose_name_plural = "Inventory Requests"
        ordering = ['-created_at']

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

        new_status = threshold > 0 and total <= threshold
        if self.running_out != new_status:
            self.running_out = new_status
            super().save(update_fields=['running_out'])

        return self.running_out

    def should_alert(self):
        return self.running_out

    def save(self, *args, **kwargs):
        original_status = None
        if self.pk:
            original_status = InventoryRequest.objects.get(pk=self.pk).status

        self.full_clean()

        # Auto-set minimum threshold to 20% of stock's bottle quantity if not already set
        if self.minimum_threshold == 0 and self.stock and self.stock.bottle_quantity:
            raw_threshold = Decimal(self.stock.bottle_quantity) * Decimal("0.2")
            self.minimum_threshold = raw_threshold.quantize(Decimal("0.00001"), rounding=ROUND_DOWN)
        super().save(*args, **kwargs)

        if original_status != 'fulfilled' and self.status == 'fulfilled':
            try:
                store_stock = Stock.objects.get(product=self.product, branch=self.branch)
                barman_stock, created = BarmanStock.objects.get_or_create(
                    stock=store_stock, # Changed from product to stock
                    bartender=self.requested_by,
                    branch=self.branch
                )

                InventoryTransaction.objects.create(
                    product=self.product,
                    transaction_type='store_to_barman',
                    quantity=self.quantity,
                    transaction_unit=self.request_unit,
                    from_stock_main=store_stock,
                    to_stock_barman=barman_stock,
                    initiated_by=self.responded_by,
                    notes=f"Fulfilled request #{self.pk} by {self.requested_by.username}."
                )
                self.responded_at = timezone.now()
                super().save(update_fields=['responded_at'])

            except Stock.DoesNotExist:
                print(f"Error: Main store stock not found for product {self.product.name} at branch {self.branch.name} during request fulfillment.")
            except Exception as e:
                print(f"Error fulfilling request {self.pk}: {e}")
# inventory/models.py

from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.utils import timezone
from django.contrib import admin # Import admin module for admin.display

# ... (Your other models like ItemType, Category, Product, etc. go here) ...

class AuditLog(models.Model):
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50, help_text="Type of action (e.g., 'restock', 'sale', 'create', 'update')")
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    details = models.JSONField(default=dict, blank=True, null=True, help_text="JSON payload with detailed changes or transaction data.")
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Audit Log Entry"
        verbose_name_plural = "Audit Log Entries"

    def __str__(self):
        obj_str = f"'{self.content_object}'" if self.content_object else f"ID: {self.object_id}"
        user_str = self.user.username if self.user else 'System'
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')} - {user_str} - {self.action} on {obj_str}"

    # Use admin.display decorator for properties to set short_description
    @admin.display(description="Logged Object")
    def logged_object_display(self):
        if self.content_object:
            return str(self.content_object)
        if self.object_id and self.content_type:
            return f"{self.content_type.model.capitalize()} (ID: {self.object_id})"
        return "N/A"

    @admin.display(description="Details Summary")
    def action_details_summary(self):
        # Customize this based on the common actions and details you'll store
        if self.action in ['restock', 'sale', 'wastage', 'transfer_out', 'transfer_in']:
            product_name = self.details.get('product_name', 'N/A')
            quantity = self.details.get('quantity', 'N/A')
            transaction_unit_name = self.details.get('transaction_unit_name', 'N/A')
            return f"{product_name} - Qty: {quantity} {transaction_unit_name}"
        elif self.action == 'product_updated':
            old_name = self.details.get('old_name', 'N/A')
            new_name = self.details.get('new_name', 'N/A')
            return f"Name changed from '{old_name}' to '{new_name}'"
        return "See details"

    @classmethod
    def transfer_to_barman(cls, branch_stock: 'Stock', bartender: User, quantity: Decimal):
        """
        Transfers `quantity` of sellable units from branch stock to barman stock.
        """
        if quantity <= 0:
            raise ValidationError("Quantity to transfer must be positive.")

        if branch_stock.total_sellable_units < quantity:
            raise ValidationError(f"Insufficient branch stock for transfer. Available: {branch_stock.total_sellable_units}, Requested: {quantity}")

        barman_stock, created = cls.objects.get_or_create(stock=branch_stock, bartender=bartender)

        branch_stock.total_sellable_units -= quantity
        barman_stock.total_sellable_units += quantity

        branch_stock.save() # Will trigger check_running_out
        barman_stock.save() # Will trigger check_running_out

        return barman_stock

    @classmethod
    def deduct_from_barman(cls, barman_stock_instance, quantity: Decimal):
        """
        Deducts `quantity` of sellable units from a barman's stock (e.g., for sales).
        """
        if quantity <= 0:
            raise ValidationError("Quantity to deduct must be positive.")

        if barman_stock_instance.total_sellable_units < quantity:
            raise ValidationError(f"Insufficient barman stock. Available: {barman_stock_instance.total_sellable_units}, Requested: {quantity}")

        barman_stock_instance.total_sellable_units -= quantity
        barman_stock_instance.save() # Will trigger check_running_out

        return barman_stock_instance


# --- Transaction & Request Logs ---

class InventoryTransaction(models.Model):
    """
    Logs all inventory movements (restock, sale, wastage).
    Quantities are stored in the 'sellable_unit_type' for consistency.
    For 'restock' type, the original 'unit_type_entered' (e.g., 'carton')
    and 'original_quantity_entered' (e.g., 5 cartons) are captured for auditing.
    """
    TRANSACTION_TYPES = (
        ('restock', 'Restock'),
        ('sale', 'Sale'),
        ('wastage', 'Wastage'),
        ('transfer_in', 'Transfer In (from another branch/main)'), # Consider if needed
        ('transfer_out', 'Transfer Out (to another branch/barman)'), # Consider if needed
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)

    # Quantity in the product's defined sellable_unit_type
    quantity_in_sellable_units = models.DecimalField(max_digits=10, decimal_places=2)

    # For restocks, capture the original unit type and quantity for auditing/reporting
    original_quantity_entered = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Original quantity entered for restocks (e.g., 5 for 5 cartons)."
    )
    original_unit_type_entered = models.CharField(
        max_length=20, null=True, blank=True,
        help_text="Original unit type entered for restocks (e.g., 'carton')."
    )

    transaction_date = models.DateTimeField(default=timezone.now)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    # The purchase price of the *stocking unit* at the time of restock
    purchase_price_per_stocking_unit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    action_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True) # Who performed the transaction

    def __str__(self):
        return (f"{self.transaction_type.title()} - {self.product.name} "
                f"({self.quantity_in_sellable_units} {self.product.sellable_unit_type.lower()}) "
                f"at {self.branch.name} by {self.action_by.username if self.action_by else 'N/A'}")

    def clean(self):
        """
        Custom validation for InventoryTransaction.
        Ensures consistency between transaction type and fields.
        """
        if self.transaction_type == 'restock':
            if not self.original_quantity_entered or not self.original_unit_type_entered:
                raise ValidationError("For 'restock' transactions, 'original_quantity_entered' and 'original_unit_type_entered' are required.")
            if self.purchase_price_per_stocking_unit is None:
                 raise ValidationError("For 'restock' transactions, 'purchase_price_per_stocking_unit' is required.")
        else:
            if self.original_quantity_entered is not None or self.original_unit_type_entered is not None or self.purchase_price_per_stocking_unit is not None:
                raise ValidationError("Original quantity/unit/purchase price should only be set for 'restock' transactions.")

        if self.quantity_in_sellable_units <= 0 and self.transaction_type != 'wastage': # Wastage can be zero if no waste
             raise ValidationError({'quantity_in_sellable_units': 'Quantity must be positive for sales and restocks.'})


class InventoryRequest(models.Model):
    """
    Models requests for inventory, typically between a branch and a central warehouse,
    or a barman and a main branch stock.
    Quantities are requested in the smallest sellable unit.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('fulfilled', 'Fulfilled'), # New status when accepted items are actually transferred
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    # Quantity requested in the product's defined sellable_unit_type
    quantity_in_sellable_units = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Optionally, allow request to specify a 'Grandpa' unit for convenience,
    # but the internal `quantity_in_sellable_units` is the source of truth.
    requested_unit_type = models.CharField(
        max_length=20,
        choices=Product.StockingUnit.choices + Product.SellableUnit.choices, # Allow requesting in any unit
        null=True, blank=True,
        help_text="The unit in which the request was originally made (e.g., 'carton')."
    )

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    # `reached_status` seems redundant with `status` field.
    # It might be better to have an `accepted_at` or `fulfilled_at` timestamp.
    # Keeping it for now but consider removal.
    reached_status = models.BooleanField(default=False) # Consider replacing with accepted_at/fulfilled_at

    created_at = models.DateTimeField(auto_now_add=True)
    # The branch making the request
    requesting_branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='outgoing_inventory_requests')
    # The branch/warehouse fulfilling the request (if applicable)
    fulfilling_branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, related_name='incoming_inventory_requests')

    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_requests_made')
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_requests_processed')
    processed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.product.name} request ({self.quantity_in_sellable_units} {self.product.sellable_unit_type.lower()}) " \
               f"from {self.requesting_branch.name} - {self.status}"

    def clean(self):
        if self.quantity_in_sellable_units <= 0:
            raise ValidationError({'quantity_in_sellable_units': 'Quantity must be positive.'})
        # If requested_unit_type is set, ensure it's a valid type for the product
        if self.requested_unit_type:
            valid_unit_types = [choice[0] for choice in Product.StockingUnit.choices + Product.SellableUnit.choices]
            if self.requested_unit_type not in valid_unit_types:
                raise ValidationError({'requested_unit_type': f"Invalid requested unit type: {self.requested_unit_type}"})


class AuditLog(models.Model):
    """
    Comprehensive log of all significant inventory-related actions.
    All quantities are logged in the product's sellable unit for consistency.
    """
    ACTION_CHOICES = (
        ('create_product', 'Product Created'),
        ('update_product', 'Product Updated'),
        ('stock_add', 'Stock Added (Branch)'),
        ('stock_deduct', 'Stock Deducted (Branch)'),
        ('barman_stock_add', 'Stock Added (Barman)'),
        ('barman_stock_deduct', 'Stock Deducted (Barman)'),
        ('restock_transaction', 'Restock Transaction'),
        ('sale_transaction', 'Sale Transaction'),
        ('wastage_transaction', 'Wastage Transaction'),
        ('inventory_request_created', 'Inventory Request Created'),
        ('inventory_request_status_change', 'Inventory Request Status Change'),
        ('threshold_alert', 'Threshold Alert Triggered'), # Log when running_out status changes
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    action_type = models.CharField(max_length=50, choices=ACTION_CHOICES) # Increased max_length
    
    # Quantity of the action in the product's sellable unit
    quantity_affected_sellable_units = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # For audit, you might want to log the original unit if different from sellable unit
    original_action_unit = models.CharField(max_length=20, null=True, blank=True)
    original_action_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    action_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    branch = models.ForeignKey(Branch, null=True, blank=True, on_delete=models.SET_NULL)
    timestamp = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)

    # Optional: Link to specific transaction/request if applicable
    inventory_transaction = models.ForeignKey(InventoryTransaction, on_delete=models.SET_NULL, null=True, blank=True)
    inventory_request = models.ForeignKey(InventoryRequest, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Store previous and new values for updates/status changes
    previous_value = models.CharField(max_length=255, blank=True, null=True)
    new_value = models.CharField(max_length=255, blank=True, null=True)


    def __str__(self):
        return (f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.action_type} - "
                f"{self.product.name} (Qty: {self.quantity_affected_sellable_units or 'N/A'} "
                f"{self.product.sellable_unit_type.lower() if self.product else ''}) "
                f"by {self.action_by.username if self.action_by else 'System'}")

    class Meta:
        verbose_name = "Audit Log Entry"
        verbose_name_plural = "Audit Log Entries"