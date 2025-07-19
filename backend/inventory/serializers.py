from rest_framework import serializers
from django.db import transaction
from django.db.models import QuerySet
from typing import TYPE_CHECKING, cast

if TYPE_CHECKING:
    from .models import ItemType, Category, Product, Stock, StockUnit, InventoryTransaction, InventoryRequest, UnitConversion, BarmanStock
    from branches.models import Branch

from .models import (
    ItemType, Category, Product, Stock, StockUnit,
    InventoryTransaction, InventoryRequest, UnitConversion, BarmanStock
)
from branches.models import Branch
from decimal import Decimal

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


# Product
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), 
        source='category', 
        write_only=True
    )
    available_units = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'category_id', 'base_unit', 'price_per_unit', 'receipt_image', 'created_at', 'updated_at', 'available_units']

    def get_available_units(self, obj):
        """Get available units for this product based on base unit and conversions"""
        available_units = [obj.base_unit]  # Always include base unit
        
        # Get unit conversions for this product
        conversions = obj.conversions.all()
        
        # Add units that this product can be converted to
        for conversion in conversions:
            if conversion.from_unit == obj.base_unit and conversion.to_unit not in available_units:
                available_units.append(conversion.to_unit)
            elif conversion.to_unit == obj.base_unit and conversion.from_unit not in available_units:
                available_units.append(conversion.from_unit)
        
        # Add common units that are typically available for all products
        common_units = ['unit', 'shot']
        for unit in common_units:
            if unit not in available_units:
                available_units.append(unit)
        
        return available_units


# Unit Conversion
class UnitConversionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitConversion
        fields = ['id', 'product', 'from_unit', 'to_unit', 'multiplier']


# StockUnit
class StockUnitSerializer(serializers.ModelSerializer):
    stock_id = serializers.PrimaryKeyRelatedField(
        queryset=Stock.objects.all(), 
        source='stock', 
        write_only=True
    )

    class Meta:
        model = StockUnit
        fields = [
            'id', 'stock_id', 'unit_type', 'quantity'
        ]


# Stock
class StockSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), 
        source='product', 
        write_only=True
    )
    branch = BranchSerializer(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), 
        source='branch', 
        write_only=True
    )
    units = StockUnitSerializer(many=True, read_only=True, source='units')

    class Meta:
        model = Stock
        fields = ['id', 'product', 'product_id', 'branch', 'branch_id', 'minimum_threshold', 'running_out', 'units']


# Inventory Transaction
class InventoryTransactionSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), 
        source='product', 
        write_only=True
    )
    branch = BranchSerializer(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), 
        source='branch', 
        write_only=True
    )

    class Meta:
        model = InventoryTransaction
        fields = [
            'id', 'product', 'product_id', 'transaction_type', 'quantity',
            'unit_type', 'transaction_date', 'branch', 'branch_id'
        ]

    def create(self, validated_data):
        product = validated_data['product']
        branch = validated_data['branch']
        unit_type = validated_data['unit_type']
        quantity = Decimal(validated_data['quantity'])
        transaction_type = validated_data['transaction_type']

        with transaction.atomic():
            txn = InventoryTransaction.objects.create(**validated_data)

            # Get or create Stock and StockUnit
            stock, _ = Stock.objects.get_or_create(product=product, branch=branch)
            stock_unit, _ = StockUnit.objects.select_for_update().get_or_create(
                stock=stock, unit_type=unit_type,
                defaults={'quantity': 0}
            )

            sign = Decimal('1') if transaction_type == 'restock' else Decimal('-1')
            stock_unit.quantity = max(Decimal('0'), stock_unit.quantity + (sign * quantity))
            stock_unit.save()

            return txn


# Inventory Request
class InventoryRequestSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), 
        source='product', 
        write_only=True
    )
    branch = BranchSerializer(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), 
        source='branch', 
        write_only=True
    )

    class Meta:
        model = InventoryRequest
        fields = [
            'id', 'product', 'product_id', 'quantity', 'unit_type', 'status',
            'created_at', 'branch', 'branch_id', 'reached_status'
        ]


# Barman Stock
class BarmanStockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='stock.product.name', read_only=True)
    branch_name = serializers.CharField(source='stock.branch.name', read_only=True)
    stock_id = serializers.IntegerField(source='stock.id', read_only=True)
    base_unit = serializers.CharField(source='stock.product.base_unit', read_only=True)

    class Meta:
        model = BarmanStock
        fields = [
            'id', 'stock_id', 'product_name', 'branch_name', 'bartender',
            'carton_quantity', 'bottle_quantity', 'litre_quantity', 
            'unit_quantity', 'shot_quantity', 'base_unit',
            'minimum_threshold', 'running_out'
        ]
        read_only_fields = ['running_out']
