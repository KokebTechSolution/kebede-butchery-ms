from .views import OrderListView, OrderDetailView, FoodOrderListView, BeverageOrderListView, UpdateCashierStatusView, PrintedOrderListView, UpdatePaymentOptionView, AcceptbeverageOrderView, DailySalesSummaryView, SalesReportView, OrderItemStatusUpdateView, WaiterStatsView, WaiterEarningsView, TopSellingItemsView, ManagerOrdersView
from django.urls import path

urlpatterns = [
    path('order-list/', OrderListView.as_view(), name='order-list-create'),
    path('order-list/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('order-list/<int:pk>/update-cashier-status/', UpdateCashierStatusView.as_view(), name='update-cashier-status'),
    path('order-list/<int:pk>/update-payment-option/', UpdatePaymentOptionView.as_view(), name='update-payment-option'),
    path('food/', FoodOrderListView.as_view(), name='food-order-list'),
    path('beverages/', BeverageOrderListView.as_view(), name='beverage-order-list'),
    path('printed-orders/', PrintedOrderListView.as_view(), name='printed-order-list'),
    path('order-list/<int:pk>/accept-beverage/', AcceptbeverageOrderView.as_view(), name='accept-beverage-order'),
    path('sales-summary/', DailySalesSummaryView.as_view(), name='sales-summary'),
    path('sales-report/', SalesReportView.as_view(), name='sales-report'),
    path('order-item/<int:pk>/update-status/', OrderItemStatusUpdateView.as_view(), name='order-item-update-status'),
    path('waiter-stats/<int:waiter_id>/', WaiterStatsView.as_view(), name='waiter-stats'),
    path('waiter-earnings/', WaiterEarningsView.as_view(), name='waiter-earnings'),
    path('top-selling-items/', TopSellingItemsView.as_view(), name='top-selling-items'),
    path('manager-orders/', ManagerOrdersView.as_view(), name='manager-orders'),
]
