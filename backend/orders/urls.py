from .views import OrderListView, OrderDetailView, FoodOrderListView, DrinkOrderListView, UpdateCashierStatusView, PrintedOrderListView, UpdatePaymentOptionView, AcceptDrinkOrderView, DailySalesSummaryView, SalesReportView, OrderItemStatusUpdateView
from django.urls import path

urlpatterns = [
    path('order-list/', OrderListView.as_view(), name='order-list-create'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/update-cashier-status/', UpdateCashierStatusView.as_view(), name='update-cashier-status'),
    path('<int:pk>/update-payment-option/', UpdatePaymentOptionView.as_view(), name='update-payment-option'),
    path('food/', FoodOrderListView.as_view(), name='food-order-list'),
    path('drinks/', DrinkOrderListView.as_view(), name='drink-order-list'),
    path('printed-orders/', PrintedOrderListView.as_view(), name='printed-order-list'),
    path('<int:pk>/accept-drink/', AcceptDrinkOrderView.as_view(), name='accept-drink-order'),
    path('sales-summary/', DailySalesSummaryView.as_view(), name='sales-summary'),
    path('sales-report/', SalesReportView.as_view(), name='sales-report'),
    path('order-item/<int:pk>/update-status/', OrderItemStatusUpdateView.as_view(), name='order-item-update-status'),
]
