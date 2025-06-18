from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token  # ✅ Add this
from .views import OrderViewSet, InventoryViewSet, InventoryRequestViewSet
from orders.views import create_order
from reports.views import GenerateReportView

router = DefaultRouter()
router.register(r'orders', OrderViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'inventory-requests', InventoryRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('orders/create/', create_order),
    path('reports/generate/', GenerateReportView.as_view()),
    path('login/', obtain_auth_token), 
]
