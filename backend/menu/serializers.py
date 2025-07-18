from rest_framework import serializers
from .models import MenuItem
from inventory.models import Product, Category as InventoryCategory  # Make sure this is the right import
from .models import Menu, MenuSection, MenuItem, MenuCategory


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_info = serializers.SerializerMethodField()
    is_running_out = serializers.SerializerMethodField()
    
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        allow_null=True,
        required=False
    )

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
            'cartons': stock.carton_quantity,
            'bottles': stock.bottle_quantity,
            'units': stock.unit_quantity,
        }

    def get_is_running_out(self, obj):
        branch_id = self.context.get('branch_id')
        if not branch_id:
            return None
        return obj.is_running_out(branch_id)

    def create(self, validated_data):
        product = validated_data.pop('product', None)
        menu_category = validated_data.get('category')

        if product is None:
            if menu_category is None:
                raise serializers.ValidationError({
                    'category': 'Category is required to create a new product.'
                })

            # Use the correct field name here, either `category_name` or `name`
            try:
                inventory_category = InventoryCategory.objects.get(category_name=menu_category.name)
            except InventoryCategory.DoesNotExist:
                raise serializers.ValidationError({
                    'category': f'No matching inventory category found for "{menu_category.name}"'
                })

            product_name = validated_data.get('name')
            product_price_per_unit = validated_data.get('price')  

            product = Product.objects.create(
                name=product_name,
                category=inventory_category,
                price_per_unit=product_price_per_unit,
            
                # Add any other mandatory Product fields here with defaults if needed
            )

        validated_data['product'] = product
        return super().create(validated_data)

    def update(self, instance, validated_data):
        product = validated_data.pop('product', None)
        menu_category = validated_data.get('category', instance.category)

        if product is None and instance.product is None:
            if menu_category is None:
                raise serializers.ValidationError({
                    'category': 'Category is required to create a new product.'
                })

            try:
                inventory_category = InventoryCategory.objects.get(category_name=menu_category.name)
            except InventoryCategory.DoesNotExist:
                raise serializers.ValidationError({
                    'category': f'No matching inventory category found for "{menu_category.name}"'
                })

            product_name = validated_data.get('name', instance.name)
            product_price = validated_data.get('price', instance.price)

            product = Product.objects.create(
                name=product_name,
                category=inventory_category,
                price=product_price,
                # Add any other mandatory Product fields here with defaults if needed
            )
            validated_data['product'] = product
        elif product is not None:
            validated_data['product'] = product

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
