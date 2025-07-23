from django.db import models
from django.utils import timezone
from branches.models import Branch  # Adjust import path as needed
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db.models import Sum, F
from decimal import Decimal, ROUND_DOWN

User = get_user_model()

# --- Core Definitions ---

class ItemType(models.Model):
    """
    Defines broad categories like 'Beverage', 'Food', 'Merchandise'.
    """
    type_name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.type_name


class Category(models.Model):
    """
    Defines sub-categories within an ItemType, e.g., 'Soft Drinks', 'Spirits', 'Juices'.
    """
    item_type = models.ForeignKey(ItemType, on_delete=models.CASCADE)
    category_name = models.CharField(max_length=50)

    class Meta:
        unique_together = ('item_type', 'category_name') # Ensure unique category names per item type

    def __str__(self):
        return f"{self.category_name} ({self.item_type.type_name})"

# --- Product Definitions ---

class Product(models.Model):
    """
    Represents a sellable item, defining its name, category, and crucially,
    how it's purchased/stocked and how it breaks down into sellable units.

    This is where the "Grandpa" and "Father" concepts are defined.
    """
    class StockingUnit(models.TextChoices):
        CARTON = 'carton', 'Carton'
        BOTTLE = 'bottle', 'Bottle'
        LITER = 'liter', 'Liter'
        KILOGRAM = 'kilogram', 'Kilogram' # Example for food/other items
        PIECE = 'piece', 'Piece' # For items always stocked and sold as single pieces

    class SellableUnit(models.TextChoices):
        PIECE = 'piece', 'Piece' # e.g., a can of soda, a single cookie
        SHOT = 'shot', 'Shot'   # e.g., a shot of liquor
        GLASS = 'glass', 'Glass' # e.g., a glass of tej, juice
        UNIT = 'unit', 'Unit' # Generic smallest unit (if not piece, shot, glass)

    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    # The price of the smallest sellable unit
    price_per_sellable_unit = models.DecimalField(max_digits=10, decimal_places=2)

    # Grandpa Unit: How the product is primarily purchased or stocked (e.g., carton, bottle, liter)
    primary_stocking_unit = models.CharField(
        max_length=20,
        choices=StockingUnit.choices,
        default=StockingUnit.PIECE
    )

    # Father Unit: The smallest unit this product can be broken down into from its stocking unit.
    # This is the unit we'll convert all stock into for internal tracking.
    sellable_unit_type = models.CharField(
        max_length=20,
        choices=SellableUnit.choices,
        default=SellableUnit.PIECE
    )

    # Conversion rate: How many 'sellable_unit_type' are in one 'primary_stocking_unit'
    # E.g., for soda: 24 pieces in 1 carton. For Red Label: 20 shots in 1 bottle. For Tej: 4 glasses in 1 liter.
    conversion_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=1.0,
        help_text="Number of sellable units per primary stocking unit."
    )

    receipt_image = models.ImageField(upload_to='receipts/', null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def clean(self):
        """
        Custom validation for Product model.
        Ensures conversion_rate is > 0 and makes sense with unit types.
        """
        if self.conversion_rate <= 0:
            raise ValidationError({'conversion_rate': 'Conversion rate must be positive.'})

        # Example: if primary stocking unit is 'piece', conversion rate should likely be 1
        if self.primary_stocking_unit == self.SellableUnit.PIECE and self.conversion_rate != 1:
            # You might allow this for special cases, or enforce it strictly.
            # For simplicity, let's just make sure it's not zero.
            pass

    def get_price_per_stocking_unit(self):
        """
        Calculates the effective price if purchased by its primary stocking unit.
        Assumes price_per_sellable_unit is the base.
        """
        return self.price_per_sellable_unit * self.conversion_rate


# --- Stock Management ---

class Stock(models.Model):
    """
    Tracks the total available 'sellable units' of a product at a specific branch.
    All quantities are stored in the smallest sellable unit.
    """
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)

    # Store total quantity in the smallest sellable unit (the "Single Piece")
    # e.g., total cans, total shots, total glasses
    total_sellable_units = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Thresholds are also in sellable units
    minimum_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    running_out = models.BooleanField(default=False) # Indicates if below threshold

    class Meta:
        unique_together = ('product', 'branch')
        verbose_name = "Branch Stock"
        verbose_name_plural = "Branch Stocks"

    def __str__(self):
        return f"{self.branch.name} — {self.product.name} ({self.total_sellable_units} {self.product.sellable_unit_type.lower()})"

    def clean(self):
        """Ensure no negative values are saved for total_sellable_units or minimum_threshold."""
        errors = {}
        if self.total_sellable_units < 0:
            errors['total_sellable_units'] = 'Total sellable units cannot be negative.'
        if self.minimum_threshold < 0:
            errors['minimum_threshold'] = 'Minimum threshold cannot be negative.'

        if errors:
            raise ValidationError(errors)

    def get_total_stock_display(self):
        """
        Returns total stock for display, might convert to larger units if appropriate
        (e.g., how many full cartons/bottles are left plus remaining units).
        This is for display only, internal logic uses total_sellable_units.
        """
        if self.product.primary_stocking_unit == self.product.StockingUnit.CARTON and self.product.conversion_rate > 0:
            remaining_sellable_units = self.total_sellable_units
            full_cartons = Decimal(remaining_sellable_units / self.product.conversion_rate).quantize(Decimal('1.'), rounding=ROUND_DOWN)
            remaining_bottles = remaining_sellable_units % self.product.conversion_rate
            return f"{full_cartons} cartons, {remaining_bottles} {self.product.sellable_unit_type.lower()}(s)"
        elif self.product.primary_stocking_unit == self.product.StockingUnit.BOTTLE and self.product.conversion_rate > 0:
            remaining_sellable_units = self.total_sellable_units
            full_bottles = Decimal(remaining_sellable_units / self.product.conversion_rate).quantize(Decimal('1.'), rounding=ROUND_DOWN)
            remaining_shots = remaining_sellable_units % self.product.conversion_rate
            return f"{full_bottles} bottles, {remaining_shots} {self.product.sellable_unit_type.lower()}(s)"
        else:
            return f"{self.total_sellable_units} {self.product.sellable_unit_type.lower()}(s)"


    def check_running_out(self):
        """
        Checks if the current stock for this specific branch is below its threshold.
        Updates `running_out` status.
        """
        threshold = float(self.minimum_threshold)
        new_status = threshold > 0 and self.total_sellable_units <= threshold

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

    @classmethod
    def add_stock(cls, product, branch, quantity, unit_type):
        """
        Adds stock to a specific branch. Handles conversion from various 'Grandpa' units
        to the internal 'single piece' unit.
        `unit_type` should be one of Product.StockingUnit or Product.SellableUnit.
        """
        stock, created = cls.objects.get_or_create(product=product, branch=branch)
        quantity_decimal = Decimal(quantity)

        if unit_type == product.primary_stocking_unit:
            # Adding Grandpa unit (e.g., a carton, a bottle, a liter)
            converted_quantity = quantity_decimal * product.conversion_rate
        elif unit_type == product.sellable_unit_type:
            # Adding Father/Single Piece unit directly
            converted_quantity = quantity_decimal
        else:
            raise ValidationError(f"Invalid unit type '{unit_type}' for product '{product.name}'. "
                                  f"Expected '{product.primary_stocking_unit}' or '{product.sellable_unit_type}'.")

        stock.total_sellable_units += converted_quantity
        stock.save() # This will trigger check_running_out via the save method

        return stock

    @classmethod
    def deduct_stock(cls, product, branch, quantity):
        """
        Deducts stock from a specific branch. Always deducts in the 'single piece' unit.
        """
        stock = cls.objects.get(product=product, branch=branch)
        quantity_decimal = Decimal(quantity)

        if stock.total_sellable_units < quantity_decimal:
            raise ValidationError(f"Insufficient stock for {product.name} at {branch.name}. "
                                  f"Available: {stock.total_sellable_units} {product.sellable_unit_type.lower()}, "
                                  f"Requested: {quantity_decimal} {product.sellable_unit_type.lower()}.")

        stock.total_sellable_units -= quantity_decimal
        stock.save() # This will trigger check_running_out via the save method

        return stock

    @classmethod
    def get_aggregated_stock(cls, product):
        """
        Aggregates total stock across all branches for the product,
        always returning the sum in the smallest sellable unit.
        """
        total = cls.objects.filter(product=product).aggregate(
            total_sum=Sum('total_sellable_units')
        )['total_sum'] or Decimal(0)
        return total


class BarmanStock(models.Model):
    """
    Tracks the 'sellable units' of a product allocated to a specific bartender.
    All quantities are stored in the smallest sellable unit.
    """
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='barman_stocks')
    bartender = models.ForeignKey(User, on_delete=models.CASCADE)

    # Store total quantity in the smallest sellable unit (the "Single Piece")
    total_sellable_units = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Thresholds are also in sellable units
    minimum_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    running_out = models.BooleanField(default=False)

    class Meta:
        unique_together = ('stock', 'bartender')
        verbose_name = "Barman Stock"
        verbose_name_plural = "Barman Stocks"

    def __str__(self):
        return f"{self.bartender.username} — {self.stock.product.name} ({self.total_sellable_units} {self.stock.product.sellable_unit_type.lower()})"

    def clean(self):
        """Ensure no negative values are saved for total_sellable_units or minimum_threshold."""
        errors = {}
        if self.total_sellable_units < 0:
            errors['total_sellable_units'] = 'Total sellable units cannot be negative.'
        if self.minimum_threshold < 0:
            errors['minimum_threshold'] = 'Minimum threshold cannot be negative.'
        if errors:
            raise ValidationError(errors)

    def check_running_out(self):
        """
        Checks if the current stock for this specific barman is below their threshold.
        Updates `running_out` status.
        """
        threshold = float(self.minimum_threshold)
        new_status = threshold > 0 and self.total_sellable_units <= threshold

        if self.running_out != new_status:
            self.running_out = new_status
            super().save(update_fields=['running_out'])

        return self.running_out

    def should_alert(self):
        return self.running_out

    def save(self, *args, **kwargs):
        self.full_clean()

        # Auto-set minimum threshold if not already set and stock is available
        # It's usually better to have this set manually or via business logic in views/forms
        # But if you want to keep it, consider what 'self.stock.bottle_quantity' maps to now.
        # It should be a percentage of 'self.total_sellable_units'
        if self.minimum_threshold == 0 and self.total_sellable_units > 0:
            # Example: 20% of current barman's stock if threshold not set
            raw_threshold = self.total_sellable_units * Decimal("0.2")
            self.minimum_threshold = raw_threshold.quantize(Decimal("0.00"), rounding=ROUND_DOWN) # Use 2 decimal places consistent with others

        super().save(*args, **kwargs)

        # Ensure running_out gets evaluated/updated
        if not kwargs.get('update_fields') or 'running_out' not in kwargs.get('update_fields', []):
            self.check_running_out()

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