# inventory/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views # Assuming your views are in inventory/views.py

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'products', views.ProductViewSet, basename='product') # Changed to 'product' (singular)
router.register(r'itemtypes', views.ItemTypeViewSet, basename='itemtype')
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'transactions', views.InventoryTransactionViewSet, basename='inventorytransaction')
router.register(r'requests', views.InventoryRequestViewSet, basename='inventoryrequest')
router.register(r'stocks', views.StockViewSet, basename='stock')
router.register(r'branches', views.BranchViewSet, basename='branch')
router.register(r'barman-stock', views.BarmanStockViewSet, basename='barmanstock')


# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
]

# If you have any non-ViewSet-based custom API endpoints, you'd add them here
# For example:
# urlpatterns += [
#     path('some-custom-report/', views.some_custom_report_view, name='custom-report'),
# ]