# products/serializers.py

from rest_framework import serializers
from .models import Product, ItemType

class ItemTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemType
        fields = '__all__'
class LowStockProductSerializer(serializers.ModelSerializer):
    class Meta:
        
        model = Product
        fields = ['id', 'name', 'stock_qty', 'branch_id', 'expiration_date']

class ProductSerializer(serializers.ModelSerializer):
    type = ItemTypeSerializer(read_only=True)
    type_id = serializers.PrimaryKeyRelatedField(
        queryset=ItemType.objects.all(), source='type', write_only=True
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'type', 'type_id',
            'unit', 'price_per_unit', 'stock_qty',
            'branch_id', 'is_active', 'created_at', 'expiration_date'
        ]
