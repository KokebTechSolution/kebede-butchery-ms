from decimal import Decimal
from django.db import transaction, models
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from .models import (
    ItemType, Category, Product, InventoryTransaction, 
    InventoryRequest, Stock, Branch, BarmanStock, ProductUnit, ProductMeasurement
)
from .serializers import (
    ItemTypeSerializer, CategorySerializer, ProductSerializer,
    InventoryTransactionSerializer, InventoryRequestSerializer,
    StockSerializer, BranchSerializer, BarmanStockSerializer, ProductUnitSerializer, ProductMeasurementSerializer
)
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
# Branch
class BranchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [AllowAny]


# Item Type
class ItemTypeViewSet(viewsets.ModelViewSet):
    queryset = ItemType.objects.all()
    serializer_class = ItemTypeSerializer
    permission_classes = [AllowAny]


# Category
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class InventoryRequestViewSet(viewsets.ModelViewSet):
    queryset = InventoryRequest.objects.all()
    serializer_class = InventoryRequestSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['post'])
    def reach(self, request, pk=None):
        request_obj = self.get_object()
        request_obj.reached_status = True
        request_obj.save()

        # Add quantity to BarmanStock for this bartender, product, and branch
        bartender = request.user
        product = request_obj.product
        branch = request_obj.branch
        quantity = request_obj.quantity

        # Find the Stock object for this product and branch
        try:
            stock = Stock.objects.get(product=product, branch=branch)
        except Stock.DoesNotExist:
            return Response({'detail': 'Stock record not found for this product and branch.'}, status=status.HTTP_400_BAD_REQUEST)

        # Find or create the BarmanStock for this stock and bartender
        barman_stock, created = BarmanStock.objects.get_or_create(stock=stock, bartender=bartender)
        barman_stock.unit_quantity += quantity
        barman_stock.save()

        serializer = self.get_serializer(request_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def not_reach(self, request, pk=None):
        request_obj = self.get_object()
        request_obj.reached_status = False
        request_obj.save()
        serializer = self.get_serializer(request_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


# Inventory Transaction
class InventoryTransactionViewSet(viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventoryTransactionSerializer
    permission_classes = [AllowAny]


# Stock
class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.select_related('product', 'branch').all()
    serializer_class = StockSerializer
    permission_classes = [AllowAny]


class BarmanStockViewSet(viewsets.ModelViewSet):
    queryset = BarmanStock.objects.select_related('stock__product', 'stock__branch', 'bartender')
    serializer_class = BarmanStockSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        qs = BarmanStock.objects.select_related('stock__product', 'stock__branch', 'bartender')
        if user.is_staff:
            return qs
        return qs.filter(bartender=user)


class ProductUnitViewSet(viewsets.ModelViewSet):
    queryset = ProductUnit.objects.all()
    serializer_class = ProductUnitSerializer
    permission_classes = [AllowAny]


class ProductMeasurementViewSet(viewsets.ModelViewSet):
    queryset = ProductMeasurement.objects.all()
    serializer_class = ProductMeasurementSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['product']


