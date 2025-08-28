from django.contrib import admin
from django.urls import path, include, re_path
from .jwt_views import CustomTokenObtainPairView, CustomTokenRefreshView
from core.views import index
from django.conf import settings
from django.conf.urls.static import static
from pathlib import Path
import os
import django
from django.http import JsonResponse
from django.utils import timezone

BASE_DIR = Path(__file__).resolve().parent.parent

def cors_test_view(request):
    """Test endpoint to verify CORS middleware is working"""
    return JsonResponse({
        'message': 'CORS test endpoint',
        'method': request.method,
        'origin': request.META.get('HTTP_ORIGIN', 'No Origin'),
        'cors_working': True
    })

def health_check_view(request):
    """Health check endpoint to verify API is working"""
    try:
        from users.models import User
        user_count = User.objects.count()
        
        return JsonResponse({
            'status': 'healthy',
            'timestamp': str(timezone.now()),
            'database': 'connected',
            'users_count': user_count,
            'django_version': django.get_version(),
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'error': str(e),
            'timestamp': str(timezone.now()),
        }, status=500)

urlpatterns = [
    # CORS Test Endpoint
    path('cors-test/', cors_test_view, name='cors_test'),
    
    # Health Check Endpoint
    path('health/', health_check_view, name='health_check'),
    
    # API Welcome Page
    path('', lambda request: JsonResponse({
        'message': 'Welcome to Kebede Butchery Management System API',
        'status': 'running',
        'version': '1.0.0',
        'endpoints': {
            'admin': '/admin/',
            'api': '/api/',
            'products': '/api/products/',
            'users': '/api/users/',
            'orders': '/api/orders/',
            'inventory': '/api/inventory/',
            'payments': '/api/payments/',
            'branches': '/api/branches/',
            'reports': '/api/reports/',
            'auth': {
                'token': '/api/token/',
                'refresh': '/api/token/refresh/'
            }
        }
    }), name='api_welcome'),

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
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),

    # React frontend catch-all route
   #re_path(r'^(?:.*)/?$', index, name='index'),

    # Owner-specific endpoints
    path('api/owner/', include('owner.urls')),

]

"""if settings.DEBUG:
    urlpatterns += static(
        settings.STATIC_URL,
        document_root=os.path.join(BASE_DIR.parent, 'frontend', 'build', 'static'),
    )"""
