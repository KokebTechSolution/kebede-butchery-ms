from .views import OrderListView, OrderDetailView
from django.urls import path

urlpatterns = [
    path('order-list/', OrderListView.as_view(), name='order-list'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]
