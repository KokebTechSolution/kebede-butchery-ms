from rest_framework import serializers
from .models import Order, OrderItem
from django.db import transaction

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'quantity', 'price', 'item_type']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    waiterName = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'table_number', 'waiterName', 'assigned_to', 'food_status', 'drink_status', 'branch', 'items', 'created_at', 'updated_at', 'total_money', 'cashier_status', 'payment_option']
        read_only_fields = ['created_at', 'updated_at', 'order_number']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        total = 0
        for item_data in items_data:
            item = OrderItem.objects.create(order=order, **item_data)
            total += item.price * item.quantity
        order.total_money = total
        order.save()
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        # Update order instance fields
        instance.food_status = validated_data.get('food_status', instance.food_status)
        instance.drink_status = validated_data.get('drink_status', instance.drink_status)
        instance.assigned_to = validated_data.get('assigned_to', instance.assigned_to)
        instance.save()

        # Update order items
        items_data = validated_data.get('items')
        if items_data is not None:
            # First, remove old items
            instance.items.all().delete()
            # Then, create new items
            total = 0
            for item_data in items_data:
                item = OrderItem.objects.create(order=instance, **item_data)
                total += item.price * item.quantity
            instance.total_money = total
            instance.save()
        return instance

class FoodOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'quantity', 'price']

class FoodOrderSerializer(OrderSerializer):
    items = FoodOrderItemSerializer(many=True, source='food_items')
    status = serializers.CharField(source='food_status')

    class Meta(OrderSerializer.Meta):
        fields = ['id', 'order_number', 'table_number', 'created_by', 'status', 'items', 'created_at']


class DrinkOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'quantity', 'price']

class DrinkOrderSerializer(OrderSerializer):
    items = DrinkOrderItemSerializer(many=True, source='drink_items')
    status = serializers.CharField(source='drink_status')

    class Meta(OrderSerializer.Meta):
        fields = ['id', 'order_number', 'table_number', 'created_by', 'status', 'items', 'created_at']
