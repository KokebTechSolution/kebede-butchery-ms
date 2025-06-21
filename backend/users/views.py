# users/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated
from .serializers import (
    UserLoginSerializer,
    CustomTokenObtainPairSerializer,
    UserListSerializer
)

User = get_user_model()

class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Ensure only managers can list users
        if user.role != 'manager':
            return Response(
                {"detail": "Only managers can view this data."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Fetch all users in the same branch as the manager
        users = User.objects.filter(branch_id=user.branch_id)

        # Log for debug
        print(f"[INFO] Manager {user.username} retrieved users for branch {user.branch_id}")
        for u in users:
            print(f" - {u.id}: {u.username}, {u.email}, {u.role}")

        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token
            serialized_user = UserLoginSerializer(user).data

            print(f"[LOGIN] {username} logged in successfully")

            return Response({
                'refresh': str(refresh),
                'access': str(access),
                'user': serialized_user
            }, status=status.HTTP_200_OK)
        else:
            print(f"[LOGIN-FAIL] Login failed for {username}")
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
