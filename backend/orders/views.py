from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Order, OrderItem
from .serializers import OrderSerializer, FoodOrderSerializer, DrinkOrderSerializer
from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.utils.dateparse import parse_date
from payments.models import Payment
from django.db.models import Sum, F, ExpressionWrapper, DecimalField

class OrderListView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Order.objects.filter(created_by=user)
        return Order.objects.none()

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        
        today = timezone.now().date()
        today_str = today.strftime('%Y%m%d')
        
        last_order_today = Order.objects.filter(created_at__date=today).order_by('created_at').last()
        
        if last_order_today and last_order_today.order_number.startswith(today_str):
            last_seq = int(last_order_today.order_number.split('-')[-1])
            new_seq = last_seq + 1
        else:
            new_seq = 1
            
        new_order_number = f"{today_str}-{new_seq:02d}"
        
        while Order.objects.filter(order_number=new_order_number).exists():
            new_seq += 1
            new_order_number = f"{today_str}-{new_seq:02d}"

        # Determine initial statuses based on items ordered
        items_data = self.request.data.get('items', [])
        has_food = any(item.get('item_type') == 'food' for item in items_data)
        has_drinks = any(item.get('item_type') == 'drink' for item in items_data)

        food_status = 'pending' if has_food else 'not_applicable'
        drink_status = 'pending' if has_drinks else 'not_applicable'

        serializer.save(
            created_by=user, 
            order_number=new_order_number,
            food_status=food_status,
            drink_status=drink_status
        )


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]


class FoodOrderListView(generics.ListAPIView):
    serializer_class = FoodOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Order.objects.filter(food_status__in=['pending', 'preparing']).distinct()

class DrinkOrderListView(generics.ListAPIView):
    serializer_class = DrinkOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Order.objects.filter(drink_status__in=['pending', 'preparing']).distinct()


class UpdateCashierStatusView(generics.UpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.cashier_status = 'printed'
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class PrintedOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Order.objects.filter(cashier_status='printed')
        date = self.request.query_params.get('date')
        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        if date:
            queryset = queryset.filter(payment__processed_at__date=parse_date(date))
        if start and end:
            queryset = queryset.filter(payment__processed_at__date__range=[parse_date(start), parse_date(end)])
        return queryset

class UpdatePaymentOptionView(generics.UpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        payment_option = request.data.get('payment_option')
        if payment_option in ['cash', 'online']:
            instance.payment_option = payment_option
            instance.save()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        return Response({'error': 'Invalid payment option'}, status=400)

class AcceptDrinkOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        if order.drink_status == 'pending':
            order.drink_status = 'preparing'
            order.save()
            return Response({'message': 'Drink order accepted and set to preparing.'}, status=status.HTTP_200_OK)
        return Response({'error': 'Order is not in pending state.'}, status=status.HTTP_400_BAD_REQUEST)

class DailySalesSummaryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        date = request.query_params.get('date')
        if not date:
            return Response({'error': 'Date is required'}, status=400)
        payments = Payment.objects.filter(processed_at__date=parse_date(date), is_completed=True)
        total_orders = payments.count()
        total_sales = sum(p.amount for p in payments)
        cash_sales = sum(p.amount for p in payments if p.payment_method == 'cash')
        online_sales = sum(p.amount for p in payments if p.payment_method == 'online')
        return Response({
            'total_orders': total_orders,
            'total_sales': total_sales,
            'cash_sales': cash_sales,
            'online_sales': online_sales,
        })

class SalesReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        if not (start and end):
            return Response({'error': 'Start and end dates are required'}, status=400)
        payments = Payment.objects.filter(processed_at__date__range=[parse_date(start), parse_date(end)], is_completed=True)
        total_orders = payments.count()
        total_sales = sum(p.amount for p in payments)
        cash_sales = sum(p.amount for p in payments if p.payment_method == 'cash')
        online_sales = sum(p.amount for p in payments if p.payment_method == 'online')

        # Get all paid orders in the range
        paid_order_ids = payments.values_list('order_id', flat=True)
        items = OrderItem.objects.filter(order_id__in=paid_order_ids)
        items = items.annotate(
            revenue=ExpressionWrapper(F('quantity') * F('price'), output_field=DecimalField())
        )
        top_items = (
            items.values('name')
            .annotate(quantity=Sum('quantity'), revenue=Sum('revenue'))
            .order_by('-quantity')[:10]
        )
        top_selling_items = [
            {
                'name': i['name'],
                'quantity': i['quantity'],
                'revenue': float(i['revenue']) if i['revenue'] is not None else 0.0
            }
            for i in top_items
        ]

        return Response({
            'total_orders': total_orders,
            'total_sales': total_sales,
            'cash_sales': cash_sales,
            'online_sales': online_sales,
            'top_selling_items': top_selling_items,
        })

class WaiterOrderStatsView(APIView):
    permission_classes = [AllowAny]  # Change to IsAuthenticated in production

    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        orders = Order.objects.filter(created_by=user)
        total_orders = orders.count()
        total_money = orders.aggregate(total=Sum('total_money'))['total'] or 0
        return Response({
            'total_orders': total_orders,
            'total_money': total_money
        })
