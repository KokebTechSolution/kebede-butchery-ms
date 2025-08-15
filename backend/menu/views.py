# menu/views.py

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from .models import Menu, MenuItem, MenuSection, MenuCategory
from .serializers import (
    MenuSerializer,
    MenuItemSerializer,
    MenuSectionSerializer,
    MenuCategorySerializer
)

from inventory.models import Stock


class MenuViewSet(viewsets.ModelViewSet):
    queryset = Menu.objects.all()
    serializer_class = MenuSerializer

    @action(detail=True, methods=['get'])
    def available_items(self, request, pk=None):
        menu = self.get_object()
        available_sections = []
        
        # Get the user and their role
        user = request.user
        user_role = getattr(user, 'role', None)
        
        print(f"[DEBUG] MenuViewSet.available_items - User: {user.username}, Role: {user_role}")

        for section in menu.sections.all():
            # Include items that are available and either:
            # - have a product and the product's stock is not running out
            # - or have no product (e.g., food items)
            available_items = section.menuitem_set.filter(is_available=True).distinct()
            
            # Apply role-based filtering
            if user_role == 'bartender':
                available_items = available_items.filter(item_type='beverage')
                print(f"[DEBUG] Bartender - filtering section '{section.name}' to beverage items only")
            elif user_role == 'meat':
                available_items = available_items.filter(item_type='food')
                print(f"[DEBUG] Meat staff - filtering section '{section.name}' to food items only")
            
            filtered_items = []
            for item in available_items:
                if item.product:
                    # Only include if product's stock is not running out
                    stock_qs = item.product.stock_set.all()
                    if not stock_qs.exists() or not stock_qs.filter(running_out=False).exists():
                        continue
                # If no product, always include (food item)
                filtered_items.append(item)

            if filtered_items:
                available_sections.append({
                    'id': section.id,
                    'name': section.name,
                    'items': [
                        {
                            'id': item.id,
                            'product_name': item.product.name if item.product else item.name,
                            'description': item.description,
                            'price': item.price
                        }
                        for item in filtered_items
                    ]
                })

        return Response({
            'menu_id': menu.id,
            'menu_name': menu.name,
            'sections': available_sections
        })


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filter menu items by user role and branch
        - Bartenders can only see beverage items
        - Meat staff can only see food items
        - Other roles see all items (filtered by branch)
        """
        queryset = super().get_queryset()
        
        # Get the user and their role
        user = self.request.user
        user_role = getattr(user, 'role', None)
        
        print(f"[DEBUG] MenuItemViewSet - User: {user.username}, Role: {user_role}")
        print(f"[DEBUG] MenuItemViewSet - Initial queryset count: {queryset.count()}")
        
        # Check if we should bypass filtering for debugging
        bypass_filtering = self.request.query_params.get('bypass_filtering', 'false').lower() == 'true'
        if bypass_filtering:
            print(f"[DEBUG] Bypassing all filtering for debugging - showing all menu items")
            return queryset.filter(is_available=True)
        
        # TEMPORARY: Simplified filtering for debugging
        # Just filter by availability and role, skip complex branch filtering for now
        queryset = queryset.filter(is_available=True)
        print(f"[DEBUG] After availability filter: {queryset.count()}")
        
        # Role-based filtering
        if user_role == 'bartender':
            # Bartenders can only see beverage items
            queryset = queryset.filter(item_type='beverage')
            print(f"[DEBUG] Bartender - filtering to beverage items only, count after role filter: {queryset.count()}")
            
        elif user_role == 'meat':
            # Meat staff can only see food items
            queryset = queryset.filter(item_type='food')
            print(f"[DEBUG] Meat staff - filtering to food items only, count after role filter: {queryset.count()}")
        
        # Skip complex branch filtering for now - just show all available items for the user's role
        print(f"[DEBUG] Final queryset count: {queryset.count()}")
        
        # Additional debugging - show what items are available
        if queryset.count() > 0:
            print(f"[DEBUG] Available menu items: {list(queryset.values_list('name', 'item_type', 'is_available'))}")
        else:
            print(f"[DEBUG] No menu items available after all filtering")
        
        return queryset

    def get_serializer_context(self):
        """
        Add branch_id to serializer context for stock filtering
        """
        context = super().get_serializer_context()
        user = self.request.user
        if hasattr(user, 'branch') and user.branch:
            context['branch_id'] = user.branch.id
        return context

    def perform_create(self, serializer):
        # ✅ Ensures the product_id is saved properly
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'], permission_classes=[], url_path='test')
    def test_endpoint(self, request):
        """
        Temporary test endpoint that doesn't require authentication
        """
        from .models import MenuItem
        items = MenuItem.objects.filter(is_available=True)
        return Response({
            'message': 'Test endpoint working',
            'total_items': items.count(),
            'items': [
                {
                    'id': item.id,
                    'name': item.name,
                    'item_type': item.item_type,
                    'category': item.category.name if item.category else None,
                    'price': str(item.price),
                    'is_available': item.is_available
                }
                for item in items
            ]
        })


class MenuSectionViewSet(viewsets.ModelViewSet):
    queryset = MenuSection.objects.all()
    serializer_class = MenuSectionSerializer


class MenuCategoryViewSet(viewsets.ModelViewSet):
    queryset = MenuCategory.objects.all()
    serializer_class = MenuCategorySerializer
