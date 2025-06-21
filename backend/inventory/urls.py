from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryItemViewSet, InventoryRequest

router = DefaultRouter()
router.register(r'items', InventoryItemViewSet)
router.register(r'requests', InventoryRequest)

urlpatterns = [
    path('', include(router.urls)),
]
