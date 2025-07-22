from rest_framework import serializers
from decimal import Decimal
from django.db import transaction as db_transaction # Renamed to avoid conflict with DRF's transaction

# Import all necessary models from your inventory app
from .models import (
    ItemType, Category, Product, Stock, InventoryTransaction, InventoryRequest,
    ProductUnit, ProductMeasurement, BarmanStock # Ensure ProductUnit and ProductMeasurement are imported
)
# Assuming Branch model is in 'branches' app
from branches.models import Branch
# Assuming User model is from Django's auth
from django.contrib.auth import get_user_model
User = get_user_model()


# --- Lookup Table Serializers ---

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'location']

class ItemTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemType
        fields = ['id', 'type_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class CategorySerializer(serializers.ModelSerializer):
    # Nested ItemType for read operations
    item_type = ItemTypeSerializer(read_only=True)
    # PrimaryKeyRelatedField for write operations (expecting item_type ID)
    item_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ItemType.objects.all(),
        source='item_type',
        write_only=True,
        help_text="ID of the ItemType this category belongs to."
    )

    class Meta:
        model = Category
        fields = ['id', 'category_name', 'description', 'item_type', 'item_type_id', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ProductUnitSerializer(serializers.ModelSerializer):
    """
    Serializer for the ProductUnit model.
    """
    class Meta:
        model = ProductUnit
        fields = ['id', 'unit_name', 'abbreviation', 'is_liquid_unit', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


# --- Product-related Serializers ---

class ProductMeasurementSerializer(serializers.ModelSerializer):
    """
    Serializer for ProductMeasurement (conversions between units for a product).
    """
    # Nested serializers for read-only display of unit names
    from_unit_name = serializers.CharField(source='from_unit.unit_name', read_only=True)
    to_unit_name = serializers.CharField(source='to_unit.unit_name', read_only=True)

    # PrimaryKeyRelatedFields for write operations (expecting unit IDs)
    from_unit = serializers.PrimaryKeyRelatedField(
        queryset=ProductUnit.objects.all(),
        help_text="ID of the unit being converted from (e.g., 'carton' ID)."
    )
    to_unit = serializers.PrimaryKeyRelatedField(
        queryset=ProductUnit.objects.all(),
        help_text="ID of the unit being converted to (e.g., 'bottle' ID)."
    )

    class Meta:
        model = ProductMeasurement
        fields = [
            'id', 'from_unit', 'from_unit_name', 'to_unit', 'to_unit_name',
            'amount_per', 'is_default_sales_unit', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    # Nested Category for read operations
    category = CategorySerializer(read_only=True)
    # PrimaryKeyRelatedField for write operations (expecting category ID)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        help_text="ID of the Category this product belongs to."
    )

    # Nested ProductUnit for read operations of the base_unit
    base_unit = ProductUnitSerializer(read_only=True)
    # PrimaryKeyRelatedField for write operations (expecting base_unit ID)
    base_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductUnit.objects.all(),
        source='base_unit',
        write_only=True,
        help_text="ID of the base unit for this product (e.g., 'bottle' ID, 'liter' ID).",
        allow_null=True,
        required=False
    )

    # Nested ProductMeasurementSerializer for displaying and writing conversions
    measurements = ProductMeasurementSerializer(many=True, required=False, help_text="List of unit conversions for this product.")

    base_unit_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'category', 'category_id',
            'base_unit', 'base_unit_id', 'base_unit_price',
            'volume_per_base_unit_ml', 'receipt_image', 'is_active',
            'measurements', # Include nested measurements
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        measurements_data = validated_data.pop('measurements', [])
        with db_transaction.atomic():
            product = Product.objects.create(**validated_data)
            for measurement_data in measurements_data:
                ProductMeasurement.objects.create(product=product, **measurement_data)
        return product

    def update(self, instance, validated_data):
        measurements_data = validated_data.pop('measurements', [])
        with db_transaction.atomic():
            # Update product fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            # Update nested measurements
            # Option 1: Delete all existing and recreate (simpler for small lists)
            instance.measurements.all().delete()
            for measurement_data in measurements_data:
                ProductMeasurement.objects.create(product=instance, **measurement_data)

            # Option 2: More complex, update existing, create new, delete missing
            # (Requires more logic, but avoids deleting/recreating if IDs are provided for updates)
            # For this example, Option 1 is used for simplicity.

        return instance


# --- Stock Serializers ---

class StockSerializer(serializers.ModelSerializer):
    # Nested Product for read operations
    product = ProductSerializer(read_only=True)
    # PrimaryKeyRelatedField for write operations (expecting product ID)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True,
        help_text="ID of the Product this stock entry is for."
    )

    # Nested Branch for read operations
    branch = BranchSerializer(read_only=True)
    # PrimaryKeyRelatedField for write operations (expecting branch ID)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        source='branch',
        write_only=True,
        help_text="ID of the Branch where this stock is located."
    )

    # Read-only field to show the name of the product's base unit
    base_unit_name = serializers.CharField(source='product.base_unit.unit_name', read_only=True)

    # Read-only field to display stock in user-friendly summary
    display_stock_summary = serializers.CharField(read_only=True) # This maps to the @property on the model

    class Meta:
        model = Stock
        fields = [
            'id', 'product', 'product_id', 'branch', 'branch_id',
            'quantity_in_base_units', 'base_unit_name',
            'minimum_threshold_base_units', 'running_out', 'last_stock_update',
            'display_stock_summary' # Include for API output
        ]
        read_only_fields = ['running_out', 'last_stock_update', 'display_stock_summary']


class BarmanStockSerializer(serializers.ModelSerializer):
    # Nested Product for read operations
    product = ProductSerializer(read_only=True)
    # PrimaryKeyRelatedField for write operations (expecting product ID)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True,
        help_text="ID of the Product this barman stock entry is for."
    )

    # Nested User for read operations (bartender)
    bartender = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True) # For creating/updating
    bartender_username = serializers.CharField(source='bartender.username', read_only=True) # For display

    # Nested Branch for read operations
    branch = BranchSerializer(read_only=True)
    # PrimaryKeyRelatedField for write operations (expecting branch ID)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        source='branch',
        write_only=True,
        help_text="ID of the Branch where this barman stock is located."
    )

    # Read-only field to show the name of the product's base unit
    base_unit_name = serializers.CharField(source='product.base_unit.unit_name', read_only=True)

    # Read-only field to display stock in user-friendly summary
    display_stock_summary = serializers.CharField(read_only=True) # This maps to the @property on the model

    class Meta:
        model = BarmanStock
        fields = [
            'id', 'product', 'product_id', 'bartender', 'bartender_username',
            'branch', 'branch_id',
            'quantity_in_base_units', 'base_unit_name',
            'minimum_threshold_base_units', 'running_out', 'last_stock_update',
            'display_stock_summary' # Include for API output
        ]
        read_only_fields = ['running_out', 'last_stock_update', 'display_stock_summary']


# --- Transaction & Request Serializers ---

class InventoryTransactionSerializer(serializers.ModelSerializer):
    # Nested Product for read operations
    product = ProductSerializer(read_only=True)
    # PrimaryKeyRelatedField for write operations (expecting product ID)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True,
        help_text="ID of the Product involved in the transaction."
    )

    # Nested ProductUnit for read operations (transaction_unit)
    transaction_unit = ProductUnitSerializer(read_only=True)
    # PrimaryKeyRelatedField for write operations (expecting unit ID)
    transaction_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductUnit.objects.all(),
        source='transaction_unit',
        write_only=True,
        help_text="ID of the unit used for this transaction (e.g., 'carton' ID, 'shot' ID)."
    )

    # Nested User for read operations (initiated_by)
    initiated_by_username = serializers.CharField(source='initiated_by.username', read_only=True)
    # PrimaryKeyRelatedField for write operations (expecting user ID)
    initiated_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False, allow_null=True, # Allow null if system-generated or no user
        help_text="ID of the User who initiated this transaction."
    )

    # Nested Stock/BarmanStock for read operations
    from_stock_main_id = serializers.IntegerField(source='from_stock_main.id', read_only=True)
    to_stock_main_id = serializers.IntegerField(source='to_stock_main.id', read_only=True)
    from_stock_barman_id = serializers.IntegerField(source='from_stock_barman.id', read_only=True)
    to_stock_barman_id = serializers.IntegerField(source='to_stock_barman.id', read_only=True)

    # For write operations, accept IDs for stock locations
    from_stock_main = serializers.PrimaryKeyRelatedField(queryset=Stock.objects.all(), required=False, allow_null=True, write_only=True)
    to_stock_main = serializers.PrimaryKeyRelatedField(queryset=Stock.objects.all(), required=False, allow_null=True, write_only=True)
    from_stock_barman = serializers.PrimaryKeyRelatedField(queryset=BarmanStock.objects.all(), required=False, allow_null=True, write_only=True)
    to_stock_barman = serializers.PrimaryKeyRelatedField(queryset=BarmanStock.objects.all(), required=False, allow_null=True, write_only=True)


    class Meta:
        model = InventoryTransaction
        fields = [
            'id', 'product', 'product_id', 'transaction_type',
            'quantity', 'transaction_unit', 'transaction_unit_id',
            'quantity_in_base_units', # Read-only, calculated by model
            'transaction_date',
            'from_stock_main', 'from_stock_main_id', 'to_stock_main', 'to_stock_main_id',
            'from_stock_barman', 'from_stock_barman_id', 'to_stock_barman', 'to_stock_barman_id',
            'initiated_by', 'initiated_by_username', 'price_at_transaction', 'notes'
        ]
        read_only_fields = ['quantity_in_base_units', 'transaction_date']


class InventoryRequestSerializer(serializers.ModelSerializer):
    # Nested Product for read operations
    product = ProductSerializer(read_only=True)
    # PrimaryKeyRelatedField for write operations (expecting product ID)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True,
        help_text="ID of the Product being requested."
    )

    # Nested ProductUnit for read operations (request_unit)
    request_unit = ProductUnitSerializer(read_only=True)
    # PrimaryKeyRelatedField for write operations (expecting unit ID)
    request_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductUnit.objects.all(),
        source='request_unit',
        write_only=True,
        help_text="ID of the unit in which the quantity is requested (e.g., 'carton' ID, 'bottle' ID)."
    )

    # Nested User for read operations (requested_by, responded_by)
    requested_by_username = serializers.CharField(source='requested_by.username', read_only=True)
    responded_by_username = serializers.CharField(source='responded_by.username', read_only=True)

    # Nested Branch for read operations
    branch = BranchSerializer(read_only=True)
    # PrimaryKeyRelatedField for write operations (expecting branch ID)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        source='branch',
        write_only=True,
        help_text="ID of the Branch making the request."
    )

    class Meta:
        model = InventoryRequest
        fields = [
            'id', 'product', 'product_id', 'quantity', 'request_unit', 'request_unit_id',
            'status', 'requested_by', 'requested_by_username', 'branch', 'branch_id',
            'created_at', 'responded_at', 'responded_by', 'responded_by_username', 'notes'
        ]
        read_only_fields = ['status', 'created_at', 'responded_at', 'responded_by', 'responded_by_username']