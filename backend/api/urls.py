from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import OrderViewSet, InventoryViewSet, InventoryRequestViewSet
from orders.views import CreateOrderView
from reports.views import GenerateReportView
from .views import MyTokenObtainPairView

router = DefaultRouter()
router.register(r'orders', OrderViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'inventory-requests', InventoryRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('orders/create/', CreateOrderView.as_view()),  # Correct use of class-based view here
    path('reports/generate/', GenerateReportView.as_view()),
    path('auth/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
]
