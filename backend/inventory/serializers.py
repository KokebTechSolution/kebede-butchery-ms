from rest_framework import serializers
from .models import ItemType, Category, Product, Stock, InventoryTransaction, InventoryRequest
from branches.models import Branch
from decimal import Decimal
from django.db import transaction as db_transaction
from .models import BarmanStock, Stock, ProductMeasurement, ProductUnit


class BarmanStockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='stock.product.name', read_only=True)
    branch_name = serializers.CharField(source='stock.branch.name', read_only=True)
    stock_id = serializers.IntegerField(source='stock.id', read_only=True)
    quantity_basic_unit = serializers.SerializerMethodField()
    original_quantity = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    original_unit = serializers.SerializerMethodField()
    original_quantity_display = serializers.SerializerMethodField()

    def get_original_quantity_display(self, obj):
        display = obj.original_quantity_display
        if display:
            full_units = display['full_units']
            original_unit = display['original_unit']
            remainder = display['remainder']
            base_unit = display['base_unit']
            base_unit_str = base_unit if remainder == 1 else base_unit + 's'
            original_unit_str = original_unit if full_units == 1 else original_unit + 's'
            return f"{full_units} {original_unit_str} and {remainder} {base_unit_str}"
        return None

    class Meta:
        model = BarmanStock
        fields = [
            'id',
            'stock_id',
            'product_name',
            'branch_name',
            'bartender',
            'bartender_id',
            'quantity_in_base_units',
            'minimum_threshold_base_units',
            'running_out',
            'last_stock_update',
            'quantity_basic_unit',
            'original_quantity',
            'original_unit',
            'original_quantity_display',
        ]
        read_only_fields = ['running_out']

    def get_quantity_basic_unit(self, obj):
        # Try to convert to the default sales unit for this product
        product = obj.stock.product
        # Find the default sales unit measurement
        measurement = product.measurements.filter(is_default_sales_unit=True).first()
        if measurement:
            # Convert from base units to the default sales unit
            try:
                conversion_factor = product.get_conversion_factor(product.base_unit, measurement.from_unit)
                return float(obj.quantity_in_base_units) / float(conversion_factor)
            except Exception:
                pass
        # Fallback: just return the base units
        return obj.quantity_in_base_units

    def get_original_unit(self, obj):
        if obj.original_unit:
            return obj.original_unit.unit_name
        return None

# Branch
class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'location']

# Item Type
class ItemTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemType
        fields = ['id', 'type_name']
        extra_kwargs = {
            'id': {'read_only': True},
        }

# Category
class CategorySerializer(serializers.ModelSerializer):
    item_type = ItemTypeSerializer(read_only=True)
    item_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ItemType.objects.all(),
        source='item_type',
        write_only=True
    )

    class Meta:
        model = Category
        fields = ['id', 'category_name', 'item_type', 'item_type_id']

# ProductUnitSerializer must be defined before ProductSerializer
class ProductUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductUnit
        fields = ['id', 'unit_name', 'abbreviation', 'is_liquid_unit']

# Product
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)  # nested category for reading
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True)
    base_unit = ProductUnitSerializer(read_only=True)  # nested base unit for reading
    base_unit_id = serializers.PrimaryKeyRelatedField(queryset=ProductUnit.objects.all(), source='base_unit', write_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'base_unit_price',
            'base_unit_id',
            'base_unit',  # add for reading
            'category_id',
            'category',    # add for reading
            'created_at',
            'updated_at',
        ]

# Stock
class StockSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    branch = BranchSerializer(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source='branch', write_only=True
    )
    original_unit = ProductUnitSerializer(read_only=True)
    original_quantity_display = serializers.SerializerMethodField()

    def get_original_quantity_display(self, obj):
        display = obj.original_quantity_display
        if display:
            full_units = display['full_units']
            original_unit = display['original_unit']
            remainder = display['remainder']
            base_unit = display['base_unit']
            base_unit_str = base_unit if remainder == 1 else base_unit + 's'
            original_unit_str = original_unit if full_units == 1 else original_unit + 's'
            return f"{full_units} {original_unit_str} and {remainder} {base_unit_str}"
        return None

    class Meta:
        model = Stock
        fields = [
            'id',
            'product',
            'product_id',
            'branch',
            'branch_id',
            'quantity_in_base_units',  # ✅ This will be displayed
            'minimum_threshold_base_units',
            'running_out',
            'last_stock_update',
            'original_quantity',
            'original_unit',
            'original_quantity_display',
        ]
        read_only_fields = ['quantity_in_base_units', 'running_out']  # ✅ This protects it


# Inventory Transaction
class InventoryTransactionSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    branch = BranchSerializer(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source='branch', write_only=True
    )

    class Meta:
        model = InventoryTransaction
        fields = [
            'id',
            'product',
            'product_id',
            'transaction_type',
            'quantity',
            'transaction_date',
            'branch',
            'branch_id',
        ]

# Inventory Request
class InventoryRequestSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    branch = BranchSerializer(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source='branch', write_only=True
    )
    request_unit = ProductUnitSerializer(read_only=True)
    request_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductUnit.objects.all(), source='request_unit', write_only=True
    )
    quantity_basic_unit = serializers.SerializerMethodField()

    class Meta:
        model = InventoryRequest
        fields = [
            'id',
            'product',
            'product_id',
            'quantity',
            'status',
            'created_at',
            'branch',
            'branch_id',
            'reached_status',
            'request_unit',
            'request_unit_id',
            'quantity_basic_unit',
        ]

    def get_quantity_basic_unit(self, obj):
        # Find the measurement for this product and request_unit
        measurement = ProductMeasurement.objects.filter(
            product=obj.product,
            from_unit=obj.request_unit
        ).first()
        if measurement:
            return obj.quantity 
        return obj.quantity  # fallback if no measurement found

class ProductMeasurementSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product', write_only=True)
    from_unit_id = serializers.PrimaryKeyRelatedField(queryset=ProductUnit.objects.all(), source='from_unit', write_only=True)
    to_unit_id = serializers.PrimaryKeyRelatedField(queryset=ProductUnit.objects.all(), source='to_unit', write_only=True)
    from_unit_name = serializers.CharField(source='from_unit.unit_name', read_only=True)
    from_unit_id_read = serializers.IntegerField(source='from_unit.id', read_only=True)

    class Meta:
        model = ProductMeasurement
        fields = [
            'id',
            'product_id',
            'from_unit_id',
            'to_unit_id',
            'amount_per',
            'is_default_sales_unit',
            'created_at',
            'updated_at',
            'from_unit_name',
            'from_unit_id_read',
        ]
        extra_kwargs = {
            'product': {'read_only': True},
            'from_unit': {'read_only': True},
            'to_unit': {'read_only': True},
        }

# Product with Stock information
class ProductWithStockSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    base_unit = ProductUnitSerializer(read_only=True)
    store_stocks = serializers.SerializerMethodField()

    def get_store_stocks(self, obj):
        # Create a simplified stock representation to avoid circular imports
        stocks = obj.store_stocks.all()
        stock_data = []
        for stock in stocks:
            stock_data.append({
                'id': stock.id,
                'branch': {
                    'id': stock.branch.id,
                    'name': stock.branch.name,
                    'location': stock.branch.location
                },
                'quantity_in_base_units': stock.quantity_in_base_units,
                'minimum_threshold_base_units': stock.minimum_threshold_base_units,
                'running_out': stock.running_out,
                'last_stock_update': stock.last_stock_update,
                'original_quantity': stock.original_quantity,
                'original_unit': {
                    'id': stock.original_unit.id,
                    'unit_name': stock.original_unit.unit_name,
                    'abbreviation': stock.original_unit.abbreviation
                } if stock.original_unit else None,
                'original_quantity_display': stock.original_quantity_display
            })
        return stock_data

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'base_unit_price',
            'base_unit',
            'category',
            'store_stocks',
            'created_at',
            'updated_at',
        ]
