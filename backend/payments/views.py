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
        try:
            user = self.request.user
            print(f"[DEBUG] Creating payment for user: {user.username} (ID: {user.id})")
            print(f"[DEBUG] User branch: {getattr(user, 'branch', 'No branch assigned')}")
            print(f"[DEBUG] Payment data: {serializer.validated_data}")
            
            payment = serializer.save(processed_by=user, is_completed=True)
            print(f"[DEBUG] Payment created with ID: {payment.id}")
            
            # Always use the latest order total
            order = payment.order
            print(f"[DEBUG] Order: {order.order_number}, Total: {order.total_money}, Branch: {order.branch}")
            
            payment.amount = order.total_money
            payment.save()
            print(f"[DEBUG] Payment amount updated to: {payment.amount}")
            
            # Create income record
            from .models import Income
            income = Income.objects.create(
                amount=payment.amount,
                cashier=user,
                branch=order.branch,
                payment=payment
            )
            print(f"[DEBUG] Income record created with ID: {income.id}")
            print(f"[DEBUG] Payment successfully processed and saved!")
            
        except Exception as e:
            print(f"[ERROR] Failed to create payment: {str(e)}")
            print(f"[ERROR] Exception type: {type(e).__name__}")
            import traceback
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            raise

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
