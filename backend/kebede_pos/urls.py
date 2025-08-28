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
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
import json

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

@csrf_exempt
def csrf_free_login(request):
    """CSRF-exempt login endpoint for frontend"""
    # Add CORS headers
    response_headers = {
        'Access-Control-Allow-Origin': 'https://kebede-butchery-ms-1.onrender.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with',
        'Access-Control-Allow-Methods': 'DELETE, GET, OPTIONS, PATCH, POST, PUT',
    }
    
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        for key, value in response_headers.items():
            response[key] = value
        return response
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            username = data.get('username')
            password = data.get('password')
            
            if not username or not password:
                response = JsonResponse({'error': 'Username and password required'}, status=400)
            else:
                # Try Django authenticate first
                user = authenticate(request, username=username, password=password)
                
                # If Django auth fails, try raw SQL fallback
                if not user:
                    from django.db import connection
                    from django.contrib.auth.hashers import check_password
                    from users.models import User
                    
                    try:
                        with connection.cursor() as cursor:
                            cursor.execute("SELECT id, username, password, is_active, first_name, last_name FROM users_user WHERE username = %s", [username])
                            row = cursor.fetchone()
                            
                            if row and check_password(password, row[2]) and row[3]:
                                user = User(
                                    id=row[0],
                                    username=row[1],
                                    is_active=row[3],
                                    first_name=row[4] or '',
                                    last_name=row[5] or ''
                                )
                                user.password = row[2]  # Set for Django login
                    except Exception as e:
                        print(f"Raw SQL auth failed: {e}")
                
                if user:
                    login(request, user)
                    response = JsonResponse({
                        'id': user.id,
                        'username': user.username,
                        'first_name': getattr(user, 'first_name', ''),
                        'last_name': getattr(user, 'last_name', ''),
                        'role': getattr(user, 'role', 'user'),
                        'phone_number': None,
                        'branch_id': None,
                        'branch_name': None
                    })
                else:
                    response = JsonResponse({'error': 'Invalid credentials'}, status=401)
        except Exception as e:
            response = JsonResponse({'error': f'Server error: {str(e)}'}, status=500)
    else:
        response = JsonResponse({'error': 'Method not allowed'}, status=405)
    
    # Add CORS headers to response
    for key, value in response_headers.items():
        response[key] = value
    
    return response

urlpatterns = [
    # CORS Test Endpoint
    path('cors-test/', cors_test_view, name='cors_test'),
    
    # Health Check Endpoint
    path('health/', health_check_view, name='health_check'),
    
    # CSRF-Free Login Endpoint
    path('api/users/csrf-free-login/', csrf_free_login, name='csrf_free_login'),
    
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
