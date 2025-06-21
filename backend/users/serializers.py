# users/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','first_name', 'username', 'email', 'role', 'branch_id']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add serialized user data to the response, including groups
        user_data = UserSerializer(self.user).data
        user_data["groups"] = list(self.user.groups.values_list("name", flat=True))
        data.update({"user": user_data})
        return data
