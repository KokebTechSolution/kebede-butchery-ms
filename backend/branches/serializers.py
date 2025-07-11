from rest_framework import serializers
from .models import Table

class TableSerializer(serializers.ModelSerializer):
    branch = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Table
        fields = ['id', 'branch', 'number', 'seats', 'status', 'created_by', 'created_by_username']

    def validate(self, data):
        user = self.context['request'].user
        number = data.get('number')
        if Table.objects.filter(number=number, created_by=user).exists():
            raise serializers.ValidationError("A table with this number already exists for this waiter.")
        return data 