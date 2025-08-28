# users/views.py

import os
from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action

from rest_framework.exceptions import NotFound, PermissionDenied

from rest_framework.exceptions import PermissionDenied
from orders.models import Order
from branches.models import Table
from django.db.models import Q

from .serializers import (
    UserListSerializer,
    UserCreateUpdateSerializer,
    PasswordResetSerializer,
    SelfPasswordUpdateSerializer,
    UserLoginSerializer,
)
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

@csrf_exempt
def test_logout(request):
    print('test_logout called, method:', request.method)
    if request.method == 'POST':
        return JsonResponse({'ok': True})
    return JsonResponse({'error': 'Only POST allowed'}, status=405)

@csrf_exempt
def emergency_login_test(request):
    """Emergency test endpoint that bypasses all ORM to test raw database access"""
    print('[EMERGENCY TEST] Called with method:', request.method)
    
    response_data = {
        'status': 'emergency_test_working',
        'method': request.method,
        'timestamp': str(timezone.now()),
    }
    
    # Test database connection with raw SQL
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            # Test basic query
            cursor.execute("SELECT COUNT(*) FROM users_user")
            user_count = cursor.fetchone()[0]
            response_data['database_connection'] = 'working'
            response_data['user_count'] = user_count
            
            # Test user table structure
            cursor.execute("PRAGMA table_info(users_user)")
            columns = cursor.fetchall()
            response_data['user_table_columns'] = [col[1] for col in columns]
            
            # Test authentication if POST with credentials
            if request.method == 'POST':
                try:
                    import json
                    data = json.loads(request.body.decode('utf-8'))
                    username = data.get('username')
                    password = data.get('password')
                    
                    if username and password:
                        cursor.execute("SELECT id, username, password, is_active FROM users_user WHERE username = %s", [username])
                        row = cursor.fetchone()
                        
                        if row:
                            from django.contrib.auth.hashers import check_password
                            if check_password(password, row[2]) and row[3]:
                                response_data['emergency_auth'] = 'success'
                                response_data['user_id'] = row[0]
                            else:
                                response_data['emergency_auth'] = 'invalid_credentials'
                        else:
                            response_data['emergency_auth'] = 'user_not_found'
                    else:
                        response_data['emergency_auth'] = 'missing_credentials'
                        
                except Exception as auth_error:
                    response_data['emergency_auth'] = f'error: {str(auth_error)}'
            
    except Exception as db_error:
        response_data['database_connection'] = f'error: {str(db_error)}'
    
    response = JsonResponse(response_data)
    
    # Add CORS headers
    response['Access-Control-Allow-Origin'] = 'https://kebede-butchery-ms-1.onrender.com'
    response['Access-Control-Allow-Credentials'] = 'true'
    response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
    response['Access-Control-Allow-Methods'] = 'DELETE, GET, OPTIONS, PATCH, POST, PUT'
    
    return response

@csrf_exempt
def create_user_emergency(request):
    """Emergency user creation endpoint for production"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)
        
    print('[EMERGENCY CREATE] User creation request received')
    
    try:
        import json
        from django.db import connection
        from django.contrib.auth.hashers import make_password
        from django.utils import timezone
        
        data = json.loads(request.body.decode('utf-8'))
        username = data.get('username', 'beki')
        password = data.get('password', '12345678')
        first_name = data.get('first_name', 'beki')
        last_name = data.get('last_name', 'boss')
        
        with connection.cursor() as cursor:
            # Check if user already exists
            cursor.execute("SELECT COUNT(*) FROM users_user WHERE username = %s", [username])
            if cursor.fetchone()[0] > 0:
                return JsonResponse({
                    'status': 'error',
                    'message': f'User {username} already exists'
                })
            
            # Create user with raw SQL
            hashed_password = make_password(password)
            cursor.execute("""
                INSERT INTO users_user 
                (username, password, first_name, last_name, email, 
                 is_superuser, is_staff, is_active, date_joined)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, [
                username, hashed_password, first_name, last_name,
                f'{username}@kebede.com', False, False, True, timezone.now()
            ])
            
            # Get the created user ID
            cursor.execute("SELECT id FROM users_user WHERE username = %s", [username])
            user_id = cursor.fetchone()[0]
            
            response_data = {
                'status': 'success',
                'message': f'User {username} created successfully',
                'user_id': user_id,
                'username': username,
                'test_login_credentials': {
                    'username': username,
                    'password': password
                }
            }
            
    except Exception as e:
        response_data = {
            'status': 'error',
            'message': f'Failed to create user: {str(e)}'
        }
    
    response = JsonResponse(response_data)
    
    # Add CORS headers
    response['Access-Control-Allow-Origin'] = 'https://kebede-butchery-ms-1.onrender.com'
    response['Access-Control-Allow-Credentials'] = 'true'
    response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
    response['Access-Control-Allow-Methods'] = 'DELETE, GET, OPTIONS, PATCH, POST, PUT'
    
    return response

@csrf_exempt
def session_logout(request):
    print("session_logout called, method:", request.method)
    if request.method == 'POST':
        from django.contrib.auth import logout
        logout(request)
        try:
            request.session.flush()
            request.session.clear()
            request.session.delete()
        except Exception as e:
            print("Session clear/delete error:", e)
        try:
            from django.contrib.sessions.models import Session
            if request.session.session_key:
                Session.objects.filter(session_key=request.session.session_key).delete()
        except Exception as e:
            print("Session DB delete error:", e)
        response = JsonResponse({
            "message": "Logged out successfully.",
            "redirect_url": "http://localhost:3000/login"
        })
        response.delete_cookie('sessionid', path='/')
        response.delete_cookie('sessionid', path='')
        response.delete_cookie('sessionid', domain=None)
        response.delete_cookie('sessionid', domain=request.get_host().split(':')[0])
        return response
    return JsonResponse({'error': 'Only POST allowed'}, status=405)

User = get_user_model()


class SessionLoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Health check endpoint"""
        try:
            from users.models import User
            user_count = User.objects.count()
            
            # Test serializer
            from users.serializers import UserLoginSerializer
            
            return Response({
                "status": "Login endpoint is working", 
                "method": "GET",
                "user_count": user_count,
                "serializer_import": "success",
                "django_settings": os.environ.get('DJANGO_SETTINGS_MODULE', 'not set')
            })
        except Exception as e:
            return Response({
                "status": "error in health check",
                "error": str(e),
                "error_type": str(type(e))
            }, status=500)

    def options(self, request, *args, **kwargs):
        """Handle preflight OPTIONS requests"""
        from django.http import HttpResponse
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = 'https://kebede-butchery-ms-1.onrender.com'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
        response['Access-Control-Allow-Methods'] = 'DELETE, GET, OPTIONS, PATCH, POST, PUT'
        response['Access-Control-Max-Age'] = '3600'
        response.status_code = 200
        return response

    def post(self, request):
        print(f"[LOGIN DEBUG] Starting login request")
        print(f"[LOGIN DEBUG] Request method: {request.method}")
        print(f"[LOGIN DEBUG] Request content type: {request.content_type}")
        print(f"[LOGIN DEBUG] Request headers: {dict(request.headers)}")
        
        try:
            # Log the request data
            print(f"[LOGIN DEBUG] Raw request data: {request.data}")
            
            username = request.data.get("username")
            password = request.data.get("password")
            
            print(f"[LOGIN DEBUG] Extracted username: '{username}', password: {'[HIDDEN]' if password else 'None'}")
            
            if not username or not password:
                print(f"[LOGIN DEBUG] Missing credentials - username: {bool(username)}, password: {bool(password)}")
                response = Response({"error": "Username and password are required"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                print(f"[LOGIN DEBUG] Attempting authentication...")
                try:
                    user = authenticate(request, username=username, password=password)
                    print(f"[LOGIN DEBUG] Authentication result: {user}")
                except Exception as auth_error:
                    print(f"[LOGIN DEBUG] Authentication failed with database error: {auth_error}")
                    # If authentication fails due to database issues, try manual verification
                    try:
                        from django.db import connection
                        from django.contrib.auth.hashers import check_password
                        
                        with connection.cursor() as cursor:
                            cursor.execute("SELECT id, username, password, is_active FROM users_user WHERE username = %s", [username])
                            row = cursor.fetchone()
                            
                            if row and check_password(password, row[2]) and row[3]:  # id, username, password, is_active
                                # Create minimal user object for login
                                user = User(id=row[0], username=row[1], is_active=row[3])
                                print(f"[LOGIN DEBUG] Manual authentication successful: {user}")
                            else:
                                user = None
                                print(f"[LOGIN DEBUG] Manual authentication failed")
                    except Exception as manual_auth_error:
                        print(f"[LOGIN DEBUG] Manual authentication also failed: {manual_auth_error}")
                        user = None

                if user:
                    print(f"[LOGIN DEBUG] User authenticated, logging in...")
                    login(request, user)  # sets session
                    print(f"[LOGIN DEBUG] Session created, serializing user data...")
                    
                    try:
                        serializer = UserLoginSerializer(user)
                        serializer_data = serializer.data
                        print(f"[LOGIN DEBUG] Serialization successful: {serializer_data}")
                        response = Response(serializer_data)
                    except Exception as serializer_error:
                        print(f"[LOGIN DEBUG] Serializer error: {str(serializer_error)}")
                        import traceback
                        traceback.print_exc()
                        
                        # If serialization fails, return minimal user data
                        try:
                            minimal_data = {
                                'id': user.id,
                                'username': user.username,
                                'first_name': getattr(user, 'first_name', ''),
                                'last_name': getattr(user, 'last_name', ''),
                                'role': getattr(user, 'role', 'user'),
                                'phone_number': None,
                                'branch_id': None,
                                'branch_name': None
                            }
                            print(f"[LOGIN DEBUG] Using minimal fallback data: {minimal_data}")
                            response = Response(minimal_data)
                        except Exception as fallback_error:
                            print(f"[LOGIN DEBUG] Even fallback failed: {str(fallback_error)}")
                            response = Response({"error": f"Login successful but data serialization failed: {str(serializer_error)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                else:
                    print(f"[LOGIN DEBUG] Authentication failed for username: {username}")
                    response = Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        
        except Exception as e:
            # Ensure we always return JSON, even on server errors
            print(f"[LOGIN DEBUG] Exception occurred: {str(e)}")
            print(f"[LOGIN DEBUG] Exception type: {type(e)}")
            import traceback
            traceback.print_exc()
            response = Response({"error": f"Internal server error during login: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Add CORS headers to ALL responses
        response['Access-Control-Allow-Origin'] = 'https://kebede-butchery-ms-1.onrender.com'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
        response['Access-Control-Allow-Methods'] = 'DELETE, GET, OPTIONS, PATCH, POST, PUT'
        
        return response
@ensure_csrf_cookie
def get_csrf(request):
    response = JsonResponse({"message": "CSRF cookie set"})
    
    # Add CORS headers
    response['Access-Control-Allow-Origin'] = 'https://kebede-butchery-ms-1.onrender.com'
    response['Access-Control-Allow-Credentials'] = 'true'
    response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
    response['Access-Control-Allow-Methods'] = 'DELETE, GET, OPTIONS, PATCH, POST, PUT'
    
    return response

@csrf_exempt
def simple_login(request):
    """Simple login endpoint with explicit CORS handling"""
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = 'https://kebede-butchery-ms-1.onrender.com'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
        response['Access-Control-Allow-Methods'] = 'DELETE, GET, OPTIONS, PATCH, POST, PUT'
        response['Access-Control-Max-Age'] = '3600'
        return response
    
    if request.method == 'POST':
        import json
        try:
            # Try to parse JSON body
            if request.content_type == 'application/json':
                data = json.loads(request.body.decode('utf-8'))
                username = data.get("username")
                password = data.get("password")
            else:
                # Fallback to form data
                username = request.POST.get("username")
                password = request.POST.get("password")
        except (json.JSONDecodeError, UnicodeDecodeError):
            username = request.POST.get("username")
            password = request.POST.get("password")
        
        user = authenticate(request, username=username, password=password)
        
        if user:
            login(request, user)
            response = JsonResponse(UserLoginSerializer(user).data)
        else:
            response = JsonResponse({"error": "Invalid credentials"}, status=401)
    else:
        response = JsonResponse({"error": "Method not allowed"}, status=405)
    
    # Add CORS headers to ALL responses
    response['Access-Control-Allow-Origin'] = 'https://kebede-butchery-ms-1.onrender.com'
    response['Access-Control-Allow-Credentials'] = 'true'
    response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
    response['Access-Control-Allow-Methods'] = 'DELETE, GET, OPTIONS, PATCH, POST, PUT'
    
    return response


class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserCreateUpdateSerializer
        return UserListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'owner':
            return User.objects.all()
        elif user.role == 'manager':
            return User.objects.filter(branch=user.branch)
        return User.objects.none()

    def get_object(self):
        lookup_value = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)
        if str(self.request.user.pk) == str(lookup_value):
            return self.request.user
        queryset = self.filter_queryset(self.get_queryset())
        obj = queryset.filter(pk=lookup_value).first()
        if not obj:
            raise NotFound("User not found or access denied.")
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_create(self, serializer):
        if self.request.user.role not in ['manager', 'owner']:
            raise PermissionDenied("Only managers or owners can create users.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.pk == serializer.instance.pk:
            serializer.save()
            return
        if self.request.user.role != 'manager':
            raise PermissionDenied("Only managers can update users.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'manager':
            raise PermissionDenied("Only managers can delete users.")
        instance.delete()

    # 👇 Self password update endpoint (for logged-in users)
    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        user = request.user
        serializer = SelfPasswordUpdateSerializer(user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "Password changed successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 👇 Reset password for other users (admin only)
    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        user = self.get_object()
        if user.pk != request.user.pk and request.user.role not in ['manager', 'owner']:
            raise PermissionDenied("You can't reset this user's password.")
        new_password = request.data.get("password")
        if not new_password:
            return Response({"error": "Password is required"}, status=400)
        user.set_password(new_password)
        user.save()

        return Response({"status": "Password reset successfully"})

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]  # Restore proper authentication

    def options(self, request, *args, **kwargs):
        """Handle preflight OPTIONS requests"""
        response = Response()
        response['Access-Control-Allow-Origin'] = 'https://kebede-butchery-ms-1.onrender.com'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
        response['Access-Control-Allow-Methods'] = 'DELETE, GET, OPTIONS, PATCH, POST, PUT'
        response['Access-Control-Max-Age'] = '3600'
        return response

    def get(self, request):
        print("CurrentUserView: session_key=", request.session.session_key, "user=", request.user, "is_authenticated=", request.user.is_authenticated)
        
        # With proper permission classes, this should only execute if authenticated
        serializer = UserLoginSerializer(request.user)
        response = Response(serializer.data)
        
        # Add CORS headers to response
        response['Access-Control-Allow-Origin'] = 'https://kebede-butchery-ms-1.onrender.com'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
        response['Access-Control-Allow-Methods'] = 'DELETE, GET, OPTIONS, PATCH, POST, PUT'
        
        return response


class WaiterUnsettledTablesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from users.models import User
        waiters = User.objects.filter(role='waiter')
        result = []
        for waiter in waiters:
            # Find orders for this waiter that are ready for printing
            # (have payment option, all items processed, but not yet printed)
            orders = Order.objects.filter(
                created_by=waiter,
                cashier_status='pending',  # Still pending (not printed)
                payment_option__isnull=False  # Has payment method selected
            ).select_related('table')
            
            # Filter orders where all items are processed (accepted/rejected)
            ready_orders = []
            for order in orders:
                if order.items.exists() and all(item.status in ['accepted', 'rejected'] for item in order.items.all()):
                    ready_orders.append(order)
            
            if ready_orders:
                table_numbers = list({o.table.number for o in ready_orders if o.table})
                total_amount = sum([o.total_money or 0 for o in ready_orders])
                result.append({
                    'name': waiter.get_full_name() or waiter.username,
                    'tables': table_numbers,
                    'amount': float(total_amount),
                    'orders': len(ready_orders),
                })
        return Response(result)
# ✅ Custom User Login Serializer
