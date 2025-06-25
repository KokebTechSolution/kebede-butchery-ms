from .views import OrderListView, OrderDetailView, FoodOrderListView, DrinkOrderListView
from django.urls import path

urlpatterns = [
    path('order-list/', OrderListView.as_view(), name='order-list-create'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('food/', FoodOrderListView.as_view(), name='food-order-list'),
    path('drinks/', DrinkOrderListView.as_view(), name='drink-order-list'),
]
