from rest_framework.routers import DefaultRouter
from inventory.views import (
    ItemTypeViewSet, CategoryViewSet, ProductViewSet,
    InventoryTransactionViewSet, InventoryRequestViewSet,
    StockViewSet, BranchViewSet, BarmanStockViewSet
)

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
