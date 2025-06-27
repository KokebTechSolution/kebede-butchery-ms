from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from .models import ItemType, Category, Product, InventoryTransaction
from .serializers import ItemTypeSerializer, CategorySerializer, ProductSerializer, InventoryTransactionSerializer

# ✅ ItemType ViewSet
class ItemTypeViewSet(viewsets.ModelViewSet):
    queryset = ItemType.objects.all()
    serializer_class = ItemTypeSerializer
    permission_classes = [AllowAny]


# ✅ Category ViewSet
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


# ✅ Product ViewSet with Restock and Sale Actions
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    # 🔄 Restock action
    @action(detail=True, methods=['post'])
    def restock(self, request, pk=None):
        product = self.get_object()
        quantity = request.data.get('quantity')
        unit_type = request.data.get('unit_type')

        if quantity is None or unit_type is None:
            return Response({'error': 'Quantity and unit type are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = float(quantity)
            if quantity <= 0:
                return Response({'error': 'Quantity must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Quantity must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Update product stock based on unit type
        if product.uses_carton and unit_type == 'carton':
            product.carton_quantity += int(quantity)
        elif product.uses_carton and unit_type == 'bottle':
            product.bottle_quantity += int(quantity)
        elif not product.uses_carton and unit_type == 'unit':
            product.unit_quantity += quantity
        else:
            return Response({'error': 'Invalid unit type for this product.'}, status=status.HTTP_400_BAD_REQUEST)

        product.check_running_out()
        product.save()

        # ✅ Log inventory transaction
        InventoryTransaction.objects.create(
            product=product,
            transaction_type='restock',
            quantity=quantity,
            unit_type=unit_type
        )

        return Response({'message': 'Stock restocked successfully.'}, status=status.HTTP_200_OK)

    # 🛒 Sale action
    @action(detail=True, methods=['post'])
    def sale(self, request, pk=None):
        product = self.get_object()
        quantity = request.data.get('quantity')
        unit_type = request.data.get('unit_type')

        if quantity is None or unit_type is None:
            return Response({'error': 'Quantity and unit type are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = float(quantity)
            if quantity <= 0:
                return Response({'error': 'Quantity must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Quantity must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Reduce stock based on unit type
        if product.uses_carton and unit_type == 'carton':
            if product.carton_quantity < quantity:
                return Response({'error': 'Insufficient stock in cartons.'}, status=status.HTTP_400_BAD_REQUEST)
            product.carton_quantity -= int(quantity)

        elif product.uses_carton and unit_type == 'bottle':
            if product.bottle_quantity < quantity:
                return Response({'error': 'Insufficient stock in bottles.'}, status=status.HTTP_400_BAD_REQUEST)
            product.bottle_quantity -= int(quantity)

        elif not product.uses_carton and unit_type == 'unit':
            if product.unit_quantity < quantity:
                return Response({'error': 'Insufficient stock in units.'}, status=status.HTTP_400_BAD_REQUEST)
            product.unit_quantity -= quantity

        else:
            return Response({'error': 'Invalid unit type for this product.'}, status=status.HTTP_400_BAD_REQUEST)

        product.check_running_out()
        product.save()

        # ✅ Log inventory transaction
        InventoryTransaction.objects.create(
            product=product,
            transaction_type='sale',
            quantity=quantity,
            unit_type=unit_type
        )

        return Response({'message': 'Sale recorded successfully.'}, status=status.HTTP_200_OK)


# ✅ Inventory Transaction ViewSet (for restock, sale, wastage history)
class InventoryTransactionViewSet(viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventoryTransactionSerializer
    permission_classes = [AllowAny]
