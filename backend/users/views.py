from django.contrib.auth import authenticate, get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from orders.models import Order
from branches.models import Table
from django.db.models import Q

from .serializers import (
    CustomTokenObtainPairSerializer,
    UserLoginSerializer,
    UserListSerializer,
    UserCreateUpdateSerializer,
    PasswordResetSerializer
)

User = get_user_model()

# ✅ JWT Login View
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# ✅ Optional Custom Login View
class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token
            serialized_user = UserLoginSerializer(user).data

            return Response({
                'refresh': str(refresh),
                'access': str(access),
                'user': serialized_user
            }, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)




# ✅ Full CRUD with Password Reset
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
            return User.objects.filter(branch_id=user.branch_id)
        return User.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role not in ['manager', 'owner']:
            raise PermissionDenied("Only managers and owners can create users.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != 'manager':
            raise PermissionDenied("Only managers can update users.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'manager':
            raise PermissionDenied("Only managers can delete users.")
        instance.delete()

    # ✅ Custom Password Reset Endpoint
    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('password')

        if not new_password:
            return Response({'error': 'Password is required.'}, status=400)

        user.set_password(new_password)
        user.save()
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
# ✅ Custom User Login Serializer
