# menu/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import MenuItem
from .serializers import MenuItemSerializer, MenuItemCreateSerializer
from inventory.models import Category as InventoryCategory

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return MenuItemCreateSerializer
        return MenuItemSerializer

    def get_queryset(self):
        queryset = MenuItem.objects.all()
        
        # Filter by item type if provided
        item_type = self.request.query_params.get('item_type', None)
        if item_type:
            queryset = queryset.filter(item_type=item_type)
        
        # Filter by availability if provided
        is_available = self.request.query_params.get('is_available', None)
        if is_available is not None:
            queryset = queryset.filter(is_available=is_available.lower() == 'true')
        
        # Filter by category if provided
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        return queryset

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get available inventory categories for menu items"""
        item_type = request.query_params.get('item_type', None)
        
        if item_type:
            # Filter categories by item type
            categories = InventoryCategory.objects.filter(item_type__type_name__iexact=item_type)
        else:
            # Get all categories
            categories = InventoryCategory.objects.all()
        
        category_data = []
        for category in categories:
            category_data.append({
                'id': category.id,
                'name': category.category_name,
                'item_type': category.item_type.type_name
            })
        
        return Response(category_data)

    @action(detail=False, methods=['get'])
    def available_products(self, request):
        """Get available inventory products that can be linked to menu items"""
        from inventory.models import Product
        
        products = Product.objects.all()
        
        # Filter by category if provided
        category_id = request.query_params.get('category', None)
        if category_id:
            products = products.filter(category_id=category_id)
        
        product_data = []
        for product in products:
            product_data.append({
                'id': product.id,
                'name': product.name,
                'category': product.category.category_name,
                'item_type': product.category.item_type.type_name,
                'base_unit': product.base_unit,
                'price_per_unit': product.price_per_unit
            })
        
        return Response(product_data)
