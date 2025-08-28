from rest_framework import serializers
from .models import ItemType, Category, Product, Stock, InventoryTransaction, InventoryRequest
from branches.models import Branch
from decimal import Decimal
from django.db import transaction as db_transaction
from .models import BarmanStock, Stock, ProductMeasurement, ProductUnit


class BarmanStockSerializer(serializers.ModelSerializer):
    # The frontend expects this nested structure, so we'll provide it
    stock = serializers.SerializerMethodField()
    
    # Keep the direct fields for backward compatibility
    product_name = serializers.CharField(source='stock.product.name', read_only=True)
    product_id = serializers.IntegerField(source='stock.product.id', read_only=True)
    branch_name = serializers.CharField(source='stock.branch.name', read_only=True)
    branch_id = serializers.IntegerField(source='stock.branch.id', read_only=True)
    stock_id = serializers.IntegerField(source='stock.id', read_only=True)
    
    # Use the BarmanStock's own fields, not the stock's fields
    quantity_in_base_units = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    minimum_threshold_base_units = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    running_out = serializers.BooleanField(read_only=True)
    last_stock_update = serializers.DateTimeField(read_only=True)
    quantity_basic_unit = serializers.SerializerMethodField()
    original_quantity = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    original_unit = serializers.CharField(source='original_unit.unit_name', read_only=True)
    original_unit_id = serializers.IntegerField(source='original_unit.id', read_only=True)
    original_quantity_display = serializers.SerializerMethodField()
    
    # Add fields that the frontend expects
    calculated_base_units = serializers.DecimalField(source='quantity_in_base_units', max_digits=10, decimal_places=2, read_only=True)
    input_quantity = serializers.DecimalField(source='original_quantity', max_digits=10, decimal_places=2, read_only=True)

    def get_original_quantity_display(self, obj):
        # Show the original quantity in carton/box units (like manager adds)
        if obj.original_quantity and obj.original_unit:
            return f"{obj.original_quantity} {obj.original_unit.unit_name}"
        return "N/A"

    class Meta:
        model = BarmanStock
        fields = [
            'id',
            'stock',  # This will provide the nested structure the frontend expects
            'stock_id',
            'product_name',
            'product_id',
            'branch_name',
            'branch_id',
            'bartender',
            'bartender_id',
            'quantity_in_base_units',
            'minimum_threshold_base_units',
            'running_out',
            'last_stock_update',
            'quantity_basic_unit',
            'original_quantity',
            'original_unit',
            'original_unit_id',
            'original_quantity_display',
            'calculated_base_units',
            'input_quantity',
        ]
        read_only_fields = ['running_out']

    def get_quantity_basic_unit(self, obj):
        # Try to convert to the default sales unit for this product
        try:
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
        except Exception:
            pass
        # Fallback: just return the base units
        return obj.quantity_in_base_units

    def get_original_unit(self, obj):
        if obj.original_unit:
            return obj.original_unit.unit_name
        return None

    def get_stock(self, obj):
        """Return the stock object with nested product information that the frontend expects"""
        try:
            if obj.stock and obj.stock.product:
                return {
                    'id': obj.stock.id,
                    'product': {
                        'id': obj.stock.product.id,
                        'name': obj.stock.product.name,
                        'base_unit_price': obj.stock.product.base_unit_price,
                        'item_type': {
                            'id': obj.stock.product.item_type.id,
                            'type_name': obj.stock.product.item_type.type_name
                        } if obj.stock.product.item_type else None,
                        'category': {
                            'id': obj.stock.product.category.id,
                            'category_name': obj.stock.product.category.category_name
                        } if obj.stock.product.category else None,
                        'base_unit': {
                            'id': obj.stock.product.base_unit.id,
                            'unit_name': obj.stock.product.base_unit.unit_name
                        } if obj.stock.product.base_unit else None,
                        'input_unit': {
                            'id': obj.stock.product.input_unit.id,
                            'unit_name': obj.stock.product.input_unit.unit_name
                        } if obj.stock.product.input_unit else None,
                        'conversion_amount': obj.stock.product.conversion_amount,
                    } if obj.stock.product else None,
                    'branch': {
                        'id': obj.stock.branch.id,
                        'name': obj.stock.branch.name
                    } if obj.stock.branch else None,
                }
        except Exception as e:
            print(f"Error in get_stock: {e}")
            # Return a minimal structure instead of None
            return {
                'id': obj.stock.id if obj.stock else None,
                'product': {
                    'id': obj.stock.product.id if obj.stock and obj.stock.product else None,
                    'name': obj.stock.product.name if obj.stock and obj.stock.product else 'Unknown',
                    'conversion_amount': obj.stock.product.conversion_amount if obj.stock and obj.stock.product else None,
                } if obj.stock and obj.stock.product else None,
                'branch': {
                    'id': obj.stock.branch.id if obj.stock and obj.stock.branch else None,
                    'name': obj.stock.branch.name if obj.stock and obj.stock.branch else 'Unknown',
                } if obj.stock and obj.stock.branch else None,
            }

# Branch
class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'location']

# Item Type
class ItemTypeSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(source='get_type_name_display', read_only=True)
    is_food = serializers.BooleanField(read_only=True)
    is_beverage = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ItemType
        fields = ['id', 'type_name', 'display_name', 'description', 'is_food', 'is_beverage', 'created_at']
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
    display_name = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(default=True)
    sort_order = serializers.IntegerField(default=0)

    class Meta:
        model = Category
        fields = ['id', 'category_name', 'description', 'item_type', 'item_type_id', 'display_name', 'is_active', 'sort_order', 'created_at']

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
    
    # 🔧 NEW: Essential fields from Add Product form
    item_type = ItemTypeSerializer(read_only=True)
    item_type_id = serializers.PrimaryKeyRelatedField(queryset=ItemType.objects.all(), source='item_type', write_only=True)
    input_unit = ProductUnitSerializer(read_only=True)
    input_unit_id = serializers.PrimaryKeyRelatedField(queryset=ProductUnit.objects.all(), source='input_unit', write_only=True)

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
            # 🔧 NEW: Essential fields
            'item_type_id',
            'item_type',
            'input_unit_id',
            'input_unit',
            'conversion_amount',
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

    class Meta:
        model = Stock
        fields = [
            'id',
            'product',
            'product_id',
            'branch',
            'branch_id',
            # 🔧 NEW: Essential fields only
            'input_quantity',
            'calculated_base_units',
            'minimum_threshold_base_units',
        ]

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
            # 🔧 NEW: Added fields for input and base unit quantities
            'quantity_in_input_units',
            'quantity_in_base_units',
        ]

    def get_quantity_basic_unit(self, obj):
        # Calculate the quantity in base units using the product's conversion method
        try:
            if obj.product and obj.request_unit and obj.product.base_unit:
                # Use the product's conversion method to get the factor
                conversion_factor = obj.product.get_conversion_factor(obj.request_unit, obj.product.base_unit)
                # Convert the quantity to base units
                quantity_in_base_units = (obj.quantity * conversion_factor).quantize(Decimal('0.01'))
                return quantity_in_base_units
            else:
                return obj.quantity  # fallback if conversion not possible
        except Exception as e:
            print(f"Error converting quantity to base units: {e}")
            return obj.quantity  # fallback on error

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
    # 🔧 NEW: Essential fields from Add Product form
    item_type = ItemTypeSerializer(read_only=True)
    input_unit = ProductUnitSerializer(read_only=True)
    store_stocks = serializers.SerializerMethodField()

    def get_store_stocks(self, obj):
        # Create a simplified stock representation with only essential fields
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
                # 🔧 NEW: Only essential fields
                'input_quantity': stock.input_quantity,
                'input_quantity_with_unit': stock.input_quantity_with_unit,
                'calculated_base_units': stock.calculated_base_units,
                'calculated_base_units_with_unit': stock.calculated_base_units_with_unit,
                'minimum_threshold_base_units': stock.minimum_threshold_base_units,
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
            # 🔧 NEW: Essential fields only
            'item_type',
            'input_unit',
            'conversion_amount',
            'store_stocks',
            'created_at',
            'updated_at',
        ]
