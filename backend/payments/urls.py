# payments/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, IncomeViewSet

router = DefaultRouter()
router.register(r'payments', PaymentViewSet)
router.register(r'incomes', IncomeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
