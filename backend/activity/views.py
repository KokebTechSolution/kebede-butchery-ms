# backend/activity/views.py

from django.utils.timezone import now
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from orders.models import Order  # Adjust this path if needed

User = get_user_model()

class EmployeeActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            active_staff_count = User.objects.filter(is_active=True).count()
            inactive_staff_count = User.objects.filter(is_active=False).count()

            today = now().date()
            orders_processed_today = Order.objects.filter(created_at__date=today).count()

            return Response({
                'active_staff': active_staff_count,
                'inactive_staff': inactive_staff_count,
                'orders_processed': orders_processed_today
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print('Error fetching employee activity:', str(e))
            return Response({'detail': 'Error fetching employee activity.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
