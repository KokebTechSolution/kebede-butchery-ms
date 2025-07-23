# inventory/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, StockViewSet, InventoryRequestViewSet, BranchViewSet, BarmanStockViewSet, ItemTypeViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r'inventory', ProductViewSet)
#router.register(r'inventory', ProductViewSet)
router.register(r'stocks', StockViewSet)
router.register(r'requests', InventoryRequestViewSet)
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'barman-stock', BarmanStockViewSet, basename='barmanstock')
router.register(r'itemtypes', ItemTypeViewSet, basename='itemtype')
router.register(r'categories', CategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
]
