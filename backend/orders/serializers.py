from rest_framework import serializers
from .models import Order, OrderItem
from django.db import transaction
from branches.models import Table

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'quantity', 'price', 'item_type', 'status', 'product']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    waiterName = serializers.CharField(source='created_by.username', read_only=True)
    has_payment = serializers.SerializerMethodField()
    table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())
    table_number = serializers.IntegerField(source='table.number', read_only=True)
    branch = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'order_number','table', 'table_number', 'waiterName', 'assigned_to', 'food_status', 'beverage_status', 'branch', 'items', 'created_at', 'updated_at', 'total_money', 'cashier_status', 'payment_option', 'has_payment']


        read_only_fields = ['created_at', 'updated_at', 'order_number']

 
class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'quantity', 'price', 'item_type', 'status']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    waiterName = serializers.CharField(source='created_by.first_name', read_only=True)
    has_payment = serializers.SerializerMethodField()
    table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())
    table_number = serializers.IntegerField(source='table.number', read_only=True)
    branch = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'table', 'table_number', 'waiterName', 'assigned_to',
            'food_status', 'beverage_status', 'branch', 'items', 'created_at', 'updated_at',
            'total_money', 'cashier_status', 'payment_option', 'has_payment',
        ]
        read_only_fields = ['created_at', 'updated_at', 'order_number']

    def create(self, validated_data):
        items_data = validated_data.pop('items', None)
        table = validated_data.get('table')

        if not table:
            raise serializers.ValidationError("Order must include a table.")

        validated_data['branch'] = table.branch  # Set branch from table

        if items_data is None:
            raise serializers.ValidationError("Order must include 'items'.")

        order = Order.objects.create(**validated_data)
        total = 0
        
        # Group items by name, price, and type to avoid duplicates
        grouped_items = {}
        for item_data in items_data:
            item_key = (item_data.get('name'), item_data.get('price'), item_data.get('item_type', 'food'))
            
            if item_key in grouped_items:
                # Add quantities for same item
                grouped_items[item_key]['quantity'] += item_data.get('quantity', 1)
            else:
                # Create new grouped item
                grouped_items[item_key] = {
                    'name': item_data.get('name'),
                    'price': item_data.get('price'),
                    'item_type': item_data.get('item_type', 'food'),
                    'quantity': item_data.get('quantity', 1),
                    'status': item_data.get('status', 'pending')
                }
        
        # Create OrderItems from grouped data
        for item_data in grouped_items.values():
            try:
                item = OrderItem.objects.create(order=order, **item_data)
                if item.status == 'accepted':
                    total += item.price * item.quantity
            except Exception as e:
                order.delete()
                raise serializers.ValidationError(f"Error creating order item: {str(e)}")

        order.total_money = total
        if order.all_items_completed():
            order.food_status = 'completed'
            order.beverage_status = 'completed'
        order.save()
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        # Update order fields as needed
        instance.food_status = validated_data.get('food_status', instance.food_status)
        new_beverage_status = validated_data.get('beverage_status', instance.beverage_status)
        if instance.beverage_status != 'preparing':
            instance.beverage_status = new_beverage_status
        instance.assigned_to = validated_data.get('assigned_to', instance.assigned_to)
        instance.save()

        items_data = validated_data.get('items')
        if items_data is not None:
            print('DEBUG PATCH items_data:', items_data)  # <-- debug log
            
            # Smart item updating: preserve statuses and merge quantities intelligently
            existing_items = {item.id: item for item in instance.items.all()}
            updated_items = []
            new_total = 0
            new_beverage_item_added = False
            new_food_item_added = False

            print(f'DEBUG: Existing items before update: {[(item.name, item.quantity, item.status) for item in existing_items.values()]}')

            for item_data in items_data:
                item_name = item_data.get('name')
                item_price = item_data.get('price')
                item_type = item_data.get('item_type', 'food')
                new_quantity = item_data.get('quantity', 1)
                
                print(f'DEBUG: Processing item: {item_name} x{new_quantity} (${item_price}) - {item_type}')
                
                # Try to find existing item with same name, price, and type
                existing_item = None
                for existing in existing_items.values():
                    if (existing.name == item_name and 
                        existing.price == item_price and 
                        existing.item_type == item_type):
                        existing_item = existing
                        break
                
                if existing_item:
                    print(f'DEBUG: Found existing item: {existing_item.name} x{existing_item.quantity} (status: {existing_item.status})')
                    
                    # Update the quantity of existing item
                    existing_item.quantity = new_quantity
                    existing_item.save()
                    print(f'DEBUG: Updated existing item quantity: {existing_item.name} → {new_quantity}')
                    
                    updated_items.append(existing_item)
                    
                    # Remove from existing items dict to avoid duplicates
                    if existing_item.id in existing_items:
                        del existing_items[existing_item.id]
                else:
                    # Create new item with pending status
                    new_item = OrderItem.objects.create(
                        order=instance,
                        **item_data
                    )
                    if 'status' not in item_data:
                        new_item.status = 'pending'
                        new_item.save()
                    print(f'DEBUG: Created new item: {new_item.name} x{new_item.quantity} (status: {new_item.status})')
                    updated_items.append(new_item)

            # Delete any remaining existing items that weren't updated
            for item_id in list(existing_items.keys()):
                item_to_delete = existing_items[item_id]
                print(f'DEBUG: Deleting unused item: {item_to_delete.name} x{item_to_delete.quantity}')
                item_to_delete.delete()

            print(f'DEBUG: Final updated items: {[(item.name, item.quantity, item.status) for item in updated_items]}')

            # Calculate new total and update statuses
            for item in updated_items:
                if item.status == 'accepted':
                    new_total += item.price * item.quantity
                if item.item_type == 'beverage':
                    new_beverage_item_added = True
                if item.item_type == 'food':
                    new_food_item_added = True

            instance.total_money = new_total
            if new_beverage_item_added and instance.beverage_status != 'preparing':
                instance.beverage_status = 'pending'
            if new_food_item_added and instance.food_status != 'preparing':
                instance.food_status = 'pending'

            if instance.all_items_completed():
                instance.food_status = 'completed'
                instance.beverage_status = 'completed'
            instance.save()

        return instance

    def get_has_payment(self, obj):
        from payments.models import Payment
        return Payment.objects.filter(order=obj).exists()




class FoodOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'quantity', 'price', 'status']
        

class FoodOrderSerializer(OrderSerializer):
    items = FoodOrderItemSerializer(many=True, source='food_items')
    status = serializers.CharField(source='food_status')
    table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())
    table_number = serializers.IntegerField(source='table.number', read_only=True)
    waiterName = serializers.CharField(source='created_by.username', read_only=True)

    class Meta(OrderSerializer.Meta):
        fields = [
            'id', 'order_number', 'table', 'table_number', 'created_by', 'waiterName',
            'status', 'items', 'created_at', 'has_payment'
        ]


class BeverageOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'quantity', 'price', 'item_type', 'status', 'product']


class BeverageOrderSerializer(OrderSerializer):
    items = BeverageOrderItemSerializer(many=True, source='beverage_items')
    status = serializers.CharField(source='beverage_status')
    table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())
    table_number = serializers.IntegerField(source='table.number', read_only=True)
    waiterName = serializers.CharField(source='created_by.username', read_only=True)


    class Meta(OrderSerializer.Meta):
        fields = [
            'id', 'order_number', 'table', 'table_number', 'created_by', 'waiterName',
            'status', 'items', 'created_at', 'has_payment','branch_id'
        ]
