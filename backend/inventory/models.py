from django.db import models
from django.utils import timezone
from branches.models import Branch
from django.contrib.auth import get_user_model
User = get_user_model()
from django.core.exceptions import ValidationError
from django.db.models import Sum, F
from decimal import Decimal, ROUND_DOWN, InvalidOperation
from django.db import IntegrityError
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.contrib import admin

# --- Lookup Tables ---
class ItemType(models.Model):
    FOOD = 'food'
    BEVERAGE = 'beverage'
    
    TYPE_CHOICES = [
        (FOOD, 'Food'),
        (BEVERAGE, 'Beverage'),
    ]
    
    type_name = models.CharField(max_length=50, choices=TYPE_CHOICES, unique=True)
    description = models.TextField(blank=True, null=True, help_text="Description of this item type")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Item Type"
        verbose_name_plural = "Item Types"
        ordering = ['type_name']
    
    def __str__(self):
        return self.get_type_name_display()
    
    @property
    def is_food(self):
        return self.type_name == self.FOOD
    
    @property
    def is_beverage(self):
        return self.type_name == self.BEVERAGE

class Category(models.Model):
    item_type = models.ForeignKey(ItemType, on_delete=models.CASCADE, related_name='categories')
    category_name = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True, help_text="Is this category currently available?")
    sort_order = models.PositiveIntegerField(default=0, help_text="Order for display purposes")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Product Category"
        verbose_name_plural = "Product Categories"
        unique_together = ('item_type', 'category_name')
        ordering = ['item_type__type_name', 'sort_order', 'category_name']
    
    def __str__(self):
        return f"{self.category_name} ({self.item_type.get_type_name_display()})"
    
    @property
    def display_name(self):
        return f"{self.category_name} ({self.item_type.get_type_name_display()})"

class ProductUnit(models.Model):
    unit_name = models.CharField(max_length=50, unique=True, help_text="e.g., 'bottle', 'carton', 'liter', 'shot', 'ml', 'piece'")
    abbreviation = models.CharField(max_length=10, blank=True, null=True)
    is_liquid_unit = models.BooleanField(default=False, help_text="True if this unit measures liquid volume (e.g., liter, ml, shot, glass)")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = "Product Unit"
        verbose_name_plural = "Product Units"
        ordering = ['unit_name']
    def __str__(self):
        return self.unit_name

# --- Core Inventory Models ---
class Product(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    description = models.TextField(blank=True, null=True)
    
    # 🔧 NEW: Essential fields from Add Product form
    item_type = models.ForeignKey(ItemType, on_delete=models.SET_NULL, null=True, blank=True, related_name='products_by_type')
    base_unit = models.ForeignKey(
        ProductUnit,
        on_delete=models.PROTECT,
        related_name='products_as_base_unit',
        help_text="The fundamental unit for this product's inventory tracking and base price (e.g., 'bottle' for Pepsi, 'liter' for Tej).",
        null=True,
        blank=True
    )
    input_unit = models.ForeignKey(
        ProductUnit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products_as_input_unit',
        help_text="The unit used when adding stock (e.g., 'carton', 'box')"
    )
    conversion_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=4, 
        null=True, 
        blank=True,
        help_text="How many base units are in one input unit (e.g., 24 bottles per carton)"
    )
    base_unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True, help_text="Is this product currently available?")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Product"
        verbose_name_plural = "Products"
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def clean(self):
        # 🔧 NEW: Validate conversion_amount if both units are set
        if self.input_unit and self.base_unit and self.conversion_amount:
            if self.conversion_amount <= 0:
                raise ValidationError({'conversion_amount': 'Conversion amount must be positive.'})
    
    # 🔧 NEW: Method to get calculated base units from input quantity
    def get_calculated_base_units(self, input_quantity):
        """Calculate base units from input quantity using conversion_amount"""
        if not self.conversion_amount or not input_quantity:
            return None
        try:
            return (Decimal(str(input_quantity)) * self.conversion_amount).quantize(Decimal('0.01'))
        except (InvalidOperation, TypeError):
            return None
    
    # 🔧 NEW: Property to get base unit with number for display
    @property
    def base_unit_with_number(self):
        """Returns base unit with a default number (1) for display purposes"""
        if self.base_unit:
            return f"1 {self.base_unit.unit_name}"
        return "N/A"
    
    # 🔧 NEW: Property to get input unit with number for display
    @property
    def input_unit_with_number(self):
        """Returns input unit with a default number (1) for display purposes"""
        if self.input_unit:
            return f"1 {self.input_unit.unit_name}"
        return "N/A"
    
    # 🔧 NEW: Property to get calculated base unit with number for display
    @property
    def calculated_base_unit_with_number(self):
        """Returns calculated base unit with number for display"""
        if self.conversion_amount:
            return f"{self.conversion_amount} {self.base_unit.unit_name if self.base_unit else 'units'}"
        return "N/A"
    def get_conversion_factor(self, from_unit, to_unit):
        if from_unit == to_unit:
            return Decimal('1.0')
        try:
            conversion = self.measurements.get(from_unit=from_unit, to_unit=to_unit)
            return conversion.amount_per
        except ProductMeasurement.DoesNotExist:
            pass
        try:
            conversion = self.measurements.get(from_unit=to_unit, to_unit=from_unit)
            return Decimal('1.0') / conversion.amount_per
        except ProductMeasurement.DoesNotExist:
            pass
        if from_unit != self.base_unit and to_unit != self.base_unit:
            try:
                factor_from_to_base = self.get_conversion_factor(from_unit, self.base_unit)
                factor_base_to_to = self.get_conversion_factor(self.base_unit, to_unit)
                return factor_from_to_base * factor_base_to_to
            except ValueError:
                pass
        raise ValueError(f"No conversion path found for Product '{self.name}' from '{from_unit.unit_name}' to '{to_unit.unit_name}'.")
    def get_smallest_unit(self):
        from_units = set(self.measurements.values_list('from_unit', flat=True))
        to_units = set(self.measurements.values_list('to_unit', flat=True))
        smallest_unit_ids = [uid for uid in to_units if uid not in from_units]
        if not smallest_unit_ids:
            return None
        return ProductUnit.objects.get(id=smallest_unit_ids[0])
    def get_conversion_factor_to_smallest(self, from_unit):
        smallest_unit = self.get_smallest_unit()
        if not smallest_unit:
            raise ValueError(f"No smallest unit defined for product '{self.name}'")
        return self._get_conversion_factor_recursive(from_unit, smallest_unit, set())
    def _get_conversion_factor_recursive(self, from_unit, to_unit, visited):
        if from_unit == to_unit:
            return Decimal('1.0')
        visited.add(from_unit.id if hasattr(from_unit, 'id') else from_unit)
        try:
            conv = self.measurements.get(from_unit=from_unit, to_unit=to_unit)
            return conv.amount_per
        except ProductMeasurement.DoesNotExist:
            pass
        for m in self.measurements.filter(from_unit=from_unit):
            if (m.to_unit.id if hasattr(m.to_unit, 'id') else m.to_unit) not in visited:
                try:
                    factor = self._get_conversion_factor_recursive(m.to_unit, to_unit, visited)
                    return m.amount_per * factor
                except Exception:
                    continue
        try:
            conv = self.measurements.get(from_unit=to_unit, to_unit=from_unit)
            return Decimal('1.0') / conv.amount_per
        except ProductMeasurement.DoesNotExist:
            pass
        raise ValueError(f"No conversion path from {from_unit} to {to_unit} for product '{self.name}'")

class ProductMeasurement(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='measurements')
    from_unit = models.ForeignKey(ProductUnit, on_delete=models.PROTECT, related_name='conversions_from',
                                  help_text="The unit from which we are converting (e.g., 'carton', 'bottle')")
    to_unit = models.ForeignKey(ProductUnit, on_delete=models.PROTECT, related_name='conversions_to',
                                help_text="The unit to which we are converting (e.g., 'bottle', 'shot', 'ml')")
    amount_per = models.DecimalField(
        max_digits=10, decimal_places=4,
        help_text="How many 'to_unit' are in one 'from_unit' (e.g., 24 for bottles per carton, 20 for shots per bottle)"
    )
    is_default_sales_unit = models.BooleanField(default=False, help_text="Set as True if this is a primary unit for selling this product.")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = "Product Measurement Conversion"
        verbose_name_plural = "Product Measurement Conversions"
        unique_together = ('product', 'from_unit', 'to_unit')
        ordering = ['product__name', 'from_unit__unit_name', 'to_unit__unit_name']
    def __str__(self):
        return f"{self.product.name}: 1 {self.from_unit.unit_name} = {self.amount_per} {self.to_unit.unit_name}"
    def clean(self):
        if self.from_unit == self.to_unit:
            raise ValidationError("From Unit and To Unit cannot be the same.")
        if self.amount_per <= 0:
            raise ValidationError({'amount_per': 'Amount per must be positive.'})
from decimal import Decimal
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.models import F

class Stock(models.Model):
    product = models.ForeignKey(
        'Product',
        on_delete=models.CASCADE,
        related_name='store_stocks'
    )
    branch = models.ForeignKey(
        'branches.Branch',
        on_delete=models.CASCADE,
        related_name='product_stocks'
    )
    
    # 🔧 NEW: Essential fields for display
    input_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="The input quantity from the Add Product form (e.g., 10 cartons)"
    )
    
    calculated_base_units = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Calculated base units from input_quantity * conversion_amount"
    )
    
    minimum_threshold_base_units = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Minimum stock level in base units before 'running_out' is flagged."
    )
    
    # 🔧 NEW: Property to get input quantity with unit name
    @property
    def input_quantity_with_unit(self):
        """Returns input quantity with unit name for display (e.g., '10 cartons')"""
        if self.input_quantity and self.product and self.product.input_unit:
            return f"{self.input_quantity} {self.product.input_unit.unit_name}"
        return "N/A"
    
    # 🔧 NEW: Property to get calculated base units with unit name
    @property
    def calculated_base_units_with_unit(self):
        """Returns calculated base units with unit name for display (e.g., '240 bottles')"""
        calculated = self.calculated_base_units
        if calculated and self.product and self.product.base_unit:
            return f"{calculated} {self.product.base_unit.unit_name}"
        return "N/A"
    
    class Meta:
        verbose_name = "Main Store Stock"
        verbose_name_plural = "Main Store Stocks"
        unique_together = ('product', 'branch')
        ordering = ['branch__name', 'product__name']

    def __str__(self):
        return f"{self.product.name} @ {self.branch.name}"
    
    def adjust_quantity(self, quantity, unit, is_addition=True, original_quantity_delta=None):
        """
        Adjust the stock quantity - this method is called by the fallback logic
        """
        print(f"[DEBUG] Stock.adjust_quantity() called - quantity: {quantity}, is_addition: {is_addition}, unit: {unit}, original_quantity_delta: {original_quantity_delta}")
        print(f"[DEBUG] Before adjustment - input_quantity: {self.input_quantity}, calculated_base_units: {self.calculated_base_units}")
        
        if not isinstance(quantity, Decimal):
            quantity = Decimal(str(quantity))
        
        if not is_addition:
            # For subtraction, check if we have enough stock
            if self.calculated_base_units and self.calculated_base_units < quantity:
                raise ValidationError(f"Insufficient stock of {self.product.name}. Available: {self.calculated_base_units} {self.product.base_unit.unit_name}, Required: {quantity} {self.product.base_unit.unit_name}")
            
            # Deduct from calculated_base_units
            if self.calculated_base_units:
                old_calculated = self.calculated_base_units
                self.calculated_base_units = (self.calculated_base_units - quantity).quantize(Decimal('0.01'))
                if self.calculated_base_units < 0:
                    self.calculated_base_units = Decimal('0.00')
                print(f"[DEBUG] Deducted {quantity} from calculated_base_units: {old_calculated} -> {self.calculated_base_units}")
            else:
                # If no calculated_base_units, set to 0
                self.calculated_base_units = Decimal('0.00')
                print(f"[DEBUG] Set calculated_base_units to 0.00")
            
            # Also deduct from input_quantity if original_quantity_delta is provided
            if original_quantity_delta and self.input_quantity:
                old_input = self.input_quantity
                self.input_quantity = (self.input_quantity - original_quantity_delta).quantize(Decimal('0.01'))
                if self.input_quantity < 0:
                    self.input_quantity = Decimal('0.00')
                print(f"[DEBUG] Deducted {original_quantity_delta} from input_quantity: {old_input} -> {self.input_quantity}")
            elif original_quantity_delta:
                # If no input_quantity but we have original_quantity_delta, set to 0
                self.input_quantity = Decimal('0.00')
                print(f"[DEBUG] Set input_quantity to 0.00")
        else:
            # For addition, add to both fields
            if self.calculated_base_units:
                old_calculated = self.calculated_base_units
                self.calculated_base_units = (self.calculated_base_units + quantity).quantize(Decimal('0.01'))
                print(f"[DEBUG] Added {quantity} to calculated_base_units: {old_calculated} -> {self.calculated_base_units}")
            else:
                self.calculated_base_units = quantity
                print(f"[DEBUG] Set calculated_base_units to {quantity}")
            
            if original_quantity_delta and self.input_quantity:
                old_input = self.input_quantity
                self.input_quantity = (self.input_quantity + original_quantity_delta).quantize(Decimal('0.01'))
                print(f"[DEBUG] Added {original_quantity_delta} to input_quantity: {old_input} -> {self.input_quantity}")
            elif original_quantity_delta:
                self.input_quantity = original_quantity_delta
                print(f"[DEBUG] Set input_quantity to {original_quantity_delta}")
        
        print(f"[DEBUG] About to save stock with input_quantity: {self.input_quantity}, calculated_base_units: {self.calculated_base_units}")
        
        # Ensure we never save null values - convert to 0.00
        if self.input_quantity is None:
            self.input_quantity = Decimal('0.00')
            print(f"[DEBUG] Converted null input_quantity to 0.00")
        
        if self.calculated_base_units is None:
            self.calculated_base_units = Decimal('0.00')
            print(f"[DEBUG] Converted null calculated_base_units to 0.00")
        
        self.save()
        print(f"[DEBUG] Stock saved successfully")
        print(f"[DEBUG] After save - input_quantity: {self.input_quantity}, calculated_base_units: {self.calculated_base_units}")
        
        # 🔧 NEW: Verify the values were actually saved to the database
        self.refresh_from_db()
        print(f"[DEBUG] After refresh from database - input_quantity: {self.input_quantity}, calculated_base_units: {self.calculated_base_units}")

class BarmanStock(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='barman_stocks')
    bartender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='barman_inventory')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='barman_product_stocks', null=True, blank=True)
    quantity_in_base_units = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    minimum_threshold_base_units = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    running_out = models.BooleanField(default=False)
    last_stock_update = models.DateTimeField(default=timezone.now)
    original_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    original_unit = models.ForeignKey(ProductUnit, on_delete=models.SET_NULL, null=True, blank=True, related_name='barman_stock_original_unit')
    class Meta:
        verbose_name = "Barman Stock"
        verbose_name_plural = "Barman Stocks"
        unique_together = (('stock', 'bartender'),)
        ordering = ['bartender__username', 'stock__product__name']
    def __str__(self):
        try:
            bartender_name = self.bartender.username if self.bartender else "Unknown"
            product_name = self.stock.product.name if self.stock and self.stock.product else "Unknown Product"
            base_unit_name = self.stock.product.base_unit.unit_name if self.stock and self.stock.product and self.stock.product.base_unit else "units"
            return f"{bartender_name} — {product_name} ({self.quantity_in_base_units} {base_unit_name})"
        except Exception:
            return f"BarmanStock {self.id}"
    def clean(self):
        if self.quantity_in_base_units < 0:
            raise ValidationError({'quantity_in_base_units': 'Quantity cannot be negative.'})
        if self.minimum_threshold_base_units < 0:
            raise ValidationError({'minimum_threshold_base_units': 'Minimum threshold cannot be negative.'})
    def adjust_quantity(self, quantity, unit, is_addition=True):
        # quantity is already in base units
        print(f"[DEBUG] BarmanStock.adjust_quantity() called - quantity: {quantity}, is_addition: {is_addition}, unit: {unit}")
        
        if not isinstance(quantity, Decimal):
            quantity = Decimal(str(quantity))
        if not self.stock or not self.stock.product:
            raise ValueError("BarmanStock is missing a valid stock/product reference.")
        quantity_in_base_units_to_adjust = quantity
        if not is_addition:
            current_stock = BarmanStock.objects.filter(id=self.id).values_list('quantity_in_base_units', flat=True).first()
            if current_stock is None:
                raise ValueError("Barman stock record not found for adjustment.")
            if current_stock < quantity_in_base_units_to_adjust:
                raise ValidationError(f"Insufficient stock of {self.stock.product.name} to remove {quantity} {self.stock.product.base_unit.unit_name}. Available: {current_stock} {self.stock.product.base_unit.unit_name}")
            quantity_in_base_units_to_adjust = -quantity_in_base_units_to_adjust

        print(f"[DEBUG] BarmanStock.adjust_quantity() - Before update - quantity_in_base_units: {self.quantity_in_base_units}")
        print(f"[DEBUG] BarmanStock.adjust_quantity() - Adding quantity_in_base_units_to_adjust: {quantity_in_base_units_to_adjust}")

        BarmanStock.objects.filter(id=self.id).update(
            quantity_in_base_units=F('quantity_in_base_units') + quantity_in_base_units_to_adjust,
            last_stock_update=timezone.now()
        )
        self.refresh_from_db()
        print(f"[DEBUG] BarmanStock.adjust_quantity() - After update - quantity_in_base_units: {self.quantity_in_base_units}")

        # Update original_quantity properly - don't recalculate from base units
        if is_addition and self.original_unit and self.original_unit == unit:
            # Same unit, just add to original_quantity
            try:
                conversion_factor = self.stock.product.get_conversion_factor(unit, self.stock.product.base_unit)
                original_quantity_delta = quantity / conversion_factor
                self.original_quantity = (self.original_quantity + original_quantity_delta).quantize(Decimal('0.01'))
            except Exception:
                # If conversion fails, just add the quantity directly
                self.original_quantity = (self.original_quantity + quantity).quantize(Decimal('0.01'))
        elif is_addition and self.original_unit and self.original_unit != unit:
            # Different unit, convert existing original_quantity to new unit
            try:
                existing_conversion = self.stock.product.get_conversion_factor(self.original_unit, unit)
                converted_existing = self.original_quantity * existing_conversion
                self.original_quantity = (converted_existing + quantity).quantize(Decimal('0.01'))
            except Exception:
                # If conversion fails, use new quantity as original
                self.original_quantity = quantity
        elif is_addition:
            # No existing original_unit, set new quantity
            self.original_quantity = quantity
        elif not is_addition and self.original_unit:
            # Subtraction - convert base units to original units
            try:
                conversion_factor = self.stock.product.get_conversion_factor(self.original_unit, self.stock.product.base_unit)
                original_quantity_delta = abs(quantity) / conversion_factor
                self.original_quantity = (self.original_quantity - original_quantity_delta).quantize(Decimal('0.01'))
                if self.original_quantity < 0:
                    self.original_quantity = Decimal('0.00')
            except Exception:
                # If conversion fails, subtract directly
                self.original_quantity = (self.original_quantity - abs(quantity)).quantize(Decimal('0.01'))
                if self.original_quantity < 0:
                    self.original_quantity = Decimal('0.00')

        self.save(update_fields=['original_quantity'])

        if is_addition and self.minimum_threshold_base_units == 0 and self.quantity_in_base_units > 0:
            new_threshold = self.quantity_in_base_units * Decimal('0.20')
            if new_threshold == 0 and self.quantity_in_base_units > 0:
                new_threshold = Decimal('0.01')
            BarmanStock.objects.filter(id=self.id).update(
                minimum_threshold_base_units=new_threshold.quantize(Decimal('0.01'), rounding=ROUND_DOWN)
            )
            self.refresh_from_db()
        
        # Update original_unit if it's not set or if we're adding stock
        if is_addition and (not self.original_unit or self.original_unit != unit):
            self.original_unit = unit
            self.save(update_fields=['original_unit'])
        
        self.update_running_out_status()
    def update_running_out_status(self):
        new_status = self.quantity_in_base_units <= self.minimum_threshold_base_units
        if self.running_out != new_status:
            BarmanStock.objects.filter(id=self.id).update(running_out=new_status)
            self.running_out = new_status
    def save(self, *args, **kwargs):
        self.full_clean()
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new or (not kwargs.get('update_fields') or 'running_out' not in kwargs.get('update_fields', [])):
            self.update_running_out_status()
    def get_quantity_in_unit(self, target_unit):
        if not isinstance(target_unit, ProductUnit):
            raise TypeError("target_unit must be an instance of ProductUnit.")
        if not self.stock or not self.stock.product:
            raise ValueError("BarmanStock is missing a valid stock/product reference.")
        product = self.stock.product
        try:
            conversion_factor = product.get_conversion_factor(product.base_unit, target_unit)
            return self.quantity_in_base_units #* conversion_factor
        except ValueError as e:
            print(f"Warning: No valid conversion path for Product '{product.name}' from base unit '{product.base_unit.unit_name}' to target unit '{target_unit.unit_name}': {e}")
            return None
    @property
    def display_stock_summary(self):
        summary_parts = []
        summary_parts.append(
            f"{self.quantity_in_base_units.quantize(Decimal('0.01'))} "
            f"{self.stock.product.base_unit.abbreviation or self.stock.product.base_unit.unit_name}"
        )
        try:
            carton_unit = ProductUnit.objects.get(unit_name='carton')
            if self.stock.product.base_unit != carton_unit:
                carton_qty = self.get_quantity_in_unit(carton_unit)
                if carton_qty is not None and carton_qty >= Decimal('1.00'):
                    summary_parts.append(f"({carton_qty.quantize(Decimal('0.01'))} {carton_unit.abbreviation or carton_unit.unit_name})")
        except ProductUnit.DoesNotExist:
            pass
        try:
            default_sales_conversion = self.stock.product.measurements.filter(
                from_unit=self.stock.product.base_unit,
                is_default_sales_unit=True
            ).first()
            target_display_unit = None
            if default_sales_conversion:
                target_display_unit = default_sales_conversion.to_unit
            elif self.stock.product.base_unit.is_liquid_unit:
                target_display_unit = ProductUnit.objects.get(unit_name='shot')
            elif self.stock.product.category.item_type.type_name == 'Food':
                target_display_unit = ProductUnit.objects.get(unit_name='piece')
            if target_display_unit and target_display_unit != self.stock.product.base_unit:
                display_qty = self.get_quantity_in_unit(target_display_unit)
                if display_qty is not None and display_qty >= Decimal('0.01'):
                    summary_parts.append(f"({display_qty.quantize(Decimal('0.01'))} {target_display_unit.abbreviation or target_display_unit.unit_name})")
        except ProductUnit.DoesNotExist:
            pass
        return " ".join(summary_parts)

    @property
    def original_quantity_display(self):
        if not self.original_unit or not self.stock or not self.stock.product:
            return None
        try:
            # Use original_quantity directly instead of recalculating from quantity_in_base_units
            if self.original_quantity and self.original_quantity > 0:
                return {
                    'full_units': int(self.original_quantity),
                    'original_unit': self.original_unit.unit_name,
                    'remainder': 0,
                    'base_unit': self.stock.product.base_unit.unit_name
                }
        except Exception:
            pass
        return None

# --- Transaction & Request Models ---
class InventoryTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('restock', 'Restock (Inbound)'),
        ('sale', 'Sale (Outbound)'),
        ('wastage', 'Wastage (Outbound)'),
        ('store_to_barman', 'Transfer Store to Barman'),
        ('barman_to_store', 'Transfer Barman to Store'),
        ('adjustment_in', 'Adjustment In'),
        ('adjustment_out', 'Adjustment Out'),
    )
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Quantity in the specified 'transaction_unit'")
    transaction_unit = models.ForeignKey(ProductUnit, on_delete=models.PROTECT, related_name='transactions_using_unit')
    quantity_in_base_units = models.DecimalField(max_digits=10, decimal_places=2, default=0.00,
                                               help_text="Calculated quantity in the product's base unit. Positive for increases, negative for decreases.")
    transaction_date = models.DateTimeField(default=timezone.now)
    from_stock_main = models.ForeignKey(Stock, on_delete=models.SET_NULL, null=True, blank=True, related_name='outgoing_transactions', help_text="Main store stock affected (source)")
    to_stock_main = models.ForeignKey(Stock, on_delete=models.SET_NULL, null=True, blank=True, related_name='incoming_transactions', help_text="Main store stock affected (destination)")
    from_stock_barman = models.ForeignKey(BarmanStock, on_delete=models.SET_NULL, null=True, blank=True, related_name='outgoing_transactions_barman', help_text="Barman stock affected (source)")
    to_stock_barman = models.ForeignKey(BarmanStock, on_delete=models.SET_NULL, null=True, blank=True, related_name='incoming_transactions_barman', help_text="Barman stock affected (destination)")
    initiated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_transactions')
    price_at_transaction = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    class Meta:
        verbose_name = "Inventory Transaction"
        verbose_name_plural = "Inventory Transactions"
        ordering = ['-transaction_date']
    def __str__(self):
        return f"{self.transaction_type.title()} - {self.product.name} ({self.quantity} {self.transaction_unit.unit_name})"
    def clean(self):
        if self.quantity <= 0:
            raise ValidationError({'quantity': 'Quantity must be positive.'})
        
        # Skip quantity_in_base_units calculation for restock transactions that are handled by the view
        # This prevents double calculation when skip_stock_adjustment=True
        if hasattr(self, '_skip_quantity_calculation') and self._skip_quantity_calculation:
            print(f"[DEBUG] Skipping quantity_in_base_units calculation for transaction {self.id}")
            pass
        else:
            try:
                conversion_factor = self.product.get_conversion_factor(self.transaction_unit, self.product.base_unit)
                self.quantity_in_base_units = (self.quantity * conversion_factor).quantize(Decimal('0.01'))
                print(f"[DEBUG] Calculated quantity_in_base_units in clean(): {self.quantity_in_base_units}")
            except ValueError as e:
                raise ValidationError({'transaction_unit': f'Invalid unit conversion for this product: {e}'})
        
        if self.transaction_type in ['sale', 'wastage', 'adjustment_out']:
            if not (self.from_stock_main or self.from_stock_barman):
                raise ValidationError("For outbound transactions, a 'from' stock location must be specified.")
            if self.to_stock_main or self.to_stock_barman:
                raise ValidationError("For outbound transactions, a 'to' stock location should not be specified.")
            self.quantity_in_base_units = -abs(self.quantity_in_base_units)
            if self.transaction_type == 'sale' and self.price_at_transaction is None:
                raise ValidationError({'price_at_transaction': 'Sale price is required for sales transactions.'})
            
            print(f"[DEBUG] InventoryTransaction - Processing {self.transaction_type}: quantity_in_base_units={self.quantity_in_base_units}")
            if self.from_stock_main:
                print(f"[DEBUG] InventoryTransaction - Before deduction: calculated_base_units={self.from_stock_main.calculated_base_units}, input_quantity={self.from_stock_main.input_quantity}")
                self.from_stock_main.adjust_quantity(abs_quantity_in_base_units, base_unit_obj, is_addition=False)
                print(f"[DEBUG] InventoryTransaction - After deduction: calculated_base_units={self.from_stock_main.calculated_base_units}, input_quantity={self.from_stock_main.input_quantity}")
            elif self.from_stock_barman:
                self.from_stock_barman.adjust_quantity(abs_quantity_in_base_units, base_unit_obj, is_addition=False)
        elif self.transaction_type in ['restock', 'adjustment_in']:
            if not (self.to_stock_main or self.to_stock_barman):
                raise ValidationError("For inbound transactions, a 'to' stock location must be specified.")
            if self.from_stock_main or self.from_stock_barman:
                raise ValidationError("For inbound transactions, a 'from' stock location should not be specified.")
            self.quantity_in_base_units = abs(self.quantity_in_base_units)
            if self.transaction_type == 'restock' and self.price_at_transaction is None:
                raise ValidationError({'price_at_transaction': 'Purchase price is required for restock transactions.'})
        elif self.transaction_type == 'store_to_barman':
            if not (self.from_stock_main and self.to_stock_barman):
                raise ValidationError("For 'store_to_barman' transfer, both main store source and barman destination must be specified.")
            self.quantity_in_base_units = abs(self.quantity_in_base_units)
        elif self.transaction_type == 'barman_to_store':
            if not (self.from_stock_barman and self.to_stock_main):
                raise ValidationError("For 'barman_to_store' transfer, both barman source and main store destination must be specified.")
            self.quantity_in_base_units = abs(self.quantity_in_base_units)
    def save(self, *args, **kwargs):
        # Extract skip_stock_adjustment from kwargs before calling super().save()
        skip_stock_adjustment = kwargs.pop('skip_stock_adjustment', False)
        
        print(f"[DEBUG] InventoryTransaction.save() - skip_stock_adjustment: {skip_stock_adjustment}, self.pk: {self.pk}")
        
        # Calculate quantity_in_base_units ONCE here with proper decimal quantization
        # Only calculate if not skipping stock adjustment AND if this is a new transaction
        if not skip_stock_adjustment and not self.pk:
            conversion_factor = self.product.get_conversion_factor(self.transaction_unit, self.product.base_unit)
            self.quantity_in_base_units = (self.quantity * conversion_factor).quantize(Decimal('0.01'))
            print(f"[DEBUG] Calculated quantity_in_base_units in save(): {self.quantity_in_base_units}")
        else:
            print(f"[DEBUG] Skipping quantity_in_base_units calculation in save() - skip_stock_adjustment: {skip_stock_adjustment}, is_new: {not self.pk}")
        
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Skip stock adjustments if this is a restock transaction that was already handled by the restock view
        if skip_stock_adjustment:
            print(f"[DEBUG] Skipping stock adjustments due to skip_stock_adjustment=True")
            return
            
        # Calculate abs_quantity_in_base_units for stock adjustments
        is_addition = self.quantity_in_base_units > 0
        abs_quantity_in_base_units = abs(self.quantity_in_base_units)
        base_unit_obj = self.product.base_unit
        
        # Calculate original_quantity_delta for restock transactions
        original_quantity_delta = None
        if self.transaction_type in ['restock', 'adjustment_in']:
            # For restock, the original_quantity_delta is the quantity in the transaction unit
            original_quantity_delta = self.quantity
        
        if self.transaction_type in ['restock', 'adjustment_in']:
            if self.to_stock_main:
                # Update the stock's input_unit to match the transaction unit for restock
                if self.to_stock_main.product.input_unit != self.transaction_unit:
                    self.to_stock_main.product.input_unit = self.transaction_unit
                    self.to_stock_main.product.save(update_fields=['input_unit'])
                
                self.to_stock_main.adjust_quantity(abs_quantity_in_base_units, base_unit_obj, is_addition=True, original_quantity_delta=original_quantity_delta)
            elif self.to_stock_barman:
                self.to_stock_barman.adjust_quantity(abs_quantity_in_base_units, base_unit_obj, is_addition=True)
        elif self.transaction_type in ['sale', 'wastage', 'adjustment_out']:
            if self.from_stock_main:
                self.from_stock_main.adjust_quantity(abs_quantity_in_base_units, base_unit_obj, is_addition=False)
            elif self.from_stock_barman:
                self.from_stock_barman.adjust_quantity(abs_quantity_in_base_units, base_unit_obj, is_addition=False)
        elif self.transaction_type == 'store_to_barman':
            if self.from_stock_main and self.to_stock_barman:
                # For store_to_barman, we need to update original_quantity in the source stock
                # Calculate how many original units (boxes) are being transferred
                try:
                    conversion_factor = self.product.get_conversion_factor(self.transaction_unit, self.product.base_unit)
                    original_quantity_delta = (self.quantity).quantize(Decimal('0.01'))
                    self.from_stock_main.adjust_quantity(abs_quantity_in_base_units, base_unit_obj, is_addition=False, original_quantity_delta=original_quantity_delta)
                except ValueError:
                    # If conversion fails, just update base units without original_quantity
                    self.from_stock_main.adjust_quantity(abs_quantity_in_base_units, base_unit_obj, is_addition=False)
                self.to_stock_barman.adjust_quantity(abs_quantity_in_base_units, base_unit_obj, is_addition=True)
        elif self.transaction_type == 'barman_to_store':
            if self.from_stock_barman and self.to_stock_main:
                self.from_stock_barman.adjust_quantity(abs_quantity_in_base_units, base_unit_obj, is_addition=False)
                self.to_stock_main.adjust_quantity(abs_quantity_in_base_units, base_unit_obj, is_addition=True)

class InventoryRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('fulfilled', 'Fulfilled'),
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='requests')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Quantity requested in the specified 'request_unit'")
    request_unit = models.ForeignKey(ProductUnit, on_delete=models.PROTECT, related_name='requests_using_unit')
    # 🔧 NEW: Store both input and base unit quantities
    quantity_in_input_units = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Quantity in input units (e.g., cartons)")
    quantity_in_base_units = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Quantity in base units (e.g., bottles)")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    reached_status = models.BooleanField(default=False)
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_inventory_requests')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='incoming_inventory_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    responded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='responded_inventory_requests')
    notes = models.TextField(blank=True, null=True)
    class Meta:
        verbose_name = "Inventory Request"
        verbose_name_plural = "Inventory Requests"
        ordering = ['-created_at']
    def __str__(self):
        return f"Request for {self.quantity} {self.request_unit.unit_name} of {self.product.name} - Status: {self.status}"
    def clean(self):
        if self.quantity <= 0:
            raise ValidationError({'quantity': 'Quantity must be positive.'})
        
        # Check if there's sufficient stock available for this request
        if self.pk is None:  # Only check for new requests
            try:
                store_stock = Stock.objects.get(product=self.product, branch=self.branch)
                
                # Check if requested quantity exceeds available stock
                if store_stock.input_quantity and store_stock.input_quantity < self.quantity:
                    raise ValidationError({
                        'quantity': f'Insufficient stock available. Requested: {self.quantity} {self.request_unit.unit_name}, Available: {store_stock.input_quantity} {self.request_unit.unit_name}'
                    })
            except Stock.DoesNotExist:
                raise ValidationError({
                    'product': f'No stock available for {self.product.name} at {self.branch.name}'
                })
    
    def save(self, *args, **kwargs):
        print(f"[DEBUG] InventoryRequest.save() called for id={self.pk}, status={self.status}")
        original_status = None
        if self.pk:
            original_status = InventoryRequest.objects.get(pk=self.pk).status
        print(f"[DEBUG] original_status={original_status}, new status={self.status}")
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Prevent double execution by checking if we're already processing fulfillment
        if (original_status != 'fulfilled' and 
            self.status == 'fulfilled' and 
            not kwargs.get('_fulfilling', False) and
            not hasattr(self, '_processing_fulfillment')):
            
            # Set flag to prevent recursive calls
            self._processing_fulfillment = True
            print(f"[DEBUG] Entering transaction creation block for request id={self.pk}")
            try:
                store_stock = Stock.objects.get(product=self.product, branch=self.branch)
                
                # Calculate quantity in base units
                try:
                    conversion_factor = self.product.get_conversion_factor(self.request_unit, self.product.base_unit)
                    print(f"[DEBUG] Conversion factor: {self.quantity} {self.request_unit.unit_name} × {conversion_factor} = {self.quantity * conversion_factor}")
                    quantity_in_base_units = (self.quantity * conversion_factor).quantize(Decimal('0.01'))
                    print(f"[DEBUG] Converting {self.quantity} {self.request_unit.unit_name} to {quantity_in_base_units} {self.product.base_unit.unit_name}")
                except ValueError as e:
                    print(f"[ERROR] Conversion error: {e}")
                    # Fallback: assume 1:1 conversion
                    quantity_in_base_units = self.quantity
                    print(f"[DEBUG] Using fallback conversion: {quantity_in_base_units}")
                
                # Check if there's sufficient stock before allowing fulfillment
                # 🔧 FIXED: Use calculated_base_units instead of quantity_in_base_units
                available_stock = store_stock.calculated_base_units or 0
                if available_stock < quantity_in_base_units:
                    error_msg = f"Insufficient stock in main store. Available: {available_stock} {self.product.base_unit.unit_name}, Required: {quantity_in_base_units} {self.product.base_unit.unit_name}"
                    print(f"[ERROR] {error_msg}")
                    raise ValueError(error_msg)
                
                # Also check input_quantity to prevent over-fulfillment
                if store_stock.input_quantity and store_stock.input_quantity < self.quantity:
                    error_msg = f"Insufficient stock in input units. Available: {store_stock.input_quantity} {self.request_unit.unit_name}, Required: {self.quantity} {self.request_unit.unit_name}"
                    print(f"[ERROR] {error_msg}")
                    raise ValueError(error_msg)
                
                # Use only unique fields for get_or_create
                barman_stock, created = BarmanStock.objects.get_or_create(
                    stock=store_stock,
                    bartender=self.requested_by,
                    defaults={
                        'branch': self.branch,
                        'quantity_in_base_units': Decimal('0.00'),
                        'minimum_threshold_base_units': Decimal('0.00'),
                    }
                )
                # Update branch if needed
                if barman_stock.branch != self.branch:
                    barman_stock.branch = self.branch
                
                # 🔧 FIXED: Create transaction without saving to avoid automatic stock adjustment
                transaction = InventoryTransaction(
                    product=self.product,
                    transaction_type='store_to_barman',
                    quantity=self.quantity,
                    transaction_unit=self.request_unit,
                    from_stock_main=store_stock,
                    to_stock_barman=barman_stock,
                    initiated_by=self.responded_by,
                    notes=f"Fulfilled request #{self.pk} by {self.requested_by.username}.",
                    branch=self.branch,
                )
                # Set the quantity_in_base_units directly to avoid double calculation
                transaction.quantity_in_base_units = quantity_in_base_units
                transaction._skip_quantity_calculation = True
                # 🔧 FIXED: Don't save yet - save it only once later with proper stock adjustment
                
                # 🔧 FIXED: Only let the transaction handle stock updates - no manual updates
                try:
                    print(f"[DEBUG] Starting stock adjustment for request {self.pk}")
                    print(f"[DEBUG] Before adjustment - input_quantity: {store_stock.input_quantity}, calculated_base_units: {store_stock.calculated_base_units}")
                    print(f"[DEBUG] Request details - quantity: {self.quantity}, unit: {self.request_unit.unit_name}, base_units: {quantity_in_base_units}")
                    
                    # 🔧 FIXED: REMOVE direct barman stock update - let transaction handle ALL stock updates
                    # barman_stock.adjust_quantity() - REMOVED to prevent double addition
                    
                    print(f"[DEBUG] Barman stock will be updated by transaction only")
                    
                    # 🔧 FIXED: Let the transaction handle ALL stock updates (both main store AND barman stock)
                    # The transaction will call Stock.adjust_quantity() and BarmanStock.adjust_quantity() ONCE each
                    transaction.save(skip_stock_adjustment=False)
                    
                    # Refresh to confirm changes
                    store_stock.refresh_from_db()
                    print(f"[DEBUG] After transaction update - input_quantity: {store_stock.input_quantity}, calculated_base_units: {store_stock.calculated_base_units}")
                    
                    print(f"[DEBUG] Stock adjustment completed for request id={self.pk}")
                    print(f"[DEBUG] Final stock values - input_quantity: {store_stock.input_quantity}, calculated_base_units: {store_stock.calculated_base_units}")
                    
                except Exception as e:
                    print(f"[ERROR] Stock adjustment failed: {e}")
                    import traceback
                    traceback.print_exc()
                    # Fallback to transaction-based adjustment
                    transaction.save(skip_stock_adjustment=False)
                
                print(f"[DEBUG] InventoryTransaction created for request id={self.pk}")
                print(f"[DEBUG] Stock will be automatically updated by InventoryTransaction")
                self.responded_at = timezone.now()
                # Use direct database update to avoid recursive save() call
                InventoryRequest.objects.filter(pk=self.pk).update(responded_at=self.responded_at)
            except Stock.DoesNotExist:
                print(f"[ERROR] Main store stock not found for product {self.product.name} at branch {self.branch.name} during request fulfillment.")
            except Exception as e:
                print(f"[ERROR] Exception fulfilling request {self.pk}: {e}")
                import traceback
                traceback.print_exc()

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.contrib import admin

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
    @admin.display(description="Logged Object")
    def logged_object_display(self):
        if self.content_object:
            return str(self.content_object)
        if self.object_id and self.content_type:
            return f"{self.content_type.model.capitalize()} (ID: {self.object_id})"
        return "N/A"
    @admin.display(description="Details Summary")
    def action_details_summary(self):
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
