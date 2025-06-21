from django.shortcuts import render

from rest_framework import viewsets, permissions
from orders.models import Order
from inventory.models import InventoryItem, InventoryRequest
from .serializers import OrderSerializer, InventoryItemSerializer, InventoryRequestSerializer
from users.models import User

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer

class IsWaiter(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Waiter').exists()

class IsBartender(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Bartender').exists()

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            permission_classes = [IsWaiter]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer

    def get_permissions(self):
        if self.action == 'list':
            permission_classes = [IsBartender]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

class InventoryRequestViewSet(viewsets.ModelViewSet):
    queryset = InventoryRequest.objects.all()
    serializer_class = InventoryRequestSerializer

    def get_permissions(self):
        permission_classes = [permissions.IsAuthenticated]  # Expand for managers only on approve/reject
        return [permission() for permission in permission_classes]


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
