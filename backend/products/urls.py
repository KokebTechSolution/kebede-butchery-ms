from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, ItemTypeViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)  # Correctly define 'products'
router.register(r'item-types', ItemTypeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
