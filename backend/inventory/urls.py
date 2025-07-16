# inventory/urls.py
from rest_framework.routers import DefaultRouter
from inventory.views import ItemTypeViewSet, CategoryViewSet, ProductViewSet, InventoryTransactionViewSet
from inventory.views import InventoryRequestViewSet
from inventory.views import StockViewSet
from inventory.views import BranchViewSet
from inventory.views import BarmanStockViewSet


router = DefaultRouter()
router.register(r'inventory', ProductViewSet)
router.register(r'itemtypes', ItemTypeViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'transactions', InventoryTransactionViewSet)
router.register(r'requests', InventoryRequestViewSet)
router.register(r'stocks', StockViewSet)
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'barman-stock', BarmanStockViewSet, basename='barmanstock')
urlpatterns = router.urls
