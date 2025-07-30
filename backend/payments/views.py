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
    queryset = Payment.objects.all()  # Add this line
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filter payments by user's branch
        """
        user = self.request.user
        if hasattr(user, 'branch') and user.branch:
            # Filter payments for orders in the user's branch
            queryset = Payment.objects.filter(order__branch=user.branch)
            print(f"[DEBUG] Filtering payments for branch: {user.branch.name}")
        elif user.is_superuser:
            # Superuser can see all payments
            queryset = Payment.objects.all()
            print(f"[DEBUG] Superuser - showing all payments")
        else:
            # For users without branch, show only payments they processed
            queryset = Payment.objects.filter(processed_by=user)
            print(f"[DEBUG] User without branch - showing only own payments")
        
        return queryset

    def perform_create(self, serializer):
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
    queryset = Income.objects.all()  # Add this line
    serializer_class = IncomeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filter income by user's branch
        """
        user = self.request.user
        if hasattr(user, 'branch') and user.branch:
            # Filter income for the user's branch
            queryset = Income.objects.filter(branch=user.branch)
            print(f"[DEBUG] Filtering income for branch: {user.branch.name}")
        elif user.is_superuser:
            # Superuser can see all income
            queryset = Income.objects.all()
            print(f"[DEBUG] Superuser - showing all income")
        else:
            # For users without branch, show only income they generated
            queryset = Income.objects.filter(cashier=user)
            print(f"[DEBUG] User without branch - showing only own income")
        
        return queryset
