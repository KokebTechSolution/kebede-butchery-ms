from rest_framework import serializers
from .models import Menu, MenuSection, MenuItem

class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.category_name', read_only=True)

    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'description', 'price', 'item_type', 'category', 'category_name', 'is_available']

class MenuSectionSerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = MenuSection
        fields = ['id', 'name', 'items']

class MenuSerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = Menu
        fields = ['id', 'name', 'is_active', 'created_at', 'updated_at', 'items']
