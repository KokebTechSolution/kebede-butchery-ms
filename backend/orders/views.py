from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Order
from .serializers import OrderSerializer, FoodOrderSerializer, DrinkOrderSerializer
from django.utils import timezone
from rest_framework.response import Response

class OrderListView(generics.ListCreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        
        today = timezone.now().date()
        today_str = today.strftime('%Y%m%d')
        
        last_order_today = Order.objects.filter(created_at__date=today).order_by('created_at').last()
        
        if last_order_today and last_order_today.order_number.startswith(today_str):
            last_seq = int(last_order_today.order_number.split('-')[-1])
            new_seq = last_seq + 1
        else:
            new_seq = 1
            
        new_order_number = f"{today_str}-{new_seq:02d}"
        
        while Order.objects.filter(order_number=new_order_number).exists():
            new_seq += 1
            new_order_number = f"{today_str}-{new_seq:02d}"

        # Determine initial statuses based on items ordered
        items_data = self.request.data.get('items', [])
        has_food = any(item.get('item_type') == 'food' for item in items_data)
        has_drinks = any(item.get('item_type') == 'drink' for item in items_data)

        food_status = 'pending' if has_food else 'not_applicable'
        drink_status = 'pending' if has_drinks else 'not_applicable'

        serializer.save(
            created_by=user, 
            order_number=new_order_number,
            food_status=food_status,
            drink_status=drink_status
        )


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]


class FoodOrderListView(generics.ListAPIView):
    serializer_class = FoodOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Order.objects.filter(food_status__in=['pending', 'preparing']).distinct()

class DrinkOrderListView(generics.ListAPIView):
    serializer_class = DrinkOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Order.objects.filter(drink_status__in=['pending', 'preparing']).distinct()
