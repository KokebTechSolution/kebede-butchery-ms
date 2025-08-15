# payments/views.py
from django.http import JsonResponse
from rest_framework import viewsets, permissions
from .models import Payment, Income
from .serializers import PaymentSerializer, IncomeSerializer
from rest_framework import viewsets, permissions
from .models import Payment, Income
from .serializers import PaymentSerializer, IncomeSerializer

def transaction_list_view(request):
    return JsonResponse({"message": "Payments endpoint ready."})

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Enforce that payment can only be created after waiter prints the bill
        order = serializer.validated_data.get('order')
        if getattr(order, 'cashier_status', None) != 'printed':
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'order': 'Order must be printed by waiter before payment can be processed.'})

        payment = serializer.save(processed_by=self.request.user, is_completed=True)
        # Always use the latest order total
        payment.amount = payment.order.total_money
        payment.save()
        from .models import Income
        Income.objects.create(
            amount=payment.amount,
            cashier=self.request.user,
            branch=payment.order.branch,
            payment=payment
        )

class IncomeViewSet(viewsets.ModelViewSet):
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer
    permission_classes = [permissions.IsAuthenticated]
