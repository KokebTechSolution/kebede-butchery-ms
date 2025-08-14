from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import index
from django.conf import settings
from django.conf.urls.static import static
from pathlib import Path
import os
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

BASE_DIR = Path(__file__).resolve().parent.parent

@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def test_connection(request):
    """Test endpoint to verify frontend-backend communication"""
    if request.method == "OPTIONS":
        response = JsonResponse({"status": "ok"})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken"
        return response
    
    return JsonResponse({
        "status": "success",
        "message": "Backend is responding!",
        "timestamp": "2025-08-01T05:45:00Z",
        "cors_enabled": True
    })

def api_info(request):
    """Return API information for the root endpoint"""
    # Check if the request wants HTML
    if 'text/html' in request.headers.get('Accept', ''):
        return render(request, 'index.html')
    
    # Otherwise return JSON
    return JsonResponse({
        'message': 'Kebede Butchery Management System API',
        'version': '1.0.0',
        'endpoints': {
            'admin': '/admin/',
            'api': {
                'users': '/api/users/',
                'orders': '/api/orders/',
                'inventory': '/api/inventory/',
                'payments': '/api/payments/',
                'products': '/api/products/',
                'activity': '/api/activity/',
                'menu': '/api/menu/',
                'branches': '/api/branches/',
                'reports': '/api/reports/',
                'owner': '/api/owner/',
            },
            'auth': {
                'token': '/api/token/',
                'token_refresh': '/api/token/refresh/',
            }
        }
    })

urlpatterns = [
    path('', api_info, name='api_info'),
    path('test-connection/', test_connection, name='test-connection'),
    path('admin/', admin.site.urls),

    # APIs
    path('api/users/', include('users.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/products/', include('products.urls')),
    path('api/activity/', include('activity.urls')),
    path('api/menu/', include('menu.urls')),
    path('api/branches/', include('branches.urls')),
    path('api/reports/', include('reports.urls')),

    # JWT Auth
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # React frontend catch-all route (uncommented for serving frontend if needed)
    re_path(r'^(?:.*)/?$', index, name='index'),

    # Owner-specific endpoints
    path('api/owner/', include('owner.urls')),

]

"""if settings.DEBUG:
    urlpatterns += static(
        settings.STATIC_URL,
        document_root=os.path.join(BASE_DIR.parent, 'frontend', 'build', 'static'),
    )"""
