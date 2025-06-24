from rest_framework import serializers
from .models import Order, OrderItem
from django.db import transaction

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'quantity', 'price', 'item_type']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'created_by', 'assigned_to', 'status', 'branch', 'items', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'order_number']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        # Update order instance fields
        instance.status = validated_data.get('status', instance.status)
        instance.assigned_to = validated_data.get('assigned_to', instance.assigned_to)
        instance.save()

        # Update order items
        items_data = validated_data.get('items')
        if items_data is not None:
            # First, remove old items
            instance.items.all().delete()
            # Then, create new items
            for item_data in items_data:
                OrderItem.objects.create(order=instance, **item_data)

        return instance
