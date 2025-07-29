from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny  # ✅

from users.permissions import IsManager  # ✅ custom
# or just use AllowAny for public

from rest_framework.views import APIView
from rest_framework.response import Response
from orders.models import Order
from django.utils.dateparse import parse_date
from datetime import timedelta

class BranchDashboardView(APIView):
    def get(self, request):
        low_stock = InventoryItem.objects.filter(quantity__lt=5).count()
        total_orders = Order.objects.all().count()
        # More logic here...
        return Response({
            "total_orders": total_orders,
            "low_stock_items": low_stock,
        })

class ReportDashboardView(APIView):
    def get(self, request):
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'Date is required'}, status=400)
        date = parse_date(date_str)
        if not date:
            return Response({'error': 'Invalid date'}, status=400)

        # Today
        today_orders = Order.objects.filter(created_at__date=date)
        total_sold = 0
        total_rejected = 0
        for order in today_orders:
            for item in order.items.all():
                if item.status == 'accepted':
                    total_sold += 1
                elif item.status == 'rejected':
                    total_rejected += 1

        # Yesterday
        yesterday = date - timedelta(days=1)
        yesterday_orders = Order.objects.filter(created_at__date=yesterday)
        yesterday_total_sold = 0
        yesterday_total_rejected = 0
        for order in yesterday_orders:
            for item in order.items.all():
                if item.status == 'accepted':
                    yesterday_total_sold += 1
                elif item.status == 'rejected':
                    yesterday_total_rejected += 1

        # Daily sales for the last 7 days
        daily_sales = []
        for i in range(7):
            d = date - timedelta(days=6-i)
            d_orders = Order.objects.filter(created_at__date=d)
            sold = 0
            rejected = 0
            for order in d_orders:
                for item in order.items.all():
                    if item.status == 'accepted':
                        sold += 1
                    elif item.status == 'rejected':
                        rejected += 1
            daily_sales.append({
                'date': d.isoformat(),
                'sold': sold,
                'rejected': rejected
            })

        return Response({
            'totalSold': total_sold,
            'totalRejected': total_rejected,
            'yesterdayTotalSold': yesterday_total_sold,
            'yesterdayTotalRejected': yesterday_total_rejected,
            'dailySales': daily_sales
        })

class FoodDashboardReportView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'Date is required'}, status=400)
        date = parse_date(date_str)
        if not date:
            return Response({'error': 'Invalid date'}, status=400)

        # Today
        today_orders = Order.objects.filter(created_at__date=date)
        print(f"[DEBUG] Found {today_orders.count()} orders for {date}")
        total_sold = 0
        total_rejected = 0
        for order in today_orders:
            food_items = order.items.filter(item_type='food')
            print(f"[DEBUG] Order {order.id} has {food_items.count()} food items")
            for item in food_items:
                print(f"  [DEBUG] Item {item.name} status: {item.status}")
                if item.status == 'accepted':
                    total_sold += 1
                elif item.status == 'rejected':
                    total_rejected += 1

        # Yesterday
        yesterday = date - timedelta(days=1)
        yesterday_orders = Order.objects.filter(created_at__date=yesterday)
        yesterday_total_sold = 0
        yesterday_total_rejected = 0
        for order in yesterday_orders:
            food_items = order.items.filter(item_type='food')
            for item in food_items:
                if item.status == 'accepted':
                    yesterday_total_sold += 1
                elif item.status == 'rejected':
                    yesterday_total_rejected += 1

        # Daily sales for the last 7 days
        daily_sales = []
        for i in range(7):
            d = date - timedelta(days=6-i)
            d_orders = Order.objects.filter(created_at__date=d)
            sold = 0
            rejected = 0
            for order in d_orders:
                food_items = order.items.filter(item_type='food')
                for item in food_items:
                    if item.status == 'accepted':
                        sold += 1
                    elif item.status == 'rejected':
                        rejected += 1
            daily_sales.append({
                'date': d.isoformat(),
                'sold': sold,
                'rejected': rejected
            })

        return Response({
            'totalSold': total_sold,
            'totalRejected': total_rejected,
            'yesterdayTotalSold': yesterday_total_sold,
            'yesterdayTotalRejected': yesterday_total_rejected,
            'dailySales': daily_sales
        })