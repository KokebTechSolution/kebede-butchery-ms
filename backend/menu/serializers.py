from rest_framework import serializers
from .models import Menu, MenuSection, MenuItem, MenuCategory


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_info = serializers.SerializerMethodField()
    is_running_out = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'description', 'price', 'item_type',
            'category', 'category_name', 'is_available',
            'created_at', 'updated_at',
            'stock_info', 'is_running_out'
        ]

    def get_stock_info(self, obj):
        """
        Returns carton/bottle/unit quantity info from stock for the given branch (if available).
        Requires context['branch_id'] to be passed.
        """
        branch_id = self.context.get('branch_id')
        if not branch_id:
            return None

        stock = obj.get_stock_for_branch(branch_id)
        if not stock:
            return None

        return {
            'cartons': stock.carton_quantity,
            'bottles': stock.bottle_quantity,
            'units': stock.unit_quantity,
        }

    def get_is_running_out(self, obj):
        branch_id = self.context.get('branch_id')
        if not branch_id:
            return None
        return obj.is_running_out(branch_id)
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
