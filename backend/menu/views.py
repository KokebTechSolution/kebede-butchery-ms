# menu/views.py

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
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

        for section in menu.sections.all():
            available_items = section.menuitem_set.filter(
                is_available=True,
                product__stock__running_out=False
            ).distinct()

            if available_items.exists():
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
                        for item in available_items
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

    def perform_create(self, serializer):
        # ✅ Ensures the product_id is saved properly
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()


class MenuSectionViewSet(viewsets.ModelViewSet):
    queryset = MenuSection.objects.all()
    serializer_class = MenuSectionSerializer


class MenuCategoryViewSet(viewsets.ModelViewSet):
    queryset = MenuCategory.objects.all()
    serializer_class = MenuCategorySerializer
