from rest_framework import serializers
from orders.models import Order, OrderItem
from inventory.models import InventoryItem, InventoryRequest
from users.models import User

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'quantity', 'price', 'item_type']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'created_by', 'assigned_to', 'status', 'created_at', 'updated_at', 'branch', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = ['id', 'name', 'quantity', 'branch', 'passed_to_bartender']

class InventoryRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryRequest
        fields = ['id', 'requested_by', 'item', 'quantity', 'status', 'created_at']
