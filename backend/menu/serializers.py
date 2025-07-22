from rest_framework import serializers
from decimal import Decimal # Import Decimal
from django.db import transaction # Import transaction for atomicity in create/update

# Make sure these imports correctly point to your inventory app's models
from inventory.models import Product, Category as InventoryCategory, Stock, ProductUnit, BarmanStock

# Assuming these are your menu app's models
from .models import Menu, MenuSection, MenuItem, MenuCategory


# --- Helper Serializer for ProductUnit (used for nested fields if needed) ---
# It's good practice to have a serializer for ProductUnit if you want to
# display/select units.
class ProductUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductUnit
        fields = ['id', 'unit_name', 'abbreviation'] # Or all fields if preferred

# --- MenuCategory Serializer (Remains simple) ---
class MenuCategorySerializer(serializers.ModelSerializer):
    # If you want to show the linked InventoryCategory name
    inventory_category_name = serializers.CharField(source='inventory_category.category_name', read_only=True)

    class Meta:
        model = MenuCategory
        fields = ['id', 'name', 'inventory_category', 'inventory_category_name']


# --- MenuItem Serializer ---
class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    # New: This will return a user-friendly string summarizing stock
    stock_summary = serializers.SerializerMethodField()
    
    # This will directly return the boolean from the Stock model
    is_running_out = serializers.SerializerMethodField()

    # When creating/updating a MenuItem, you can either link to an existing Product
    # or provide details to create a new Product.
    # If providing details for a new product, these fields become required.
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        allow_null=True,
        required=False, # Make it optional if product can be created via MenuItem
        write_only=True # Don't send the full Product object back when reading
    )

    # Fields to create a new Product if 'product' is not provided
    new_product_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_product_description = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_product_base_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductUnit.objects.all(),
        write_only=True, required=False, allow_null=True # Required if new product, validated in create/update
    )
    new_product_base_unit_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, write_only=True, required=False, allow_null=True
    )
    new_product_volume_per_base_unit_ml = serializers.DecimalField(
        max_digits=10, decimal_places=2, write_only=True, required=False, allow_null=True
    )
    new_product_receipt_image = serializers.ImageField(write_only=True, required=False, allow_null=True)


    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'description', 'price', 'item_type', 'category', 'category_name',
            'is_available', 'product', # 'product' is write-only here
            'stock_summary', 'is_running_out',
            'created_at', 'updated_at',
            # New fields for creating a product through MenuItem
            'new_product_name', 'new_product_description', 'new_product_base_unit_id',
            'new_product_base_unit_price', 'new_product_volume_per_base_unit_ml',
            'new_product_receipt_image'
        ]
        read_only_fields = ['created_at', 'updated_at', 'category_name', 'stock_summary', 'is_running_out']

    def get_stock_summary(self, obj):
        """
        Returns a human-readable summary of the stock for the MenuItem's product
        at the specified branch (from context).
        """
        branch_id = self.context.get('branch_id')
        if not branch_id or not obj.product:
            return "N/A" # No branch or no linked product

        stock = obj.get_stock_for_branch(branch_id)
        if stock:
            # Leverage the display_stock_summary method from the Stock model
            return stock.display_stock_summary()
        return "Not in Stock" # Or "Stock not found for branch"

    def get_is_running_out(self, obj):
        """
        Checks if the MenuItem's product is running out of stock at the specified branch.
        """
        branch_id = self.context.get('branch_id')
        if not branch_id or not obj.product:
            return False # Cannot determine if running out without branch or product

        stock = obj.get_stock_for_branch(branch_id)
        if stock:
            return stock.running_out # Direct access to the `running_out` field
        return False # Not in stock implies not running out, but can be adjusted

    @transaction.atomic
    def create(self, validated_data):
        product_instance = validated_data.pop('product', None)
        menu_category = validated_data.pop('category', None)

        # Handle new product creation if no existing product is linked
        if product_instance is None:
            new_product_name = validated_data.pop('new_product_name', None)
            new_product_description = validated_data.pop('new_product_description', None)
            new_product_base_unit_id = validated_data.pop('new_product_base_unit_id', None)
            new_product_base_unit_price = validated_data.pop('new_product_base_unit_price', None)
            new_product_volume_per_base_unit_ml = validated_data.pop('new_product_volume_per_base_unit_ml', None)
            new_product_receipt_image = validated_data.pop('new_product_receipt_image', None)

            # Validate that necessary fields for a new Product are provided
            if not all([new_product_name, new_product_base_unit_id, new_product_base_unit_price is not None, new_product_volume_per_base_unit_ml is not None]):
                raise serializers.ValidationError({
                    'new_product_fields': 'When creating a new Product, new_product_name, new_product_base_unit_id, new_product_base_unit_price, and new_product_volume_per_base_unit_ml are required.'
                })

            # Handle MenuCategory creation/linking as before
            # Assuming category_name will be provided in request data or menu_category is already an object
            category_name_from_request = self.context.get('request').data.get('category_name') if self.context.get('request') else None
            inventory_category = None

            if menu_category: # If MenuCategory object is provided directly
                inventory_category = menu_category.inventory_category
            elif category_name_from_request: # Try to find/create MenuCategory from name
                try:
                    menu_category = MenuCategory.objects.get(name=category_name_from_request)
                    inventory_category = menu_category.inventory_category
                except MenuCategory.DoesNotExist:
                    # If MenuCategory doesn't exist, it implies we also need to find/create InventoryCategory
                    try:
                        inventory_category = InventoryCategory.objects.get(category_name=category_name_from_request)
                    except InventoryCategory.DoesNotExist:
                        # Decide here: Auto-create InventoryCategory or raise error?
                        # Auto-creating InventoryCategory might be risky without more info.
                        # For now, let's raise an error.
                        raise serializers.ValidationError({
                            'category': f'No matching inventory category found for "{category_name_from_request}". Please create it first.'
                        })
                    menu_category = MenuCategory.objects.create(
                        name=category_name_from_request,
                        inventory_category=inventory_category
                    )
            
            if menu_category is None:
                raise serializers.ValidationError({'category': 'Category is required for MenuItem.'})
            
            # Create the new Product instance
            product_instance = Product.objects.create(
                name=new_product_name,
                description=new_product_description,
                category=inventory_category, # Link to InventoryCategory
                base_unit=new_product_base_unit_id, # This is a ProductUnit object
                base_unit_price=new_product_base_unit_price,
                volume_per_base_unit_ml=new_product_volume_per_base_unit_ml,
                receipt_image=new_product_receipt_image,
                # Add any other mandatory Product fields here with defaults if needed
                is_active=True # Default for new products
            )
            validated_data['category'] = menu_category # Ensure category is set for MenuItem

        # If an existing product_instance was linked, or a new one was just created
        validated_data['product'] = product_instance
        
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        product_instance = validated_data.pop('product', None)
        menu_category = validated_data.get('category', instance.category) # Get category if provided, else keep existing

        # Logic for updating or creating product if 'product' field is explicitly passed
        if product_instance is not None:
            # If a new product is linked, simply update the MenuItem's product field
            validated_data['product'] = product_instance
        elif instance.product is None: # If no product was linked initially
            # Allow creating a new product via MenuItem update if needed
            new_product_name = validated_data.pop('new_product_name', None)
            new_product_description = validated_data.pop('new_product_description', None)
            new_product_base_unit_id = validated_data.pop('new_product_base_unit_id', None)
            new_product_base_unit_price = validated_data.pop('new_product_base_unit_price', None)
            new_product_volume_per_base_unit_ml = validated_data.pop('new_product_volume_per_base_unit_ml', None)
            new_product_receipt_image = validated_data.pop('new_product_receipt_image', None)

            # If any new_product field is provided, assume intent to create a new product
            if any([new_product_name, new_product_description, new_product_base_unit_id,
                    new_product_base_unit_price is not None, new_product_volume_per_base_unit_ml is not None,
                    new_product_receipt_image]):
                
                if not all([new_product_name, new_product_base_unit_id, new_product_base_unit_price is not None, new_product_volume_per_base_unit_ml is not None]):
                    raise serializers.ValidationError({
                        'new_product_fields': 'When creating a new Product, new_product_name, new_product_base_unit_id, new_product_base_unit_price, and new_product_volume_per_base_unit_ml are required.'
                    })

                # Resolve InventoryCategory for the new Product
                inventory_category = None
                if menu_category and menu_category.inventory_category:
                    inventory_category = menu_category.inventory_category
                elif self.context.get('request') and self.context['request'].data.get('category_name'):
                     category_name_from_request = self.context['request'].data.get('category_name')
                     try:
                         # Attempt to find MenuCategory by name, and then its InventoryCategory
                         found_menu_category = MenuCategory.objects.get(name=category_name_from_request)
                         inventory_category = found_menu_category.inventory_category
                     except MenuCategory.DoesNotExist:
                         raise serializers.ValidationError({'category_name': f'No matching MenuCategory found for "{category_name_from_request}".'})
                else:
                    raise serializers.ValidationError({'category': 'A category is required to create a new product.'})

                # Create the new Product instance
                product_instance = Product.objects.create(
                    name=new_product_name,
                    description=new_product_description,
                    category=inventory_category,
                    base_unit=new_product_base_unit_id,
                    base_unit_price=new_product_base_unit_price,
                    volume_per_base_unit_ml=new_product_volume_per_base_unit_ml,
                    receipt_image=new_product_receipt_image,
                    is_active=True
                )
                validated_data['product'] = product_instance
        # If no 'product' was provided and no new_product fields, it means the product link remains unchanged.

        # Update MenuItem's category if provided
        if menu_category:
            validated_data['category'] = menu_category

        return super().update(instance, validated_data)


# --- MenuSection Serializer ---
class MenuSectionSerializer(serializers.ModelSerializer):
    # Pass branch_id to MenuItemSerializer context for stock info
    items = serializers.SerializerMethodField()

    class Meta:
        model = MenuSection
        fields = ['id', 'name', 'items', 'created_at', 'updated_at']

    def get_items(self, obj):
        # Forward the branch_id from the MenuSection's context to MenuItemSerializer
        context = self.context.copy()
        context['branch_id'] = self.context.get('branch_id')
        return MenuItemSerializer(obj.items.all(), many=True, context=context).data


# --- Menu Serializer ---
class MenuSerializer(serializers.ModelSerializer):
    # Pass branch_id to MenuSectionSerializer context which then passes it to MenuItemSerializer
    sections = serializers.SerializerMethodField() # Changed from 'items' to 'sections'

    class Meta:
        model = Menu
        fields = ['id', 'name', 'is_active', 'created_at', 'updated_at', 'sections']

    def get_sections(self, obj):
        # Forward the branch_id from the Menu's context to MenuSectionSerializer
        context = self.context.copy()
        context['branch_id'] = self.context.get('branch_id')
        return MenuSectionSerializer(obj.sections.all(), many=True, context=context).data