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
    InventoryRequest, Stock, Branch
)
from .serializers import (
    ItemTypeSerializer, CategorySerializer, ProductSerializer,
    InventoryTransactionSerializer, InventoryRequestSerializer,
    StockSerializer, BranchSerializer
)
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
    @transaction.atomic
    def accept(self, request, pk=None):
        req = self.get_object()
        if req.status != 'pending':
            return Response({'error': 'Request already processed.'}, status=400)

        product = req.product
        qty = Decimal(req.quantity)
        unit = req.unit_type
        branch = req.branch
        bottles_per_carton = product.bottles_per_carton or 0

        stock, _ = Stock.objects.select_for_update().get_or_create(
            product=product,
            branch=branch,
            defaults={
                'carton_quantity': Decimal('0.00'),
                'bottle_quantity': Decimal('0.00'),
                'unit_quantity': Decimal('0.00'),
                'minimum_threshold': Decimal('0.00'),
            }
        )

        # Deduct stock based on unit type
        if product.uses_carton:
            if unit == 'carton':
                if stock.carton_quantity < qty:
                    return Response({'error': 'Not enough carton stock.'}, status=400)
                stock.carton_quantity -= qty
                stock.bottle_quantity -= qty * bottles_per_carton
            elif unit == 'bottle':
                if stock.bottle_quantity < qty:
                    return Response({'error': 'Not enough bottle stock.'}, status=400)
                stock.bottle_quantity -= qty
            else:
                return Response({'error': 'Invalid unit.'}, status=400)
        else:
            if unit != 'unit' or stock.unit_quantity < qty:
                return Response({'error': 'Invalid or insufficient unit stock.'}, status=400)
            stock.unit_quantity -= qty

        stock.save()
        stock.check_running_out()

        # Update InventoryRequest status
        req.status = 'accepted'
        req.reached_status = False
        req.save()

        # Create InventoryTransaction record for sale
        InventoryTransaction.objects.create(
            product=product,
            transaction_type='sale',
            quantity=qty,
            unit_type=unit,
            branch=branch
        )

        return Response({'message': 'Request accepted successfully. Awaiting delivery confirmation.'})

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def reach(self, request, pk=None):
        req = self.get_object()

        if req.status != 'accepted':
            return Response({'error': 'Request must be accepted before marking as reached.'}, status=400)

        if req.reached_status:
            return Response({'error': 'Request already marked as reached.'}, status=400)

        product = req.product
        qty = Decimal(req.quantity)
        unit = req.unit_type
        branch = req.branch
        bottles_per_carton = product.bottles_per_carton or 0

        try:
            stock = Stock.objects.select_for_update().get(product=product, branch=branch)
        except Stock.DoesNotExist:
            return Response({'error': 'Stock not found for the given product and branch.'}, status=400)

        bartender = request.user
        if not bartender.is_authenticated:
            return Response({'error': 'Authentication required.'}, status=403)

        # ✅ Auto-create BarmanStock if not exists
        barman_stock, _ = BarmanStock.objects.select_for_update().get_or_create(
            stock=stock,
            bartender=bartender,
            defaults={
                'carton_quantity': 0,
                'bottle_quantity': 0,
                'unit_quantity': 0,
                'minimum_threshold': stock.minimum_threshold,
                'running_out': False,
            }
        )

        # ✅ Update stock
        if product.uses_carton:
            if unit == 'carton':
                barman_stock.carton_quantity += qty
                barman_stock.bottle_quantity += qty * bottles_per_carton
            elif unit == 'bottle':
                barman_stock.bottle_quantity += qty
            else:
                return Response({'error': 'Invalid unit type for carton-based product.'}, status=400)
        else:
            if unit != 'unit':
                return Response({'error': 'Invalid unit type for unit-based product.'}, status=400)
            barman_stock.unit_quantity += qty

        barman_stock.save()

        req.reached_status = True
        req.save()

        return Response({'detail': 'Request marked as reached and bartender stock updated.'}, status=status.HTTP_200_OK)
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def reject(self, request, pk=None):
        req = self.get_object()
        if req.status != 'pending':
            return Response({'error': 'Request already processed.'}, status=400)

        req.status = 'rejected'
        req.save()
        return Response({'message': 'Request rejected successfully.'}, status=200)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def not_reach(self, request, pk=None):
        req = self.get_object()

        if req.status != 'accepted':
            return Response({'error': 'Request must be accepted before marking as not reached.'}, status=400)

        if not req.reached_status:
            return Response({'error': 'Request already marked as not reached.'}, status=400)

        req.reached_status = False
        req.save()

        return Response({'detail': 'Request marked as not reached.'}, status=status.HTTP_200_OK)
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['post'])
    def restock(self, request, pk=None):
        return self.handle_transaction(request, pk, 'restock')

    @action(detail=True, methods=['post'])
    def sale(self, request, pk=None):
        return self.handle_transaction(request, pk, 'sale')

    @action(detail=True, methods=['post'])
    def wastage(self, request, pk=None):
        return self.handle_transaction(request, pk, 'wastage')

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        product = self.get_object()
        transactions = InventoryTransaction.objects.filter(product=product).order_by('-transaction_date')
        serializer = InventoryTransactionSerializer(transactions, many=True)
        return Response({
            'product': ProductSerializer(product).data,
            'transactions': serializer.data
        })



    @action(detail=False, methods=['get'])
    def available(self, request):
        product_ids = Stock.objects.filter(
            models.Q(bottle_quantity__gt=0) | models.Q(unit_quantity__gt=0)
        ).values_list('product_id', flat=True).distinct()
        products = Product.objects.filter(id__in=product_ids)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)


    def handle_transaction(self, request, pk, transaction_type):
        product = self.get_object()
        quantity = request.data.get('quantity')
        unit_type = request.data.get('unit_type')
        branch_name = request.data.get('branch_name')

        if not all([quantity, unit_type, branch_name]):
            return Response({'error': 'Quantity, unit_type, and branch_name are required.'}, status=400)

        try:
            quantity = float(quantity)
            if quantity <= 0:
                return Response({'error': 'Quantity must be greater than zero.'}, status=400)
        except ValueError:
            return Response({'error': 'Quantity must be a valid number.'}, status=400)

        try:
            branch = Branch.objects.get(name=branch_name)
        except Branch.DoesNotExist:
            return Response({'error': f'Branch with name "{branch_name}" does not exist.'}, status=400)

        stock, _ = Stock.objects.get_or_create(product=product, branch=branch)

        if product.uses_carton and unit_type == 'carton':
            if transaction_type != 'restock' and stock.carton_quantity < quantity:
                return Response({'error': 'Insufficient carton stock.'}, status=400)
            stock.carton_quantity += quantity if transaction_type == 'restock' else -quantity

        elif product.uses_carton and unit_type == 'bottle':
            if transaction_type != 'restock' and stock.bottle_quantity < quantity:
                return Response({'error': 'Insufficient bottle stock.'}, status=400)
            stock.bottle_quantity += quantity if transaction_type == 'restock' else -quantity

        elif not product.uses_carton and unit_type == 'unit':
            if transaction_type != 'restock' and stock.unit_quantity < quantity:
                return Response({'error': 'Insufficient unit stock.'}, status=400)
            stock.unit_quantity += quantity if transaction_type == 'restock' else -quantity

        else:
            return Response({'error': 'Invalid unit type for this product.'}, status=400)

        stock.save()
        stock.check_running_out()

        InventoryTransaction.objects.create(
            product=product,
            transaction_type=transaction_type,
            quantity=quantity,
            unit_type=unit_type,
            branch=branch
        )

        return Response({'message': f'{transaction_type.title()} transaction recorded successfully.'})


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

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data
        product_id = data.get('product_id')
        branch_id = data.get('branch_id')

        if not product_id or not branch_id:
            return Response({'error': 'product_id and branch_id are required.'}, status=400)

        try:
            product = Product.objects.get(pk=product_id)
            branch = Branch.objects.get(pk=branch_id)
        except Product.DoesNotExist:
            return Response({'error': 'Invalid product_id.'}, status=400)
        except Branch.DoesNotExist:
            return Response({'error': 'Invalid branch_id.'}, status=400)

        try:
            carton_quantity = Decimal(data.get('carton_quantity', 0))
            bottle_quantity = Decimal(data.get('bottle_quantity', 0))
            unit_quantity = Decimal(data.get('unit_quantity', 0))
            minimum_threshold = Decimal(data.get('minimum_threshold', 0))
        except Exception:
            return Response({'error': 'Quantities and thresholds must be valid numbers.'}, status=400)

        existing_stock = Stock.objects.filter(
            product__name=product.name,
            branch=branch
        ).first()

        if existing_stock:
            existing_stock.carton_quantity += carton_quantity
            existing_stock.bottle_quantity += bottle_quantity
            existing_stock.unit_quantity += unit_quantity
            if minimum_threshold > 0:
                existing_stock.minimum_threshold = minimum_threshold
            existing_stock.save()
            stock = existing_stock
            created = False
        else:
            stock = Stock.objects.create(
                product=product,
                branch=branch,
                carton_quantity=carton_quantity,
                bottle_quantity=bottle_quantity,
                unit_quantity=unit_quantity,
                minimum_threshold=minimum_threshold,
                running_out=False
            )
            created = True

        stock.check_running_out()

        if carton_quantity > 0:
            InventoryTransaction.objects.create(
                product=product, transaction_type='restock',
                quantity=carton_quantity, unit_type='carton', branch=branch
            )
        if bottle_quantity > 0:
            InventoryTransaction.objects.create(
                product=product, transaction_type='restock',
                quantity=bottle_quantity, unit_type='bottle', branch=branch
            )
        if unit_quantity > 0:
            InventoryTransaction.objects.create(
                product=product, transaction_type='restock',
                quantity=unit_quantity, unit_type='unit', branch=branch
            )

        serializer = self.get_serializer(stock)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

from rest_framework import viewsets, permissions
from .models import BarmanStock
from .serializers import BarmanStockSerializer

class BarmanStockViewSet(viewsets.ModelViewSet):
    queryset = BarmanStock.objects.select_related('stock__product', 'stock__branch', 'bartender')
    serializer_class = BarmanStockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return self.queryset
        return self.queryset.filter(bartender=user)


    def perform_create(self, serializer):
        # Automatically set bartender to current user
        serializer.save(bartender=self.request.user)


