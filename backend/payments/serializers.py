from rest_framework import serializers
from .models import Payment, Income

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'order', 'payment_method', 'amount', 'processed_by', 'processed_at', 'is_completed']
        read_only_fields = ['id', 'processed_by', 'processed_at']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['processed_by'] = user
        return super().create(validated_data)

class IncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = ['id', 'date', 'amount', 'cashier', 'branch', 'payment']
        read_only_fields = ['id', 'date', 'cashier'] 