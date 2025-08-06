from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Order, OrderItem
from .serializers import OrderSerializer, FoodOrderSerializer, BeverageOrderSerializer, OrderItemSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Order, OrderItem
from .serializers import OrderSerializer, FoodOrderSerializer, BeverageOrderSerializer, OrderItemSerializer
from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.utils.dateparse import parse_date
from payments.models import Payment
from django.db.models import Sum, F, ExpressionWrapper, DecimalField, Q
from rest_framework.decorators import action
from rest_framework import viewsets
from django.utils.dateparse import parse_date
from payments.models import Payment
from django.db.models import Sum, F, ExpressionWrapper, DecimalField, Q
from rest_framework.decorators import action
from rest_framework import viewsets
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class OrderListView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        
        # Check user role and filter accordingly
        if user.is_superuser:
            # Superuser can see all orders
            queryset = Order.objects.all()
            print(f"[DEBUG] Superuser - showing all orders")
        elif hasattr(user, 'role') and user.role in ['manager', 'owner', 'cashier']:
            # Managers, owners, and cashiers can see all orders in their branch
            if hasattr(user, 'branch') and user.branch:
                queryset = Order.objects.filter(branch=user.branch)
                print(f"[DEBUG] {user.role} - showing all orders for branch: {user.branch.name}")
            else:
                queryset = Order.objects.all()
                print(f"[DEBUG] {user.role} without branch - showing all orders")
        else:
            # Waiters and other users can only see their own orders
            queryset = Order.objects.filter(created_by=user)
            print(f"[DEBUG] Waiter {user.username} - showing only own orders")
        
        table_number = self.request.query_params.get('table_number')
        date = self.request.query_params.get('date')
        
        if table_number:
            queryset = queryset.filter(table_number=table_number)
        if date:
            parsed_date = parse_date(date)
            queryset = queryset.filter(created_at__date=parsed_date)
        
        return queryset

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        # Only allow users in the 'waiter' group to create orders
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
        items_data = self.request.data.get('items', [])
        
        has_food = any(item.get('item_type') == 'food' for item in items_data)
        has_beverages = any(item.get('item_type') == 'beverage' for item in items_data)
        food_status = 'pending' if has_food else 'not_applicable'
        beverage_status = 'pending' if has_beverages else 'not_applicable'
        
        order = serializer.save(
            created_by=user, 
            order_number=new_order_number,
            food_status=food_status,
            beverage_status=beverage_status
        )


@method_decorator(csrf_exempt, name='dispatch')
class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        
        # Check user role and filter accordingly
        if user.is_superuser:
            # Superuser can see all orders
            queryset = Order.objects.prefetch_related('items').all()
            print(f"[DEBUG] Superuser - showing all order details")
        elif hasattr(user, 'role') and user.role in ['manager', 'owner', 'cashier']:
            # Managers, owners, and cashiers can see all orders in their branch
            if hasattr(user, 'branch') and user.branch:
                queryset = Order.objects.filter(branch=user.branch).prefetch_related('items')
                print(f"[DEBUG] {user.role} - showing all order details for branch: {user.branch.name}")
            else:
                queryset = Order.objects.prefetch_related('items').all()
                print(f"[DEBUG] {user.role} without branch - showing all order details")
        else:
            # Waiters and other users can only see their own orders
            queryset = Order.objects.filter(created_by=user).prefetch_related('items')
            print(f"[DEBUG] Waiter {user.username} - showing only own order details")
        
        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class FoodOrderListView(generics.ListAPIView):
    serializer_class = FoodOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        
        # Filter by user's branch
        if hasattr(user, 'branch') and user.branch:
            queryset = Order.objects.filter(
                branch=user.branch,
                food_status__in=['pending', 'preparing', 'completed'],
                cashier_status__in=['pending', 'ready_for_payment', 'printed'],
                items__isnull=False
            ).distinct()
            print(f"[DEBUG] Filtering food orders for branch: {user.branch.name}")
        elif user.is_superuser:
            # Superuser can see all food orders
            queryset = Order.objects.filter(
                food_status__in=['pending', 'preparing', 'completed'],
                cashier_status__in=['pending', 'ready_for_payment', 'printed'],
                items__isnull=False
            ).distinct()
            print(f"[DEBUG] Superuser - showing all food orders")
        else:
            # For users without branch, show only their own food orders
            queryset = Order.objects.filter(
                created_by=user,
                food_status__in=['pending', 'preparing', 'completed'],
                cashier_status__in=['pending', 'ready_for_payment', 'printed'],
                items__isnull=False
            ).distinct()
            print(f"[DEBUG] User without branch - showing only own food orders")
        
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(created_at__date=date)
        
        return queryset
class BeverageOrderListView(generics.ListAPIView):
    serializer_class = BeverageOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        
        # Filter by user's branch
        if hasattr(user, 'branch') and user.branch:
            queryset = Order.objects.filter(
                branch=user.branch,
                beverage_status__in=['pending', 'preparing', 'completed'],
                cashier_status__in=['pending', 'ready_for_payment', 'printed'],
                items__isnull=False
            ).distinct()
            print(f"[DEBUG] Filtering beverage orders for branch: {user.branch.name}")
        elif user.is_superuser:
            # Superuser can see all beverage orders
            queryset = Order.objects.filter(
                beverage_status__in=['pending', 'preparing', 'completed'],
                cashier_status__in=['pending', 'ready_for_payment', 'printed'],
                items__isnull=False
            ).distinct()
            print(f"[DEBUG] Superuser - showing all beverage orders")
        else:
            # For users without branch, show only their own beverage orders
            queryset = Order.objects.filter(
                created_by=user,
                beverage_status__in=['pending', 'preparing', 'completed'],
                cashier_status__in=['pending', 'ready_for_payment', 'printed'],
                items__isnull=False
            ).distinct()
            print(f"[DEBUG] User without branch - showing only own beverage orders")
        
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(created_at__date=date)
        
        return queryset


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
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        
        # Check user role and filter accordingly
        if user.is_superuser:
            # Superuser can see all printed orders
            queryset = Order.objects.filter(
                cashier_status='printed'
            )
            print(f"[DEBUG] Superuser - showing all printed orders")
        elif hasattr(user, 'role') and user.role in ['manager', 'owner', 'cashier']:
            # Managers, owners, and cashiers can see all printed orders in their branch
            if hasattr(user, 'branch') and user.branch:
                queryset = Order.objects.filter(
                    branch=user.branch,
                    cashier_status='printed'
                )
                print(f"[DEBUG] {user.role} - showing all printed orders for branch: {user.branch.name}")
            else:
                queryset = Order.objects.filter(
                    cashier_status='printed'
                )
                print(f"[DEBUG] {user.role} without branch - showing all printed orders")
        else:
            # Waiters and other users can only see their own printed orders
            queryset = Order.objects.filter(
                created_by=user,
                cashier_status='printed'
            )
            print(f"[DEBUG] Waiter {user.username} - showing only own printed orders")
        
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(created_at__date=date)
        
        return queryset

class UpdatePaymentOptionView(generics.UpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        payment_option = request.data.get('payment_option')
        
        print(f"[DEBUG] UpdatePaymentOptionView - Order ID: {instance.id}")
        print(f"[DEBUG] UpdatePaymentOptionView - Order Number: {instance.order_number}")
        print(f"[DEBUG] UpdatePaymentOptionView - Current payment_option: {instance.payment_option}")
        print(f"[DEBUG] UpdatePaymentOptionView - New payment_option: {payment_option}")
        print(f"[DEBUG] UpdatePaymentOptionView - Request user: {request.user}")
        
        if payment_option in ['cash', 'online']:
            instance.payment_option = payment_option
            instance.save()
            print(f"[DEBUG] UpdatePaymentOptionView - Payment option updated successfully to: {instance.payment_option}")
            
            serializer = self.get_serializer(instance)
            response_data = serializer.data
            print(f"[DEBUG] UpdatePaymentOptionView - Response payment_option: {response_data.get('payment_option')}")
            
            return Response(response_data)
        
        print(f"[ERROR] UpdatePaymentOptionView - Invalid payment option: {payment_option}")
        return Response({'error': 'Invalid payment option'}, status=400)

class AcceptbeverageOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        if order.beverage_status == 'pending':
            order.beverage_status = 'preparing'
            order.save()
            return Response({'message': 'beverage order accepted and set to preparing.'}, status=status.HTTP_200_OK)
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


class WaiterStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, waiter_id):
        from users.models import User
        from django.utils import timezone
        
        try:
            waiter = User.objects.get(id=waiter_id)
        except User.DoesNotExist:
            return Response({'error': 'Waiter not found'}, status=404)

        # Get today's date for daily analytics
        today = timezone.now().date()
        
        # Only consider TODAY'S orders that are printed or ready for payment
        todays_orders = Order.objects.filter(
            created_by=waiter, 
            cashier_status__in=['printed', 'ready_for_payment'],
            created_at__date=today
        )
        
        # Calculate today's statistics
        total_orders_today = todays_orders.count()
        total_sales_today = sum(order.total_money or 0 for order in todays_orders if order.total_money)
        
        # Count active tables (tables with pending orders today)
        active_tables_today = Order.objects.filter(
            created_by=waiter,
            created_at__date=today,
            cashier_status__in=['pending', 'ready_for_payment']
        ).values('table_number').distinct().count()

        # Placeholder for rating (could be implemented later)
        average_rating = 0.0
        
        print(f"[DEBUG] Daily Waiter Stats for {waiter.username}: Date={today}, Orders={total_orders_today}, Sales={total_sales_today}, ActiveTables={active_tables_today}")

        return Response({
            'total_orders': total_orders_today,
            'total_sales': total_sales_today,
            'average_rating': average_rating,
            'active_tables': active_tables_today,
            'date': today.isoformat(),
        })
from rest_framework.permissions import AllowAny
from inventory.models import BarmanStock
from django.db import transaction
from decimal import Decimal


class OrderItemStatusUpdateView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def patch(self, request, pk):
        try:
            item = OrderItem.objects.select_related('order').get(pk=pk)
        except OrderItem.DoesNotExist:
            return Response({'error': 'Order item not found'}, status=status.HTTP_404_NOT_FOUND)

        status_value = request.data.get('status')
        if status_value not in ['pending', 'accepted', 'rejected']:
            return Response({'error': 'Invalid status value'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle beverage stock deduction
        if status_value == 'accepted' and item.item_type == 'beverage':
            bartender = request.user
            try:
                barman_stock = BarmanStock.objects.select_related('stock__product').get(
                    bartender=bartender,
                    stock__product__name__iexact=item.name,
                    stock__branch=item.order.branch
                )
            except BarmanStock.DoesNotExist:
                return Response(
                    {'error': f"No barman stock found for '{item.name}'"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if barman_stock.quantity_in_base_units < item.quantity:
                return Response(
                    {
                        'error': (
                            f"Not enough stock. Available: {barman_stock.quantity_in_base_units}, "
                            f"Required: {item.quantity}"
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            product = barman_stock.stock.product
            try:
                # Assuming you have a method to get conversion factor from base unit to original unit
                conversion_factor = product.get_conversion_factor(product.base_unit, barman_stock.original_unit)
                original_quantity_delta = item.quantity / conversion_factor
            except Exception:
                # Fallback: treat original quantity same as base units if conversion unavailable
                original_quantity_delta = item.quantity

            # Use your adjust_quantity method to deduct stock (make sure this method is in BarmanStock or Stock model)
            try:
                barman_stock.adjust_quantity(
                    quantity=item.quantity,
                    unit=product.base_unit,
                    is_addition=False
                )
            except Exception as e:
                return Response({'error': f'Stock adjustment failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Update item status
        item.status = status_value
        item.save()

        # Update order total money based on accepted items
        order = item.order
        accepted_items = order.items.filter(status='accepted')
        order.total_money = sum(i.price * i.quantity for i in accepted_items)

        # Update order cashier status
        all_statuses = list(order.items.values_list('status', flat=True))
        if all(s in ['accepted', 'rejected'] for s in all_statuses):
            order.cashier_status = 'ready_for_payment'
        else:
            order.cashier_status = 'pending'

        order.save()

        return Response(OrderItemSerializer(item).data, status=status.HTTP_200_OK)