from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('admin/', admin.site.urls),

    # User authentication and management
    path('api/users/', include('users.urls')),

    # Order management
    path('api/orders/', include('orders.urls')),

    # Inventory (this is your current working module)
    path('api/inventory/', include('inventory.urls')),

    # Payments
    path('api/payments/', include('payments.urls')),

    # Products (separated from inventory)
    path('api/products/', include('products.urls')),

    # Activity logs
    path('api/activity/', include('activity.urls')),
    # Menu management
    path('api/menu/', include('menu.urls')),

    # Branches and tables
    path('api/branches/', include('branches.urls')),
]
