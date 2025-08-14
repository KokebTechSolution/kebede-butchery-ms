
from rest_framework import serializers
from .models import Branch

from rest_framework import serializers
from .models import Table


class BranchSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [
            'id',
            'name',
            'location',
            'city',
            'subcity',
            'wereda',
            'display_name',
        ]

    def get_display_name(self, obj):
        return f"{obj.name} - {obj.city}, {obj.subcity}, {obj.wereda}"

class TableSerializer(serializers.ModelSerializer):
    branch = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Table
        fields = ['id', 'branch', 'number', 'seats', 'status', 'created_by', 'created_by_username']

    def validate(self, data):
        user = self.context['request'].user
        number = data.get('number')
        print(f"[DEBUG] TableSerializer validate - User: {user.username}, Number: {number}")
        print(f"[DEBUG] Existing tables for user: {Table.objects.filter(created_by=user).count()}")
        if Table.objects.filter(number=number, created_by=user).exists():
            print(f"[DEBUG] Validation error - table {number} already exists for user {user.username}")
            raise serializers.ValidationError("A table with this number already exists for this waiter.")
        print(f"[DEBUG] Validation passed for table {number}")
        return data 
