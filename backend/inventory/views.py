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
        req = self.get_object();
        if req.status != 'pending':
            return Response({'detail': 'Request is not pending.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            stock = Stock.objects.get(product=req.product, branch=req.branch)
            # Convert request quantity to base units
            conversion_factor = req.product.get_conversion_factor(req.request_unit, req.product.base_unit)
            quantity_in_base_units = (req.quantity * conversion_factor).quantize(Decimal('0.01'))
            if stock.quantity_in_base_units < quantity_in_base_units:
                return Response({'detail': 'Not enough stock to fulfill request.'}, status=status.HTTP_400_BAD_REQUEST)
            stock.quantity_in_base_units -= quantity_in_base_units
            stock.quantity_in_base_units = stock.quantity_in_base_units.quantize(Decimal('0.01'))
            # Update original_quantity and original_unit to reflect this deduction
            stock.original_quantity = req.quantity
            stock.original_unit = req.request_unit
            stock.save(update_fields=['quantity_in_base_units', 'original_quantity', 'original_unit'])
        except Stock.DoesNotExist:
            return Response({'detail': 'No stock found for this product and branch.'}, status=status.HTTP_400_BAD_REQUEST)
        req.status = 'accepted'
        req.save()
        return Response({'status': 'accepted'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def reach(self, request, pk=None):
        req = self.get_object()
        if req.status != 'accepted':
            return Response({'detail': 'Request is not accepted.'}, status=status.HTTP_400_BAD_REQUEST)
        # Only update if not already fulfilled
        if req.status != 'fulfilled':
            req.status = 'fulfilled'
            req.reached_status = True
            req.responded_by = request.user
            req.save()  # This triggers InventoryRequest.save(), which creates the transaction
        return Response({'reached_status': True}, status=status.HTTP_200_OK)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        # Custom create to handle initial stock with correct conversion
        with transaction.atomic():
            response = super().create(request, *args, **kwargs)
            product_id = response.data.get('id')
            product = Product.objects.get(id=product_id)
            # Expect initial stock info in request.data
            stock_data = request.data.get('initial_stock')
            if stock_data:
                branch_id = stock_data.get('branch_id')
                original_quantity = Decimal(stock_data.get('original_quantity'))
                original_unit_id = stock_data.get('original_unit_id')
                branch = Branch.objects.get(id=branch_id)
                original_unit = ProductUnit.objects.get(id=original_unit_id)
                conversion_factor = product.get_conversion_factor(original_unit, product.base_unit)
                quantity_in_base_units = original_quantity * conversion_factor
                Stock.objects.create(
                    product=product,
                    branch=branch,
                    quantity_in_base_units=quantity_in_base_units,
                    original_quantity=original_quantity,
                    original_unit=original_unit,
                    minimum_threshold_base_units=Decimal(stock_data.get('minimum_threshold_base_units', 0)),
                )
            return response

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

    @action(detail=True, methods=['post'], url_path='restock')
    @transaction.atomic
    def restock(self, request, pk=None):
        stock = self.get_object()
        product = stock.product
        data = request.data
        try:
            restock_quantity = Decimal(data.get('quantity'))
            restock_type = data.get('type')  # 'carton', 'bottle', or 'unit'
            restock_unit = ProductUnit.objects.get(unit_name=restock_type)
            restock_price = data.get('price_at_transaction')
            if restock_price is None or str(restock_price).strip() == '' or Decimal(restock_price) <= 0:
                return Response({'detail': 'Purchase price is required for restock transactions.'}, status=status.HTTP_400_BAD_REQUEST)
            conversion_factor = product.get_conversion_factor(restock_unit, product.base_unit)
            quantity_in_base_units = restock_quantity * conversion_factor
            user = request.user if request.user.is_authenticated else None
            username = user.username if user else "API"
            InventoryTransaction.objects.create(
                product=product,
                transaction_type='restock',
                quantity=restock_quantity,
                transaction_unit=restock_unit,
                to_stock_main=stock,
                branch=stock.branch,
                initiated_by=user,
                price_at_transaction=Decimal(restock_price),
                notes=f"Restocked {restock_quantity} {restock_unit.unit_name}(s) by {username}"
            )
            # Update original_quantity and original_unit on the stock
            stock.original_quantity = restock_quantity
            stock.original_unit = restock_unit
            stock.save(update_fields=['original_quantity', 'original_unit'])
            return Response({'detail': 'Restocked successfully.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'Restock failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


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


