from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, ItemTypeViewSet
from .views import LowStockProductView

router = DefaultRouter()
router.register(r'products', ProductViewSet)  # Correctly define 'products'
router.register(r'item-types', ItemTypeViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('low-stock/', LowStockProductView.as_view(), name='low-stock-products'),
]
