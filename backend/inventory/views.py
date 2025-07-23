from decimal import Decimal
from django.db import transaction, models
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
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

    def perform_create(self, serializer):
        # Set requested_by to the current user if not already set
        if not serializer.validated_data.get('requested_by'):
            serializer.save(requested_by=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def accept(self, request, pk=None):
        req = self.get_object()
        if req.status != 'pending':
            return Response({'detail': 'Request is not pending.'}, status=status.HTTP_400_BAD_REQUEST)
        # Reduce stock from main store (in base units)
        try:
            stock = Stock.objects.get(product=req.product, branch=req.branch)
            if stock.quantity_in_base_units < req.quantity:
                return Response({'detail': 'Not enough stock to fulfill request.'}, status=status.HTTP_400_BAD_REQUEST)
            stock.quantity_in_base_units -= req.quantity
            stock.save()
        except Stock.DoesNotExist:
            return Response({'detail': 'No stock found for this product and branch.'}, status=status.HTTP_400_BAD_REQUEST)
        req.status = 'accepted'
        req.save()
        return Response({'status': 'accepted'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        req = self.get_object()
        if req.status != 'pending':
            return Response({'detail': 'Request is not pending.'}, status=status.HTTP_400_BAD_REQUEST)
        req.status = 'rejected'
        req.save()
        return Response({'status': 'rejected'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reach(self, request, pk=None):
        req = self.get_object()
        if req.status != 'accepted':
            return Response({'detail': 'Request is not accepted.'}, status=status.HTTP_400_BAD_REQUEST)
        req.reached_status = True
        req.save()

        # Find the main store stock for this product and branch
        try:
            stock = Stock.objects.get(product=req.product, branch=req.branch)
        except Stock.DoesNotExist:
            return Response({'detail': 'No main store stock found.'}, status=status.HTTP_400_BAD_REQUEST)

        # Find or create the barman stock for this bartender, product, and branch
        barman = req.requested_by  # Make sure this is set when the request is created
        if not barman:
            return Response({'detail': 'No bartender associated with this request.'}, status=status.HTTP_400_BAD_REQUEST)
        barman_stock, created = BarmanStock.objects.get_or_create(
            stock=stock,
            bartender=barman,
            defaults={'quantity_in_base_units': 0, 'branch': req.branch}
        )
        # If branch is not set, set it
        if not barman_stock.branch:
            barman_stock.branch = req.branch
        barman_stock.quantity_in_base_units += req.quantity
        barman_stock.save()

        return Response({'reached_status': True}, status=status.HTTP_200_OK)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'], url_path='available')
    def available(self, request):
        products = Product.objects.filter(is_active=True)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)


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


