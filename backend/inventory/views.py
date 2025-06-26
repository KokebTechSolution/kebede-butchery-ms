from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import ItemType, Category, Product, Sale, StockMovement
from .serializers import ItemTypeSerializer, CategorySerializer, ProductSerializer, SaleSerializer, StockMovementSerializer

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import ItemType
from .serializers import ItemTypeSerializer
from rest_framework.permissions import AllowAny  # ✅ Add this import at the top

class ItemTypeViewSet(viewsets.ModelViewSet):
    queryset = ItemType.objects.all()
    serializer_class = ItemTypeSerializer
    permission_classes = [AllowAny]  # 🔓 This makes the endpoint public


"""# ✅ ItemType ViewSet
class ItemTypeViewSet(viewsets.ModelViewSet):
    queryset = ItemType.objects.all()
    serializer_class = ItemTypeSerializer"""

# ✅ Category ViewSet
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]  # 🔓 This makes the endpoint public

    """    queryset = Category.objects.all()
            serializer_class = CategorySerializer"""

# ✅ Product ViewSet with Restock and Sale Actions
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    """    queryset = Product.objects.all()
            serializer_class = ProductSerializer"""

    # 🔄 Restock action
    @action(detail=True, methods=['post'])
    def restock(self, request, pk=None):
        print('Request Data:', request.data)

        product = self.get_object()
        try:
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

            # ✅ Update product stock
            product.add_stock(quantity, unit_type)
            product.check_running_out()

            # ✅ Log stock movement
            StockMovement.objects.create(
                product=product,
                movement_type='restock',
                quantity=quantity,
                unit_type=unit_type
            )

            return Response({'message': 'Stock restocked successfully.'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # 🛒 Sale action
    @action(detail=True, methods=['post'])
    def sale(self, request, pk=None):
        product = self.get_object()
        try:
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

            # ✅ Update product stock for sale
            product.remove_stock(quantity, unit_type)
            product.check_running_out()

            # ✅ Log stock movement and sale
            Sale.objects.create(product=product, quantity=quantity, unit_type=unit_type)
            StockMovement.objects.create(
                product=product,
                movement_type='sale',
                quantity=quantity,
                unit_type=unit_type
            )

            return Response({'message': 'Sale recorded successfully.'}, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# ✅ Sale ViewSet
class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer

# ✅ Stock Movement ViewSet
class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer


