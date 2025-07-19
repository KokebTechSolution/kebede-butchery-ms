from rest_framework import serializers
from .models import MenuItem
from inventory.models import Category as InventoryCategory, ItemType
from inventory.serializers import CategorySerializer

class MenuItemSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'description', 'price', 'item_type', 
            'category', 'category_id', 'is_available', 'product',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def to_representation(self, instance):
        """Custom representation to include category object"""
        data = super().to_representation(instance)
        if instance.category:
            data['category'] = {
                'id': instance.category.id,
                'name': instance.category.category_name,
                'item_type': instance.category.item_type.type_name
            }
        return data

    def create(self, validated_data):
        """Create menu item with automatic category handling"""
        category_id = validated_data.pop('category_id', None)
        
        if category_id:
            try:
                # Try to get existing category
                category = InventoryCategory.objects.get(id=category_id)
                validated_data['category'] = category
            except InventoryCategory.DoesNotExist:
                # Create new category if it doesn't exist
                item_type_name = validated_data.get('item_type', 'food')
                item_type, created = ItemType.objects.get_or_create(
                    type_name=item_type_name,
                    defaults={'type_name': item_type_name}
                )
                
                # Create a default category name
                category_name = f"{item_type_name.title()} Category"
                category = InventoryCategory.objects.create(
                    category_name=category_name,
                    item_type=item_type
                )
                validated_data['category'] = category
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update menu item with automatic category handling"""
        category_id = validated_data.pop('category_id', None)
        
        if category_id:
            try:
                category = InventoryCategory.objects.get(id=category_id)
                validated_data['category'] = category
            except InventoryCategory.DoesNotExist:
                # Create new category if it doesn't exist
                item_type_name = validated_data.get('item_type', instance.item_type)
                item_type, created = ItemType.objects.get_or_create(
                    type_name=item_type_name,
                    defaults={'type_name': item_type_name}
                )
                
                category_name = f"{item_type_name.title()} Category"
                category = InventoryCategory.objects.create(
                    category_name=category_name,
                    item_type=item_type
                )
                validated_data['category'] = category
        
        return super().update(instance, validated_data)

class MenuItemCreateSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(required=False)

    class Meta:
        model = MenuItem
        fields = [
            'name', 'description', 'price', 'item_type', 
            'category_id', 'is_available', 'product'
        ]
