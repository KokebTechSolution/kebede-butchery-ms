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
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(request, username=username, password=password)

        if user:
            login(request, user)  # sets session
            response = Response(UserLoginSerializer(user).data)
        else:
            response = Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        
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
        username = request.POST.get("username") or request.data.get("username")
        password = request.POST.get("password") or request.data.get("password")
        
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
            return User.objects.filter(branch_id=user.branch_id)
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
