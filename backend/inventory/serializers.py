from rest_framework import serializers
from .models import ItemType, Category, Product, Stock, InventoryTransaction, InventoryRequest
from branches.models import Branch
from decimal import Decimal
from django.db import transaction as db_transaction
from .models import BarmanStock, Stock


class BarmanStockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='stock.product.name', read_only=True)
    branch_name = serializers.CharField(source='stock.branch.name', read_only=True)
    stock_id = serializers.IntegerField(source='stock.id', read_only=True)

    class Meta:
        model = BarmanStock
        fields = [
            'id',
            'stock_id',         # helpful for debugging or tracking
            'product_name',
            'branch_name',
            'bartender',
            'bartender_id',
            'carton_quantity',
            'bottle_quantity',
            'unit_quantity',
            'minimum_threshold',
            'running_out',
        ]
        read_only_fields = ['running_out']
    def save(self, *args, **kwargs):

        self.running_out = self.bottle_quantity < self.minimum_threshold
        super().save(*args, **kwargs)
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
        source='item_type',  # maps to item_type field in model
        write_only=True
    )

    class Meta:
        model = Category
        fields = ['id', 'category_name', 'item_type', 'item_type_id']

# Product
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'category',
            'category_id',
            'price_per_unit',
            'uses_carton',
            'bottles_per_carton',
            'receipt_image',
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
    total_carton_price = serializers.SerializerMethodField()

    def get_total_carton_price(self, obj):
        product = obj.product
        if product.uses_carton and product.bottles_per_carton and product.price_per_unit:
            return float(obj.carton_quantity * product.bottles_per_carton * product.price_per_unit)
        elif not product.uses_carton and product.price_per_unit:
            return float(obj.bottle_quantity * product.price_per_unit)
        return 0.0

    class Meta:
        model = Stock
        fields = [
            'id',
            'product',
            'product_id',
            'branch',
            'branch_id',
            'carton_quantity',
            'bottle_quantity',
            'unit_quantity',
            'minimum_threshold',
            'running_out',
            'total_carton_price',
        ]

# Inventory Transaction (✔️ Enhanced with carton-to-bottle logic)
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
            'unit_type',
            'transaction_date',
            'branch',
            'branch_id',
        ]

    def create(self, validated_data):
        user = self.context['request'].user if self.context.get('request') else None

        with db_transaction.atomic():
            inventory_transaction = InventoryTransaction.objects.create(**validated_data)

            product = validated_data['product']
            branch = validated_data['branch']
            qty = Decimal(validated_data['quantity'])
            unit_type = validated_data['unit_type']
            txn_type = validated_data['transaction_type']

            bottles_per_carton = product.bottles_per_carton or 0
            bottle_equivalent = qty * bottles_per_carton

            stock, created = Stock.objects.select_for_update().get_or_create(
                product=product,
                branch=branch,
                defaults={
                    'carton_quantity': Decimal('0.00'),
                    'bottle_quantity': Decimal('0.00'),
                    'unit_quantity': Decimal('0.00'),
                    'minimum_threshold': Decimal('0.00'),
                }
            )

            # Determine + or - based on transaction type
            if txn_type == 'restock':
                sign = Decimal('1.00')
            elif txn_type in ['sale', 'wastage']:
                sign = Decimal('-1.00')
            else:
                sign = Decimal('0.00')

            # Apply update
            if unit_type == 'carton':
                stock.carton_quantity += sign * qty
                stock.bottle_quantity += sign * bottle_equivalent
            elif unit_type == 'bottle':
                stock.bottle_quantity += sign * qty
            elif unit_type == 'unit':
                stock.unit_quantity += sign * qty

            # Ensure non-negative values
            stock.carton_quantity = max(stock.carton_quantity, Decimal('0.00'))
            stock.bottle_quantity = max(stock.bottle_quantity, Decimal('0.00'))
            stock.unit_quantity = max(stock.unit_quantity, Decimal('0.00'))

            stock.save()

        return inventory_transaction

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

    class Meta:
        model = InventoryRequest
        fields = [
            'id',
            'product',
            'product_id',
            'quantity',
            'unit_type',
            'status',
            'created_at',
            'branch',
            'branch_id',
            'reached_status',
        ]
