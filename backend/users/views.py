# users/views.py

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
from core.decorators import csrf_exempt_for_cors
from core.session_manager import SessionManager

@csrf_exempt
def test_logout(request):
    print('test_logout called, method:', request.method)
    if request.method == 'POST':
        return JsonResponse({'ok': True})
    return JsonResponse({'error': 'Only POST allowed'}, status=405)

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
        # Get the origin from the request to determine the redirect URL
        origin = request.headers.get('Origin', 'http://localhost:3000')
        redirect_url = f"{origin}/login"
        
        response = JsonResponse({
            "message": "Logged out successfully.",
            "redirect_url": redirect_url
        })
        response.delete_cookie('sessionid', path='/')
        response.delete_cookie('sessionid', path='')
        response.delete_cookie('sessionid', domain=None)
        response.delete_cookie('sessionid', domain=request.get_host().split(':')[0])
        return response
    return JsonResponse({'error': 'Only POST allowed'}, status=405)

User = get_user_model()


@method_decorator(csrf_exempt, name='dispatch')
class SessionLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        
        print(f"[DEBUG] Login attempt for user: {username}")
        print(f"[DEBUG] Request cookies: {dict(request.COOKIES)}")
        print(f"[DEBUG] Request headers: {dict(request.headers)}")
        
        user = authenticate(request, username=username, password=password)
        
        print(f"Authentication result: {user}")

        if user:
            # Use SessionManager to create session
            session_key = SessionManager.create_session(request, user)
            
            print(f"[DEBUG] User authenticated: {user.username}")
            print(f"[DEBUG] Session key after login: {session_key}")
            print(f"[DEBUG] User is authenticated: {request.user.is_authenticated}")
            
            # Create response with user data and session info for network access
            response_data = UserLoginSerializer(user).data
            response_data['session_key'] = session_key
            response_data['csrf_token'] = request.META.get('CSRF_COOKIE', '')
            
            response = Response(response_data)
            
            # Get origin to determine cookie settings
            origin = request.headers.get('Origin', '')
            print(f"[DEBUG] Origin header: {origin}")
            
            # Set session cookie explicitly for network access
            if session_key:
                # Determine cookie domain based on origin
                cookie_domain = None
                if origin and 'localhost' not in origin and '127.0.0.1' not in origin:
                    # Network access - extract hostname for cookie domain
                    try:
                        from urllib.parse import urlparse
                        parsed = urlparse(origin)
                        cookie_domain = parsed.hostname
                        print(f"[DEBUG] Setting cookie domain to: {cookie_domain}")
                    except Exception as e:
                        print(f"[DEBUG] Error parsing origin: {e}")
                        cookie_domain = None
                
                # Set session cookie with proper settings for cross-origin
                response.set_cookie(
                    'sessionid',
                    session_key,
                    max_age=86400,  # 24 hours
                    secure=False,  # Allow HTTP for local development
                    samesite='Lax',  # Works for both local and network
                    httponly=False,
                    path='/',
                    domain=None  # Don't restrict domain - let browser handle it
                )
                print(f"[DEBUG] Session cookie set without domain restriction")
                
                # Also set a custom header to help frontend track session
                response['X-Session-Key'] = session_key
                print(f"[DEBUG] Session key header set: {session_key}")
            
            # Set CSRF cookie if not already set
            if 'csrftoken' not in request.COOKIES:
                csrf_token = request.META.get('CSRF_COOKIE', '')
                if csrf_token:
                    response.set_cookie(
                        'csrftoken',
                        csrf_token,
                        max_age=31449600,  # 1 year
                        secure=False,  # Allow HTTP for local development
                        samesite='Lax',  # Works for both local and network
                        httponly=False,
                        path='/',
                        domain=None  # Don't restrict domain - let browser handle it
                    )
                    print(f"[DEBUG] CSRF cookie set without domain restriction")
            
            print(f"[DEBUG] Response cookies: {dict(response.cookies)}")
            print(f"[DEBUG] Response headers: {dict(response.headers)}")
            return response
        
        print(f"[DEBUG] Authentication failed for user: {username}")
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


@ensure_csrf_cookie
def get_csrf(request):
    # Get CSRF token from Django's CSRF middleware
    from django.middleware.csrf import get_token
    csrf_token = get_token(request)
    
    print(f"[DEBUG] CSRF endpoint called")
    print(f"[DEBUG] CSRF token generated: {csrf_token[:10] if csrf_token else 'None'}...")
    print(f"[DEBUG] Request cookies: {dict(request.COOKIES)}")
    print(f"[DEBUG] Request headers: {dict(request.headers)}")
    
    response = JsonResponse({"message": "CSRF cookie set", "csrf_token": csrf_token})
    
    # Get origin to determine cookie settings
    origin = request.headers.get('Origin', '')
    print(f"[DEBUG] Origin header: {origin}")
    
    # Force CSRF cookie to be set
    if csrf_token:
        # Determine cookie domain based on origin
        cookie_domain = None
        if origin and 'localhost' not in origin and '127.0.0.1' not in origin:
            # Network access - extract hostname for cookie domain
            try:
                from urllib.parse import urlparse
                parsed = urlparse(origin)
                cookie_domain = parsed.hostname
                print(f"[DEBUG] Setting CSRF cookie domain to: {cookie_domain}")
            except Exception as e:
                print(f"[DEBUG] Error parsing origin: {e}")
                cookie_domain = None
        
        response.set_cookie(
            'csrftoken',
            csrf_token,
            max_age=31449600,  # 1 year
            secure=False,  # Allow HTTP for local development
            samesite='Lax',  # Works for both local and network
            httponly=False,
            path='/',
            domain=None  # Don't restrict domain - let browser handle it
        )
        print(f"[DEBUG] CSRF cookie explicitly set without domain restriction")
    else:
        print(f"[DEBUG] No CSRF token generated")
    
    # Also set additional headers for debugging
    response['Access-Control-Allow-Credentials'] = 'true'
    response['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
    
    print(f"[DEBUG] CSRF cookie set in response: {csrf_token[:10] if csrf_token else 'None'}...")
    print(f"[DEBUG] Response headers: {dict(response.headers)}")
    return response

class DebugAuthView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            "session_key": request.session.session_key,
            "user": str(request.user),
            "is_authenticated": request.user.is_authenticated,
            "cookies": dict(request.COOKIES),
            "headers": dict(request.headers),
            "method": request.method,
            "path": request.path,
            "session_data": dict(request.session),
            "sessionid_cookie": request.COOKIES.get('sessionid'),
            "csrftoken_cookie": request.COOKIES.get('csrftoken'),
        })

class TestSessionView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Test setting a session value
        request.session['test_key'] = 'test_value'
        request.session.save()
        return Response({
            "message": "Session test value set",
            "session_key": request.session.session_key,
            "cookies": dict(request.COOKIES),
        })
    
    def get(self, request):
        # Test getting a session value
        test_value = request.session.get('test_key', 'not_found')
        return Response({
            "test_value": test_value,
            "session_key": request.session.session_key,
            "cookies": dict(request.COOKIES),
            "is_authenticated": request.user.is_authenticated,
            "user": str(request.user),
            "session_data": dict(request.session),
        })

class SessionDebugView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Debug endpoint to check session state"""
        return Response({
            "session_key": request.session.session_key,
            "session_data": dict(request.session),
            "user": str(request.user),
            "is_authenticated": request.user.is_authenticated,
            "cookies": dict(request.COOKIES),
            "headers": dict(request.headers),
            "csrf_token": request.META.get('CSRF_COOKIE', ''),
        })


@method_decorator(csrf_exempt, name='dispatch')
class UserViewSet(ModelViewSet):
    serializer_class = UserListSerializer  # Changed from UserSerializer to UserListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filter users by branch for branch managers
        """
        user = self.request.user
        if hasattr(user, 'branch') and user.branch:
            if user.role == 'manager':
                # Branch managers can see all users in their branch
                queryset = User.objects.filter(branch=user.branch)
                print(f"[DEBUG] Filtering users for branch manager: {user.branch.name}")
            elif user.role == 'owner':
                # Owners can see all users
                queryset = User.objects.all()
                print(f"[DEBUG] Owner - showing all users")
            else:
                # Other roles see only themselves
                queryset = User.objects.filter(id=user.id)
                print(f"[DEBUG] User {user.role} - showing only self")
        elif user.is_superuser:
            # Superuser can see all users
            queryset = User.objects.all()
            print(f"[DEBUG] Superuser - showing all users")
        else:
            # For users without branch, show only themselves
            queryset = User.objects.filter(id=user.id)
            print(f"[DEBUG] User without branch - showing only self")
        
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserCreateUpdateSerializer
        return UserListSerializer

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
    permission_classes = [IsAuthenticated]  # Require authentication

    def get(self, request):
        # Django's authentication middleware should have already authenticated the user
        # if the session is valid
        if request.user and request.user.is_authenticated:
            serializer = UserLoginSerializer(request.user)
            return Response(serializer.data)
        
        # If we get here, the user is not authenticated
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)


class WaiterUnsettledTablesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from users.models import User
        waiters = User.objects.filter(role='waiter')
        result = []
        for waiter in waiters:
            # Find orders for this waiter in the required state
            orders = Order.objects.filter(
                created_by=waiter,
                cashier_status='ready_for_payment'
            ).select_related('table')
            table_numbers = list({o.table.number for o in orders if o.table})
            total_amount = sum([o.total_money or 0 for o in orders])
            result.append({
                'name': waiter.get_full_name() or waiter.username,
                'tables': table_numbers,
                'amount': float(total_amount),
                'orders': orders.count(),
            })
        return Response(result)
# ✅ Custom User Login Serializer

@method_decorator(csrf_exempt, name='dispatch')
class TestLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        
        print(f"[DEBUG] Test login attempt for user: {username}")
        
        user = authenticate(request, username=username, password=password)

        if user:
            login(request, user)
            print(f"[DEBUG] Test login successful for: {user.username}")
            return Response({
                "message": "Login successful",
                "user": UserLoginSerializer(user).data,
                "session_key": request.session.session_key
            })
        
        print(f"[DEBUG] Test login failed for user: {username}")
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# Add this new view for CORS testing
class CORSTestView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            "message": "CORS test successful",
            "origin": request.headers.get('Origin'),
            "method": request.method,
            "headers": dict(request.headers)
        })
    
    def post(self, request):
        return Response({
            "message": "CORS POST test successful",
            "data": request.data,
            "origin": request.headers.get('Origin'),
            "method": request.method
        })

class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            "status": "healthy",
            "message": "Backend is running",
            "timestamp": timezone.now().isoformat(),
        })

class CSRFDebugView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        csrf_token = request.META.get('CSRF_COOKIE', '')
        return Response({
            "message": "CSRF Debug",
            "csrf_token_available": bool(csrf_token),
            "csrf_token_length": len(csrf_token),
            "csrf_token_preview": csrf_token[:10] + "..." if csrf_token else "None",
            "cookies": dict(request.COOKIES),
        })
    
    def post(self, request):
        return Response({
            "message": "CSRF POST test successful",
            "csrf_token_received": bool(request.META.get('CSRF_COOKIE')),
            "headers": dict(request.headers),
        })

class CSRFValidationView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        csrf_token_in_header = request.headers.get('X-CSRFToken', 'not found')
        csrf_token_in_cookie = request.COOKIES.get('csrftoken', 'not found')
        csrf_token_expected = request.META.get('CSRF_COOKIE', 'not found')
        
        return Response({
            "message": "CSRF Validation Debug",
            "csrf_token_in_header": csrf_token_in_header,
            "csrf_token_in_cookie": csrf_token_in_cookie,
            "csrf_token_expected": csrf_token_expected,
            "tokens_match": csrf_token_in_header == csrf_token_expected,
            "header_length": len(csrf_token_in_header),
            "cookie_length": len(csrf_token_in_cookie),
            "expected_length": len(csrf_token_expected),
        })

@method_decorator(csrf_exempt, name='dispatch')
class CSRFExemptTestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        return Response({
            "message": "CSRF exempt test successful",
            "data": request.data,
            "method": request.method,
            "headers": dict(request.headers),
            "csrf_token_in_header": request.headers.get('X-CSRFToken', 'not found'),
            "csrf_token_in_cookie": request.COOKIES.get('csrftoken', 'not found'),
        })

class AuthTestView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            "message": "Auth test endpoint",
            "session_key": request.session.session_key,
            "user": str(request.user),
            "is_authenticated": request.user.is_authenticated,
            "cookies": dict(request.COOKIES),
            "session_data": dict(request.session),
        })
    
    def post(self, request):
        return Response({
            "message": "Auth test POST endpoint",
            "session_key": request.session.session_key,
            "user": str(request.user),
            "is_authenticated": request.user.is_authenticated,
            "cookies": dict(request.COOKIES),
            "data": request.data,
        })

class CSRFTestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        # This endpoint requires CSRF token
        return Response({
            "message": "CSRF test successful",
            "csrf_token_received": bool(request.headers.get('X-CSRFToken')),
            "csrf_token_value": request.headers.get('X-CSRFToken', 'not found')[:10] + '...',
            "cookies": dict(request.COOKIES),
        })

# NetworkAuthView and NetworkCurrentUserView have been consolidated into SessionLoginView and CurrentUserView
# Both endpoints now work for both local and network access
