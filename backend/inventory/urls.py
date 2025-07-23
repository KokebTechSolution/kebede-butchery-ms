# inventory/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, StockViewSet, InventoryRequestViewSet, BranchViewSet, BarmanStockViewSet, ItemTypeViewSet, CategoryViewSet, ProductUnitViewSet, ProductMeasurementViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
#router.register(r'inventory', ProductViewSet)
router.register(r'stocks', StockViewSet)
router.register(r'requests', InventoryRequestViewSet)
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'barman-stock', BarmanStockViewSet, basename='barmanstock')
router.register(r'itemtypes', ItemTypeViewSet, basename='itemtype')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'productunits', ProductUnitViewSet, basename='productunit')
router.register(r'productmeasurements', ProductMeasurementViewSet, basename='productmeasurement')

urlpatterns = [
    path('', include(router.urls)),
]
