from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

# ✅ Login Response Serializer (for session login)
class UserLoginSerializer(serializers.ModelSerializer):
    branch_id = serializers.IntegerField(source='branch.id', read_only=True, allow_null=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'role', 'branch_id', 'branch_name'
        ]
        
    def to_representation(self, instance):
        """Custom representation to handle missing fields gracefully"""
        data = super().to_representation(instance)
        
        # Add phone_number field safely - it might not exist in older databases
        try:
            data['phone_number'] = getattr(instance, 'phone_number', None)
        except AttributeError:
            data['phone_number'] = None
            
        return data


# ✅ User Create/Update Serializer (used by UserViewSet)
class UserCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    branch_id = serializers.IntegerField(source='branch.id', read_only=True, allow_null=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'phone_number',
            'role', 'branch', 'branch_id', 'branch_name', 'is_active', 'password'
        ]
        read_only_fields = ['id', 'branch_id', 'branch_name']

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
    branch_id = serializers.IntegerField(source='branch.id', read_only=True, allow_null=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'role', 'branch_id', 'branch_name', 'is_active', 'date_joined'
        ]
        read_only_fields = fields
        
    def to_representation(self, instance):
        """Custom representation to handle missing fields gracefully"""
        data = super().to_representation(instance)
        
        # Add optional fields safely
        try:
            data['phone_number'] = getattr(instance, 'phone_number', None)
        except AttributeError:
            data['phone_number'] = None
            
        try:
            data['updated_at'] = getattr(instance, 'updated_at', None)
        except AttributeError:
            data['updated_at'] = None
            
        return data


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


