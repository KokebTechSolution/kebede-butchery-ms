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

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        return representation

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
        for item_data in items_data:
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
            # Only delete and recreate items of the same type as the update (beverage or food)
            item_types = set(item['item_type'] for item in items_data if 'item_type' in item)
            if not item_types:
                item_types = set(['beverage'])  # fallback for beverage serializer
            instance.items.filter(item_type__in=item_types).delete()

            new_total = 0
            new_beverage_item_added = False
            new_food_item_added = False

            for item_data in items_data:
                if 'status' not in item_data:
                    item_data['status'] = 'pending'
                item = OrderItem.objects.create(order=instance, **item_data)
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
