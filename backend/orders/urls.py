from django.urls import path
from . import views

urlpatterns = [
    # Existing order URLs
    path('order-list/', views.OrderListView.as_view(), name='order-list-create'),
    path('order-list/<int:pk>/', views.OrderDetailView.as_view(), name='order-detail-by-id'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/update-cashier-status/', views.UpdateCashierStatusView.as_view(), name='update-cashier-status'),
    path('<int:pk>/update-payment-option/', views.UpdatePaymentOptionView.as_view(), name='update-payment-option'),
    path('<int:pk>/print/', views.PrintOrderView.as_view(), name='print-order'),
    path('food/', views.FoodOrderListView.as_view(), name='food-order-list'),
    path('beverages/', views.BeverageOrderListView.as_view(), name='beverage-order-list'),
    path('printed-orders/', views.PrintedOrderListView.as_view(), name='printed-order-list'),
    path('<int:pk>/accept-beverage/', views.AcceptbeverageOrderView.as_view(), name='accept-beverage-order'),
    path('<int:pk>/cancel/', views.CancelOrderView.as_view(), name='cancel-order'),
    path('sales-summary/', views.DailySalesSummaryView.as_view(), name='sales-summary'),
    path('sales-report/', views.SalesReportView.as_view(), name='sales-report'),
    path('order-item/<int:pk>/update-status/', views.OrderItemStatusUpdateView.as_view(), name='order-item-update-status'),
    path('waiter-stats/<int:waiter_id>/', views.WaiterStatsView.as_view(), name='waiter-stats'),
    
    # Waiter actions endpoint
    path('waiter-actions/<int:order_id>/', views.get_waiter_actions_view, name='waiter-actions'),
    
    # Simple add items endpoint
    path('<int:order_id>/add-items/', views.add_items_to_order, name='add-items-to-order'),
    
    # Order updates (using function-based views)
    path('updates/', views.create_order_update, name='create-order-update'),
    path('updates/<int:order_id>/', views.get_order_updates, name='get-order-updates'),
    path('updates/<int:update_id>/process/', views.process_order_update, name='process-order-update'),
    path('pending-updates/', views.get_pending_updates, name='pending-updates'),
    
    # Edit order functionality
    path('<int:order_id>/edit/', views.edit_order_view, name='edit-order'),
    path('<int:order_id>/display/', views.get_order_display_view, name='get-order-display'),
    path('updates/<int:order_update_id>/check-completion/', views.check_order_update_completion_view, name='check-order-update-completion'),
    
    # Test endpoints
    path('test-order-update/<int:order_id>/', views.test_order_update, name='test-order-update'),
]
