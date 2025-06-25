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

        serializer.save(created_by=user, order_number=new_order_number)


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]


class FoodOrderListView(generics.ListAPIView):
    serializer_class = FoodOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Order.objects.filter(items__item_type='food').distinct()

class DrinkOrderListView(generics.ListAPIView):
    serializer_class = DrinkOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Order.objects.filter(items__item_type='drink').distinct()
