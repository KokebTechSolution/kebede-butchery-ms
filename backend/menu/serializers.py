from rest_framework import serializers
from .models import MenuItem
from inventory.models import Product, Category as InventoryCategory  # Make sure this is the right import
from .models import Menu, MenuSection, MenuItem, MenuCategory


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_info = serializers.SerializerMethodField()
    is_running_out = serializers.SerializerMethodField()
    
    # Explicit foreign key field for product
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), required=False, allow_null=True)

    class Meta:
        model = MenuItem
        fields = [
            'id',
            'name',
            'description',
            'price',
            'item_type',
            'category',
            'category_name',
            'is_available',
            'product',
            'stock_info',
            'is_running_out',
            'created_at',
            'updated_at',
        ]

    def get_stock_info(self, obj):
        branch_id = self.context.get('branch_id')
        if not branch_id:
            return None

        stock = obj.get_stock_for_branch(branch_id)
        if not stock:
            return None

        return {
            'quantity_in_base_units': stock.quantity_in_base_units,
            'original_quantity': stock.original_quantity,
            'original_unit': stock.original_unit.unit_name if stock.original_unit else None,
            'running_out': stock.running_out,
        }

    def get_is_running_out(self, obj):
        branch_id = self.context.get('branch_id')
        if not branch_id:
            return None
        return obj.is_running_out(branch_id)

    def create(self, validated_data):
        # Simply create the menu item with the provided data
        # The product field can be null for food items
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Simply update the menu item with the provided data
        return super().update(instance, validated_data)

class MenuSectionSerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = MenuSection
        fields = ['id', 'name', 'items', 'created_at', 'updated_at']

class MenuSerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = Menu
        fields = ['id', 'name', 'is_active', 'created_at', 'updated_at', 'items']

class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ['id', 'name']
