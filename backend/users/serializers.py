from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

# ✅ Login Response Serializer (for session login)
class UserLoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'phone_number', 'role', 'branch'
        ]


# ✅ User Create/Update Serializer (used by UserViewSet)
class UserCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'phone_number',
            'role', 'branch', 'is_active', 'password'
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


# ✅ User List Serializer (read-only info for tables)
class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'phone_number',
            'role', 'branch', 'is_active', 'date_joined'
        ]
        read_only_fields = fields


# ✅ Self Password Change Serializer (for logged-in users)
class SelfPasswordUpdateSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True)

    def update(self, instance, validated_data):
        instance.set_password(validated_data['password'])
        instance.save()
        return instance


# ✅ Password Reset Serializer (for managers resetting others)
class PasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True)

    def update(self, instance, validated_data):
        instance.set_password(validated_data['password'])
        instance.save()
        return instance
# 


