from rest_framework import serializers
from .models import ItemType, Category, Product, Sale, StockMovement

class ItemTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemType
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    item_type_name = serializers.CharField(source='item_type.type_name', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'category_name', 'item_type', 'item_type_name']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.category_name', read_only=True)
    item_type_name = serializers.CharField(source='category.item_type.type_name', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

class SaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sale
        fields = '__all__'

class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = '__all__'
