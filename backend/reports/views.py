from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny  # ✅

from users.permissions import IsManager  # ✅ custom
# or just use AllowAny for public

from rest_framework.views import APIView
from rest_framework.response import Response
from inventory.models import InventoryItem
from orders.models import Order

class BranchDashboardView(APIView):
    def get(self, request):
        low_stock = InventoryItem.objects.filter(quantity__lt=5).count()
        total_orders = Order.objects.all().count()
        # More logic here...
        return Response({
            "total_orders": total_orders,
            "low_stock_items": low_stock,
        })