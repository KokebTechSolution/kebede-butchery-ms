from .views import OrderListView, OrderDetailView, FoodOrderListView, BeverageOrderListView, UpdateCashierStatusView, PrintedOrderListView, UpdatePaymentOptionView, PrintOrderView, AcceptbeverageOrderView, DailySalesSummaryView, SalesReportView, OrderItemStatusUpdateView, WaiterStatsView, test_order_update, get_waiter_actions_view
from django.urls import path

urlpatterns = [
    path('order-list/', OrderListView.as_view(), name='order-list-create'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/update-cashier-status/', UpdateCashierStatusView.as_view(), name='update-cashier-status'),
    path('<int:pk>/update-payment-option/', UpdatePaymentOptionView.as_view(), name='update-payment-option'),
    path('<int:pk>/print/', PrintOrderView.as_view(), name='print-order'),
    path('food/', FoodOrderListView.as_view(), name='food-order-list'),
    path('beverages/', BeverageOrderListView.as_view(), name='beverage-order-list'),
    path('printed-orders/', PrintedOrderListView.as_view(), name='printed-order-list'),
    path('<int:pk>/accept-beverage/', AcceptbeverageOrderView.as_view(), name='accept-beverage-order'),
    path('sales-summary/', DailySalesSummaryView.as_view(), name='sales-summary'),
    path('sales-report/', SalesReportView.as_view(), name='sales-report'),
    path('order-item/<int:pk>/update-status/', OrderItemStatusUpdateView.as_view(), name='order-item-update-status'),
    path('waiter-stats/<int:waiter_id>/', WaiterStatsView.as_view(), name='waiter-stats'),
    path('test-update/<int:order_id>/', test_order_update, name='test-order-update'),
    path('waiter-actions/<int:order_id>/', get_waiter_actions_view, name='waiter-actions'),
]
