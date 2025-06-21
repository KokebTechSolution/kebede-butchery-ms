# users/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
from rest_framework import serializers
from django.contrib.auth import get_user_model
class UserLoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'branch_id']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
<<<<<<< HEAD
        # Add serialized user data to the response, including groups
        user_data = UserSerializer(self.user).data
        user_data["groups"] = list(self.user.groups.values_list("name", flat=True))
=======
        # Add serialized user data to the response
        user_data = UserLoginSerializer(self.user).data
>>>>>>> waiter_and_manager
        data.update({"user": user_data})
        return data

# For detailed list/retrieve views
class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'username', 'email',
            'role', 'branch_id', 'is_active', 'date_joined',
            'is_staff', 'is_superuser'
        ]
        read_only_fields = fields

# For creating/updating users (secure password handling)
class UserCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'username', 'email',
            'role', 'branch_id', 'is_active', 'password'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
