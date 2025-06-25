from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Product, ItemType
from .serializers import ProductSerializer, ItemTypeSerializer, LowStockProductSerializer


class LowStockProductView(APIView):
    permission_classes = [IsAuthenticated]  # ✅ This must be a class attribute

    def get(self, request):
        try:
            threshold = float('inf')  # ✅ You can make this dynamic later if needed
            all_products = Product.objects.filter(is_active=True)


            serializer = LowStockProductSerializer(all_products, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            print('Low stock API error:', str(e))  # ✅ This will show errors in your Django console
            return Response(
                {'detail': 'Server error while fetching low stock items.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        return [IsAuthenticated()]


class ItemTypeViewSet(viewsets.ModelViewSet):
    queryset = ItemType.objects.all()
    serializer_class = ItemTypeSerializer

"""class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class ItemTypeViewSet(viewsets.ModelViewSet):
    queryset = ItemType.objects.all()
    serializer_class = ItemTypeSerializer
"""