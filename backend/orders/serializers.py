from rest_framework import serializers
from .models import Order, OrderItem
from django.db import transaction
from branches.models import Table

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'quantity', 'price', 'item_type', 'status']
        fields = ['id', 'name', 'quantity', 'price', 'item_type', 'status']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    waiterName = serializers.CharField(source='created_by.username', read_only=True)
    has_payment = serializers.SerializerMethodField()
    table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())
    table_number = serializers.IntegerField(source='table.number', read_only=True)
    branch = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Order

        fields = ['id', 'order_number', 'table_number', 'waiterName', 'assigned_to', 'food_status', 'beverage_status', 'branch', 'items', 'created_at', 'updated_at', 'total_money', 'cashier_status', 'payment_option', 'has_payment']
        fields = ['id', 'order_number','table', 'table_number', 'waiterName', 'assigned_to', 'food_status', 'beverage_status', 'branch', 'items', 'created_at', 'updated_at', 'total_money', 'cashier_status', 'payment_option', 'has_payment']


        read_only_fields = ['created_at', 'updated_at', 'order_number']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        total = 0
        for item_data in items_data:
            item = OrderItem.objects.create(order=order, **item_data)
            if item.status == 'accepted':
                total += item.price * item.quantity
        order.total_money = total
        if order.all_items_completed():
            order.food_status = 'completed'
            order.beverage_status = 'completed'
        order.save()
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        # Update order instance fields
        instance.food_status = validated_data.get('food_status', instance.food_status)
        # Only update beverage_status if not already 'preparing'
        new_beverage_status = validated_data.get('beverage_status', instance.beverage_status)
        if instance.beverage_status != 'preparing':
            instance.beverage_status = new_beverage_status
        instance.assigned_to = validated_data.get('assigned_to', instance.assigned_to)
        instance.save()

        # Update order items
        items_data = validated_data.get('items')
        if items_data is not None:
            existing_items = {item.id: item for item in instance.items.all()}
            new_total = 0
            new_beverage_item_added = False
            new_food_item_added = False
            existing_items = {item.id: item for item in instance.items.all()}
            new_total = 0
            new_beverage_item_added = False
            new_food_item_added = False
            for item_data in items_data:
                item_id = item_data.get('id')
                if item_id and item_id in existing_items:
                    # Update existing item (preserve status unless explicitly changed)
                    item = existing_items[item_id]
                    item.name = item_data.get('name', item.name)
                    item.quantity = item_data.get('quantity', item.quantity)
                    item.price = item_data.get('price', item.price)
                    item.item_type = item_data.get('item_type', item.item_type)
                    if 'status' in item_data:
                        item.status = item_data['status']
                    item.save()
                    if item.status == 'accepted':
                        new_total += item.price * item.quantity
                    del existing_items[item_id]
                else:
                    # Create new item
                    if 'status' not in item_data:
                        item_data['status'] = 'pending'
                    item = OrderItem.objects.create(order=instance, **item_data)
                    if item.status == 'accepted':
                        new_total += item.price * item.quantity
                    if item.item_type == 'beverage':
                        new_beverage_item_added = True
                    if item.item_type == 'food':
                        new_food_item_added = True
            # Optionally, delete items not in the update (if you want to support removal)
            # for item in existing_items.values():
            #     item.delete()
            instance.total_money = new_total
            # If a new beverage item was added and beverage_status is not 'preparing', set to 'pending'
            if new_beverage_item_added and instance.beverage_status != 'preparing':
                instance.beverage_status = 'pending'
            # If a new food item was added and food_status is not 'preparing', set to 'pending'
            if new_food_item_added and instance.food_status != 'preparing':
                instance.food_status = 'pending'
            instance.save()
            # After updating items, check if all items are completed
            if instance.all_items_completed():
                instance.food_status = 'completed'
                instance.beverage_status = 'completed'
            instance.save()
        return instance

    def get_has_payment(self, obj):
        from payments.models import Payment
        return Payment.objects.filter(order=obj).exists()

    def get_has_payment(self, obj):
        from payments.models import Payment
        return Payment.objects.filter(order=obj).exists()

class FoodOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'quantity', 'price', 'status']
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
        fields = ['id', 'name', 'quantity', 'price', 'status']
        fields = ['id', 'name', 'quantity', 'price', 'status']


class BeverageOrderSerializer(OrderSerializer):
    items = BeverageOrderItemSerializer(many=True, source='beverage_items')
    status = serializers.CharField(source='beverage_status')
    table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())
    table_number = serializers.IntegerField(source='table.number', read_only=True)
    waiterName = serializers.CharField(source='created_by.username', read_only=True)


    class Meta(OrderSerializer.Meta):
        fields = [
            'id', 'order_number', 'table', 'table_number', 'created_by', 'waiterName',
            'status', 'items', 'created_at', 'has_payment'
        ]
