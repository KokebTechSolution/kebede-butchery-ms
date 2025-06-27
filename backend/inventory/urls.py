from rest_framework.routers import DefaultRouter
from inventory.views import ItemTypeViewSet, CategoryViewSet, ProductViewSet, InventoryTransactionViewSet

router = DefaultRouter()

# Product inventory management
router.register(r'inventory', ProductViewSet)

# Item types and categories
router.register(r'itemtypes', ItemTypeViewSet)
router.register(r'categories', CategoryViewSet)

# Unified inventory transactions (restock, sale, wastage)
router.register(r'transactions', InventoryTransactionViewSet)

urlpatterns = router.urls
