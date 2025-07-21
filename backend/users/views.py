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
User = get_user_model()


class SessionLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(request, username=username, password=password)

        if user:
            login(request, user)  # sets session
            return Response(UserLoginSerializer(user).data)
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
@ensure_csrf_cookie
def get_csrf(request):
    return JsonResponse({"message": "CSRF cookie set"})
class SessionLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("🔒 Logging out session:", request.session.items())
        logout(request)
        request.session.flush()  # ⬅️ Ensures session is destroyed on logout
        return Response({"message": "Logged out successfully."})


class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserCreateUpdateSerializer
        return UserListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            return User.objects.filter(branch=user.branch).exclude(pk=user.pk)
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserLoginSerializer(request.user)
        return Response(serializer.data)

        return Response({'status': 'Password reset successfully'})


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

