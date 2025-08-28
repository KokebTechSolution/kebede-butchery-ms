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
        
        # Add phone_number field safely - handle both 'phone' and 'phone_number' column names
        try:
            # Try phone_number first (preferred name)
            phone = getattr(instance, 'phone_number', None)
            if phone is None:
                # Fallback to 'phone' column if phone_number doesn't exist
                phone = getattr(instance, 'phone', None)
            data['phone_number'] = phone
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
            'id', 'username', 'first_name', 'last_name',
            'role', 'branch', 'branch_id', 'branch_name', 'is_active', 'password'
        ]
        read_only_fields = ['id', 'branch_id', 'branch_name']
        
    def to_representation(self, instance):
        """Custom representation to handle missing fields gracefully"""
        data = super().to_representation(instance)
        
        # Add phone_number field safely - handle both 'phone' and 'phone_number' column names
        try:
            # Try phone_number first (preferred name)
            phone = getattr(instance, 'phone_number', None)
            if phone is None:
                # Fallback to 'phone' column if phone_number doesn't exist
                phone = getattr(instance, 'phone', None)
            data['phone_number'] = phone
        except AttributeError:
            data['phone_number'] = None
            
        return data

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        
        # Handle phone_number safely - remove it from validated_data to avoid database errors
        phone_number = validated_data.pop('phone_number', None)
        
        # Create user with only safe fields first
        user = User(**validated_data)
        
        # Set password if provided
        if password:
            user.set_password(password)
            
        # Save user first with core fields
        user.save()
        
        # Now try to add phone_number if the database supports it
        if phone_number:
            try:
                # Check if the field exists in the database by trying to set and save
                user.phone_number = phone_number
                user.save()
            except Exception as e:
                # If it fails (column doesn't exist), just continue without phone_number
                print(f"Phone number not saved - database column missing: {e}")
                pass
                
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        phone_number = validated_data.pop('phone_number', None)
        
        # Update regular fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        # Handle password update
        if password:
            instance.set_password(password)
            
        # Save instance first with core fields
        instance.save()
        
        # Handle phone_number update safely
        if phone_number is not None:
            try:
                instance.phone_number = phone_number
                instance.save()
            except Exception as e:
                # If it fails (column doesn't exist), just continue without phone_number
                print(f"Phone number not updated - database column missing: {e}")
                pass
                
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


