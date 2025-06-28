from rest_framework import serializers
from .models import ItemType, Category, Product, InventoryTransaction


class ItemTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemType
        fields = '__all__'


class CategorySerializer(serializers.ModelSerializer):
    # Display item type name in the response
    item_type_name = serializers.CharField(source='item_type.type_name', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'category_name', 'item_type', 'item_type_name']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.category_name', read_only=True)
    item_type_name = serializers.CharField(source='category.item_type.type_name', read_only=True)
    total_bottles_in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'price_per_unit', 'uses_carton', 'bottles_per_carton',
            'carton_quantity', 'bottle_quantity', 'unit_quantity', 'minimum_threshold',
            'running_out', 'receipt_image', 'created_at', 'updated_at',
            'category_name', 'item_type_name', 'total_bottles_in_stock'
        ]

    def get_total_bottles_in_stock(self, obj):
        return obj.total_bottles_in_stock if obj.uses_carton else None

class InventoryTransactionSerializer(serializers.ModelSerializer):
    # Display product name in transaction list
    product_name = serializers.CharField(source='product.name', read_only=True)
    category_name = serializers.CharField(source='product.category.category_name', read_only=True)
    item_type_name = serializers.CharField(source='product.category.item_type.type_name', read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = [
            'id', 'product', 'product_name', 'category_name', 'item_type_name',
            'transaction_type', 'quantity', 'unit_type', 'transaction_date'
        ]
