from rest_framework import serializers
from .models import ItemType, Category, Product, Stock, InventoryTransaction, InventoryRequest, BarmanStock, AuditLog
from branches.models import Branch
from django.db import transaction as db_transaction
from decimal import Decimal

from rest_framework import serializers
from .models import ItemType, Category, Product, Stock, InventoryTransaction, InventoryRequest, BarmanStock, AuditLog
from branches.models import Branch
from django.db import transaction as db_transaction
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()
# --- Helper Serializers (No major changes, just ensure consistency) ---

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'location']

class ItemTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemType
        fields = ['id', 'type_name']
        extra_kwargs = {
            'id': {'read_only': True},
        }

class CategorySerializer(serializers.ModelSerializer):
    item_type_detail = ItemTypeSerializer(source='item_type', read_only=True) # Renamed for clarity
    item_type = serializers.PrimaryKeyRelatedField(
        queryset=ItemType.objects.all(),
        write_only=True # Only ID for writing
    )

    class Meta:
        model = Category
        fields = ['id', 'category_name', 'item_type_detail', 'item_type'] # Exposed both for read/write

# --- Core Product Serializer (Reflects new Product Model) ---

class ProductSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True) # Renamed for clarity
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), write_only=True
    )

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'category_detail', # For reading full category details
            'category',        # For writing just the category ID
            'price_per_sellable_unit', # Updated field name
            'primary_stocking_unit',   # New field
            'sellable_unit_type',      # New field
            'conversion_rate',         # New field
            'receipt_image',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at'] # Typically read-only

# --- Stock Serializer (Simplified) ---

class StockSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True) # For nested product details
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), write_only=True
    )
    branch_detail = BranchSerializer(source='branch', read_only=True) # For nested branch details
    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), write_only=True
    )
    
    # New computed field for display, uses the model's new method
    total_stock_display = serializers.SerializerMethodField()

    class Meta:
        model = Stock
        fields = [
            'id',
            'product_detail',
            'product',
            'branch_detail',
            'branch',
            'total_sellable_units', # This replaces carton_quantity, bottle_quantity, unit_quantity
            'minimum_threshold',
            'running_out',
            'total_stock_display', # Display the calculated friendly string
        ]
        read_only_fields = ['running_out', 'total_stock_display'] # Running_out is set by the model

    def get_total_stock_display(self, obj):
        return obj.get_total_stock_display()

    # No need for save() override here. The model's save method handles clean() and check_running_out().
    # For updating `total_sellable_units`, use the `Stock.add_stock` or `Stock.deduct_stock` class methods
    # from your views or other business logic, not directly through serializer update.

# --- Barman Stock Serializer (Simplified) ---

class BarmanStockSerializer(serializers.ModelSerializer):
    # 'stock' now points to the main Stock instance, not just a product
    stock_detail = StockSerializer(source='stock', read_only=True) # Nested Stock details
    stock = serializers.PrimaryKeyRelatedField(
        queryset=Stock.objects.all(), write_only=True
    )
    # Bartender details for display
    bartender_username = serializers.CharField(source='bartender.username', read_only=True)
    bartender = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), write_only=True
    )

    # Simplified fields as per model changes
    class Meta:
        model = BarmanStock
        fields = [
            'id',
            'stock_detail',
            'stock',
            'bartender_username',
            'bartender',
            'total_sellable_units', # This replaces carton_quantity, bottle_quantity, unit_quantity
            'minimum_threshold',
            'running_out',
        ]
        read_only_fields = ['running_out']

    # No need for save() override here. The model's save method handles clean() and check_running_out().
    # For updating `total_sellable_units`, use `BarmanStock.transfer_to_barman`
    # or `BarmanStock.deduct_from_barman` from your views.

# --- Inventory Transaction Serializer (Crucial for conversions) ---

class InventoryTransactionSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), write_only=True
    )
    branch_detail = BranchSerializer(source='branch', read_only=True)
    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), write_only=True
    )
    action_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False, default=serializers.CurrentUserDefault() # Auto-fill current user
    )

    class Meta:
        model = InventoryTransaction
        fields = [
            'id',
            'product_detail',
            'product',
            'transaction_type',
            'quantity_in_sellable_units', # Now the primary quantity field
            'original_quantity_entered',  # New field for restocks
            'original_unit_type_entered', # New field for restocks
            'purchase_price_per_stocking_unit', # New field for restocks
            'transaction_date',
            'branch_detail',
            'branch',
            'action_by',
        ]
        read_only_fields = ['transaction_date'] # Auto-set by model

    def create(self, validated_data):
        with db_transaction.atomic():
            product = validated_data['product']
            branch = validated_data['branch']
            transaction_type = validated_data['transaction_type']
            action_by = validated_data.get('action_by', self.context['request'].user if self.context.get('request') else None)

            # Determine the quantity in sellable units based on transaction type and input
            if transaction_type == 'restock':
                original_qty = validated_data.get('original_quantity_entered')
                original_unit = validated_data.get('original_unit_type_entered')
                purchase_price = validated_data.get('purchase_price_per_stocking_unit')

                if not original_qty or not original_unit or purchase_price is None:
                    raise serializers.ValidationError({
                        'original_quantity_entered': 'Required for restock.',
                        'original_unit_type_entered': 'Required for restock.',
                        'purchase_price_per_stocking_unit': 'Required for restock.'
                    })

                # Validate original_unit against Product's allowed units
                if original_unit == product.primary_stocking_unit:
                    quantity_to_add_to_stock = Decimal(original_qty) * product.conversion_rate
                elif original_unit == product.sellable_unit_type:
                    quantity_to_add_to_stock = Decimal(original_qty)
                else:
                    raise serializers.ValidationError(
                        f"For '{product.name}', restock unit '{original_unit}' is invalid. "
                        f"Expected '{product.primary_stocking_unit}' or '{product.sellable_unit_type}'."
                    )
                
                # Overwrite quantity_in_sellable_units for restock to be the calculated value
                validated_data['quantity_in_sellable_units'] = quantity_to_add_to_stock
                Stock.add_stock(product=product, branch=branch, quantity=original_qty, unit_type=original_unit)

            elif transaction_type in ['sale', 'wastage']:
                quantity_to_deduct = validated_data['quantity_in_sellable_units'] # Already in sellable units
                if quantity_to_deduct <= 0:
                    raise serializers.ValidationError({'quantity_in_sellable_units': 'Quantity must be positive for sales/wastage.'})

                # Deduct from Stock. If it's a sale from a BarmanStock, manage that in the view.
                # Here, we assume sales/wastage directly affect the main branch stock or that BarmanStock deduction
                # will be handled separately (e.g., via a specific barman sale endpoint).
                # For simplicity, let's assume direct stock deduction for now.
                Stock.deduct_stock(product=product, branch=branch, quantity=quantity_to_deduct)

                # For sale/wastage, ensure original_quantity/unit/purchase_price are not set
                validated_data['original_quantity_entered'] = None
                validated_data['original_unit_type_entered'] = None
                validated_data['purchase_price_per_stocking_unit'] = None

            else:
                raise serializers.ValidationError({'transaction_type': 'Invalid transaction type.'})

            # Create the transaction record
            inventory_transaction = InventoryTransaction.objects.create(
                **validated_data,
                action_by=action_by # Set the action_by user
            )

            # Optional: Log to AuditLog for every transaction
            AuditLog.objects.create(
                product=product,
                action_type=f"{transaction_type}_transaction",
                quantity_affected_sellable_units=validated_data['quantity_in_sellable_units'],
                original_action_unit=validated_data.get('original_unit_type_entered'),
                original_action_quantity=validated_data.get('original_quantity_entered'),
                action_by=action_by,
                branch=branch,
                inventory_transaction=inventory_transaction,
                note=f"Transaction {transaction_type} for {validated_data['quantity_in_sellable_units']} {product.sellable_unit_type.lower()}(s)."
            )

            return inventory_transaction

# --- Inventory Request Serializer ---

class InventoryRequestSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), write_only=True
    )
    requesting_branch_detail = BranchSerializer(source='requesting_branch', read_only=True)
    requesting_branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), write_only=True
    )
    fulfilling_branch_detail = BranchSerializer(source='fulfilling_branch', read_only=True)
    fulfilling_branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), allow_null=True, required=False, write_only=True
    )
    requested_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False, default=serializers.CurrentUserDefault()
    )
    processed_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = InventoryRequest
        fields = [
            'id',
            'product_detail',
            'product',
            'quantity_in_sellable_units', # Now the primary quantity field
            'requested_unit_type',      # New field to indicate how it was requested
            'status',
            'created_at',
            'requesting_branch_detail',
            'requesting_branch',
            'fulfilling_branch_detail',
            'fulfilling_branch',
            'requested_by',
            'processed_by',
            'processed_at',
            'reached_status', # Consider removing or renaming this for clarity
        ]
        read_only_fields = ['created_at', 'status', 'processed_at', 'reached_status'] # Status should be changed via specific actions/views

    def create(self, validated_data):
        # Auto-calculate quantity_in_sellable_units if requested_unit_type is provided
        product = validated_data['product']
        requested_qty = validated_data['quantity_in_sellable_units']
        requested_unit = validated_data.get('requested_unit_type')

        if requested_unit:
            if requested_unit == product.primary_stocking_unit:
                # User requested in Grandpa unit, convert to sellable units
                validated_data['quantity_in_sellable_units'] = Decimal(requested_qty) * product.conversion_rate
            elif requested_unit == product.sellable_unit_type:
                # User requested in Father/Single Piece unit, use as is
                validated_data['quantity_in_sellable_units'] = Decimal(requested_qty)
            else:
                 raise serializers.ValidationError(
                    {'requested_unit_type': f"Invalid request unit type '{requested_unit}' for product '{product.name}'. "
                                            f"Expected '{product.primary_stocking_unit}' or '{product.sellable_unit_type}'."}
                )
        else:
             # If no requested_unit_type is provided, assume quantity_in_sellable_units is already correct
             validated_data['quantity_in_sellable_units'] = Decimal(requested_qty)


        # Auto-set requested_by if not provided
        if not validated_data.get('requested_by') and self.context.get('request'):
            validated_data['requested_by'] = self.context['request'].user

        instance = super().create(validated_data)

        # Log request creation
        AuditLog.objects.create(
            product=instance.product,
            action_type='inventory_request_created',
            quantity_affected_sellable_units=instance.quantity_in_sellable_units,
            original_action_unit=instance.requested_unit_type,
            original_action_quantity=instance.quantity_in_sellable_units if not instance.requested_unit_type else None, # Log original if not converted
            action_by=instance.requested_by,
            branch=instance.requesting_branch,
            inventory_request=instance,
            note=f"Inventory request for {instance.quantity_in_sellable_units} {instance.product.sellable_unit_type.lower()}(s) of {instance.product.name}."
        )

        return instance

    def update(self, instance, validated_data):
        # Handle status changes and update processed_by/processed_at
        if 'status' in validated_data and validated_data['status'] != instance.status:
            instance.status = validated_data['status']
            instance.processed_by = self.context['request'].user if self.context.get('request') else None
            instance.processed_at = timezone.now()

            AuditLog.objects.create(
                product=instance.product,
                action_type='inventory_request_status_change',
                action_by=instance.processed_by,
                branch=instance.requesting_branch,
                inventory_request=instance,
                previous_value=instance.status,
                new_value=validated_data['status'],
                note=f"Inventory request status changed from {instance.status} to {validated_data['status']}."
            )

            if instance.status == 'accepted':
                # Example: If accepted, you might want to automatically create a transfer transaction
                # This logic might be better placed in a dedicated view or service layer,
                # but for demonstration, showing it here.
                # If the fulfilling_branch exists, deduct from there and add to requesting_branch.
                if instance.fulfilling_branch:
                    try:
                        # Deduct from fulfilling branch
                        Stock.deduct_stock(
                            product=instance.product,
                            branch=instance.fulfilling_branch,
                            quantity=instance.quantity_in_sellable_units
                        )
                        # Add to requesting branch
                        Stock.add_stock(
                            product=instance.product,
                            branch=instance.requesting_branch,
                            quantity=instance.quantity_in_sellable_units,
                            unit_type=instance.product.sellable_unit_type # Adding as sellable units
                        )
                        InventoryTransaction.objects.create(
                            product=instance.product,
                            transaction_type='transfer_out',
                            quantity_in_sellable_units=instance.quantity_in_sellable_units,
                            branch=instance.fulfilling_branch,
                            action_by=instance.processed_by,
                            note=f"Fulfilled request {instance.id} to {instance.requesting_branch.name}"
                        )
                        InventoryTransaction.objects.create(
                            product=instance.product,
                            transaction_type='transfer_in',
                            quantity_in_sellable_units=instance.quantity_in_sellable_units,
                            branch=instance.requesting_branch,
                            action_by=instance.processed_by,
                            note=f"Received request {instance.id} from {instance.fulfilling_branch.name}"
                        )
                        instance.status = 'fulfilled' # Update status to fulfilled after transfer
                        instance.reached_status = True # Keep this if you still need it
                    except Exception as e:
                        # Log error if transfer fails, maybe revert status or add a failure note
                        AuditLog.objects.create(
                            product=instance.product,
                            action_type='inventory_request_status_change',
                            action_by=instance.processed_by,
                            branch=instance.requesting_branch,
                            inventory_request=instance,
                            previous_value=instance.status,
                            new_value="accepted (failed transfer)",
                            note=f"ERROR fulfilling request {instance.id}: {str(e)}"
                        )
                        raise serializers.ValidationError(f"Failed to fulfill request: {e}")

        return super().update(instance, validated_data)