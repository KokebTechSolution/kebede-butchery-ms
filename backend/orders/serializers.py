from rest_framework import serializers
from .models import Order, OrderItem, OrderUpdate
from users.serializers import UserListSerializer as UserSerializer
from branches.models import Table
from django.db import transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
from .utils import get_waiter_actions, validate_order_update, update_order_with_validation

def send_notification_to_role(role, message):
    """Send notification to users with specific role via WebSocket"""
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"{role}_notifications",
            {
                "type": "send_notification",
                "message": message
            }
        )
        print(f"📢 Notification sent to {role}: {message}")
    except Exception as e:
        print(f"❌ Failed to send notification to {role}: {e}")

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
    receipt_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'table', 'table_number', 'waiterName', 'assigned_to',
            'food_status', 'beverage_status', 'branch', 'items', 'created_at', 'updated_at',
            'total_money', 'cashier_status', 'payment_option', 'has_payment', 'receipt_image',
        ]
        read_only_fields = ['created_at', 'updated_at', 'order_number']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Only override items if this is the base OrderSerializer
        # Child serializers (FoodOrderSerializer, BeverageOrderSerializer) will handle their own items
        if not hasattr(self, 'get_items'):
            representation['items'] = OrderItemSerializer(instance.items.all(), many=True).data
        return representation

    def create(self, validated_data):
        items_data = validated_data.pop('items', None)
        table = validated_data.get('table')

        if not table:
            raise serializers.ValidationError("Order must include a table.")

        validated_data['branch'] = table.branch  # Set branch from table

        if items_data is None:
            raise serializers.ValidationError("Order must include 'items'.")

        # Generate order number automatically
        from datetime import datetime
        today = datetime.now().strftime('%Y%m%d')
        
        # Get the last order number for today
        last_order = Order.objects.filter(
            order_number__startswith=today
        ).order_by('-order_number').first()
        
        if last_order:
            # Extract the sequence number and increment
            try:
                last_sequence = int(last_order.order_number.split('-')[1])
                new_sequence = last_sequence + 1
            except (IndexError, ValueError):
                new_sequence = 1
        else:
            new_sequence = 1
        
        # Format: YYYYMMDD-XX (e.g., 20250817-01)
        validated_data['order_number'] = f"{today}-{new_sequence:02d}"
        
        print(f"[DEBUG] OrderSerializer.create - Generated order number: {validated_data['order_number']}")
        print(f"[DEBUG] OrderSerializer.create - Table: {table}, Branch: {table.branch if table else 'None'}")
        print(f"[DEBUG] OrderSerializer.create - Validated data keys: {list(validated_data.keys())}")

        try:
            order = Order.objects.create(**validated_data)
            print(f"[DEBUG] OrderSerializer.create - Order created: {order.id}")
        except Exception as e:
            print(f"[DEBUG] OrderSerializer.create - Error creating order: {str(e)}")
            print(f"[DEBUG] OrderSerializer.create - Error type: {type(e)}")
            print(f"[DEBUG] OrderSerializer.create - Validated data: {validated_data}")
            raise
        
        total = 0
        for item_data in items_data:
            try:
                print(f"[DEBUG] OrderSerializer.create - Creating item with data: {item_data}")
                print(f"[DEBUG] OrderSerializer.create - Product field: {item_data.get('product')}")
                
                # Create order item with original item_type (no mapping needed)
                # Remove any fields that don't exist in OrderItem model
                item_fields = {k: v for k, v in item_data.items() 
                             if k in ['name', 'quantity', 'price', 'item_type', 'status']}
                item = OrderItem.objects.create(order=order, **item_fields)
                print(f"[DEBUG] OrderSerializer.create - Item created: {item.id}, Product: {item.product}, item_type: {item_data.get('item_type')}")
                
                if item.status == 'accepted':
                    total += item.price * item.quantity
            except Exception as e:
                order.delete()
                raise serializers.ValidationError(f"Error creating order item: {str(e)}")

        order.total_money = total
        
        # Set initial statuses based on actual items in the order
        beverage_items = [item for item in items_data if item.get('item_type') == 'beverage']
        food_items = [item for item in items_data if item.get('item_type') == 'food']
        
        # Set food status based on food items
        if food_items:
            order.food_status = 'pending'
        else:
            order.food_status = 'not_applicable'
        
        # Set beverage status based on beverage items
        if beverage_items:
            order.beverage_status = 'pending'
        else:
            order.beverage_status = 'not_applicable'
        
        order.save()
        
        # Send notifications to respective roles for new orders
        if beverage_items:
            beverage_message = f"New order #{order.order_number} (Table {order.table.number}) with {len(beverage_items)} beverage item(s)"
            send_notification_to_role('bartender', beverage_message)
        
        if food_items:
            food_message = f"New order #{order.order_number} (Table {order.table.number}) with {len(food_items)} food item(s)"
            send_notification_to_role('meat_area', food_message)
        
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        try:
            print(f"[DEBUG] OrderSerializer.update - Starting update for order {instance.id}")
            print(f"[DEBUG] OrderSerializer.update - Validated data: {validated_data}")
            
            # Get the user making the update
            user = self.context.get('request').user if hasattr(self.context, 'get') and self.context.get('request') else None
            
            items_data = validated_data.get('items')
            if items_data is not None:
                print(f'[DEBUG] OrderSerializer.update - Processing items_data: {items_data}')
                
                # Use the new validation and update logic
                update_result = update_order_with_validation(instance.id, items_data, user)
                
                if not update_result['success']:
                    raise serializers.ValidationError(update_result['error'])
                
                print(f'[DEBUG] OrderSerializer.update - Update successful: {update_result["message"]}')
                
                # Refresh the instance to get updated data
                instance.refresh_from_db()
                
                # Recalculate order statuses based on current items
                beverage_items = instance.items.filter(item_type='beverage')
                food_items = instance.items.filter(item_type='food')
                
                # Update food status
                if food_items.exists():
                    if food_items.filter(status='pending').exists():
                        instance.food_status = 'pending'
                    elif food_items.filter(status='rejected').exists():
                        instance.food_status = 'rejected'
                    elif food_items.filter(status='accepted').count() == food_items.count():
                        instance.food_status = 'completed'
                    else:
                        instance.food_status = 'pending'
                else:
                    instance.food_status = 'not_applicable'
                
                # Update beverage status
                if beverage_items.exists():
                    if beverage_items.filter(status='pending').exists():
                        instance.beverage_status = 'pending'
                    elif beverage_items.filter(status='rejected').exists():
                        instance.beverage_status = 'rejected'
                    elif beverage_items.filter(status='accepted').count() == beverage_items.count():
                        instance.beverage_status = 'completed'
                    else:
                        instance.beverage_status = 'pending'
                else:
                    instance.beverage_status = 'not_applicable'
                
                instance.save()
                
                # Send notifications to respective roles
                beverage_items_data = [item for item in items_data if item.get('item_type') == 'beverage']
                food_items_data = [item for item in items_data if item.get('item_type') == 'food']
                
                if beverage_items_data:
                    beverage_message = f"Order #{instance.order_number} (Table {instance.table.number}) updated with {len(beverage_items_data)} beverage item(s)"
                    send_notification_to_role('bartender', beverage_message)
                
                if food_items_data:
                    food_message = f"Order #{instance.order_number} (Table {instance.table.number}) updated with {len(food_items_data)} food item(s)"
                    send_notification_to_role('meat_area', food_message)
                
                print(f'[DEBUG] OrderSerializer.update - Final order state:')
                print(f'[DEBUG] OrderSerializer.update - Total money: {instance.total_money}')
                print(f'[DEBUG] OrderSerializer.update - Items after update: {list(instance.items.values())}')
                
            else:
                # Update other fields if no items data
                instance.food_status = validated_data.get('food_status', instance.food_status)
                new_beverage_status = validated_data.get('beverage_status', instance.beverage_status)
                if instance.beverage_status != 'preparing':
                    instance.beverage_status = new_beverage_status
                instance.assigned_to = validated_data.get('assigned_to', instance.assigned_to)
                instance.save()

            print(f'[DEBUG] OrderSerializer.update - Update completed for order {instance.id}')
            
            # Verify the update was actually saved to database
            instance.refresh_from_db()
            print(f'[DEBUG] OrderSerializer.update - After refresh from DB:')
            print(f'[DEBUG] OrderSerializer.update - Order {instance.id} total_money: {instance.total_money}')
            print(f'[DEBUG] OrderSerializer.update - Order {instance.id} items count: {instance.items.count()}')
            print(f'[DEBUG] OrderSerializer.update - Order {instance.id} items: {list(instance.items.values())}')
            
            return instance
            
        except Exception as e:
            print(f'[ERROR] OrderSerializer.update - Error updating order {instance.id}: {str(e)}')
            raise

    def get_has_payment(self, obj):
        from payments.models import Payment
        return Payment.objects.filter(order=obj).exists()




class FoodOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'quantity', 'price', 'item_type', 'status']
        

class FoodOrderSerializer(OrderSerializer):
    items = serializers.SerializerMethodField()
    status = serializers.CharField(source='food_status')
    table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())
    table_number = serializers.IntegerField(source='table.number', read_only=True)
    waiterName = serializers.CharField(source='created_by.username', read_only=True)

    class Meta(OrderSerializer.Meta):
        fields = [
            'id', 'order_number', 'table', 'table_number', 'created_by', 'waiterName',
            'status', 'items', 'created_at', 'has_payment'
        ]
    
    def get_items(self, obj):
        # Only return food items
        food_items = obj.items.filter(item_type='food')
        return FoodOrderItemSerializer(food_items, many=True).data


class BeverageOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'quantity', 'price', 'item_type', 'status', 'product']


class BeverageOrderSerializer(OrderSerializer):
    items = serializers.SerializerMethodField()
    status = serializers.CharField(source='beverage_status')
    table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())
    table_number = serializers.IntegerField(source='table.number', read_only=True)
    waiterName = serializers.CharField(source='created_by.username', read_only=True)


    class Meta(OrderSerializer.Meta):
        fields = [
            'id', 'order_number', 'table', 'table_number', 'created_by', 'waiterName',
            'status', 'items', 'created_at', 'has_payment','branch_id'
        ]
    
    def get_items(self, obj):
        # Only return beverage items
        beverage_items = obj.items.filter(item_type='beverage')
        return BeverageOrderItemSerializer(beverage_items, many=True).data


class OrderUpdateSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    processed_by = UserSerializer(read_only=True)
    original_order_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = OrderUpdate
        fields = [
            'id', 'original_order', 'original_order_id', 'update_type', 'status',
            'items_changes', 'created_by', 'processed_by', 'created_at', 'processed_at',
            'notes', 'rejection_reason', 'total_addition_cost'
        ]
        read_only_fields = ['id', 'original_order', 'created_at', 'processed_at', 'total_addition_cost']
    
    def create(self, validated_data):
        # Extract the original_order_id and remove it from validated_data
        original_order_id = validated_data.pop('original_order_id')
        
        # Get the current user
        user = self.context['request'].user
        
        # Create the order update
        order_update = OrderUpdate.objects.create(
            original_order_id=original_order_id,
            created_by=user,
            **validated_data
        )
        
        # Recalculate the total cost
        order_update.recalculate_total()
        
        return order_update
    
    def validate_items_changes(self, value):
        """Validate the items_changes JSON structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("items_changes must be a dictionary")
        
        update_type = self.initial_data.get('update_type')
        
        if update_type == 'addition':
            if 'items' not in value:
                raise serializers.ValidationError("addition updates must include 'items' array")
            
            items = value['items']
            if not isinstance(items, list) or len(items) == 0:
                raise serializers.ValidationError("items must be a non-empty array")
            
            for item in items:
                if not all(key in item for key in ['name', 'quantity', 'price']):
                    raise serializers.ValidationError("Each item must have name, quantity, and price")
                
                # Convert quantity and price to numbers for validation
                try:
                    quantity = int(item['quantity'])
                    price = float(item['price'])
                except (ValueError, TypeError):
                    raise serializers.ValidationError("Quantity must be an integer and price must be a number")
                
                if quantity <= 0:
                    raise serializers.ValidationError("Item quantity must be greater than 0")
                
                if price <= 0:
                    raise serializers.ValidationError("Item price must be greater than 0")
                
                # Update the item with converted values
                item['quantity'] = quantity
                item['price'] = price
        
        elif update_type == 'modification':
            if 'modifications' not in value:
                raise serializers.ValidationError("modification updates must include 'modifications' array")
            
            modifications = value['modifications']
            if not isinstance(modifications, list) or len(modifications) == 0:
                raise serializers.ValidationError("modifications must be a non-empty array")
            
            for mod in modifications:
                if 'item_id' not in mod:
                    raise serializers.ValidationError("Each modification must include item_id")
        
        elif update_type == 'removal':
            if 'removals' not in value:
                raise serializers.ValidationError("removal updates must include 'removals' array")
            
            removals = value['removals']
            if not isinstance(removals, list) or len(removals) == 0:
                raise serializers.ValidationError("removals must be a non-empty array")
            
            for removal in removals:
                if 'item_id' not in removal:
                    raise serializers.ValidationError("Each removal must include item_id")
        
        return value

class OrderUpdateActionSerializer(serializers.Serializer):
    """Serializer for accepting/rejecting order updates"""
    action = serializers.ChoiceField(choices=['accept', 'reject'])
    notes = serializers.CharField(required=False, allow_blank=True)
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        action = data['action']
        
        if action == 'reject' and not data.get('rejection_reason'):
            raise serializers.ValidationError("Rejection reason is required when rejecting an update")
        
        return data
