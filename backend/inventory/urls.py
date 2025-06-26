from rest_framework.routers import DefaultRouter
from inventory.views import ItemTypeViewSet, CategoryViewSet, ProductViewSet, SaleViewSet, StockMovementViewSet

router = DefaultRouter()
router.register(r'inventory', ProductViewSet)
router.register(r'itemtypes', ItemTypeViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'stockmovements', StockMovementViewSet)

urlpatterns = router.urls
