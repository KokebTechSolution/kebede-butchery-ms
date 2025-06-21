from .views import OrderListView
from django.urls import path

urlpatterns = [
    path('order-list/', OrderListView.as_view(), name='order-list'),
]
