from rest_framework import generics
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
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .utils import get_waiter_actions
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Order, OrderUpdate
from .serializers import OrderUpdateSerializer, OrderUpdateActionSerializer

@method_decorator(csrf_exempt, name='dispatch')
class OrderListView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        print(f"[DEBUG] OrderListView.get_queryset - User: {user.username if user.is_authenticated else 'Anonymous'}, Role: {getattr(user, 'role', 'None')}, ID: {user.id if user.is_authenticated else 'None'}")
        
        if not user.is_authenticated:
            print(f"[DEBUG] OrderListView.get_queryset - User not authenticated, returning empty queryset")
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
            print(f"[DEBUG] Waiter {user.username} - showing only own orders (created_by={user.id})")
        
        table_number = self.request.query_params.get('table_number')
        date = self.request.query_params.get('date')
        cashier_status = self.request.query_params.get('cashier_status')
        
        print(f"DEBUG: User role: {user.role}")
        print(f"DEBUG: Cashier status filter: {cashier_status}")
        print(f"DEBUG: Date filter: {date}")
        
        # For cashier dashboard, show all orders (not just user's orders)
        if user.role == 'cashier':
            queryset = Order.objects.all()
        else:
            queryset = Order.objects.filter(created_by=user)
            
        if table_number:
            queryset = queryset.filter(table_number=table_number)
        if date:
            parsed_date = parse_date(date)
            queryset = queryset.filter(created_at__date=parsed_date)
        if cashier_status:
            if cashier_status == 'pending':
                # For 'pending' filter, show both 'pending' and 'ready_for_payment' orders
                queryset = queryset.filter(cashier_status__in=['pending', 'ready_for_payment'])
                print(f"DEBUG: Applied pending filter (pending + ready_for_payment)")
            else:
                queryset = queryset.filter(cashier_status=cashier_status)
                print(f"DEBUG: Applied cashier_status filter: {cashier_status}")
            print(f"DEBUG: Query count after filter: {queryset.count()}")
        
        print(f"DEBUG: Final query count: {queryset.count()}")
        return queryset

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        
        # Check if this is an edit operation
        is_edit = self.request.data.get('is_edit', False)
        original_order_id = self.request.data.get('original_order_id')
        
        if is_edit and original_order_id:
            # This is an edit - create a NEW order with same table but new order ID
            try:
                original_order = Order.objects.get(id=original_order_id)
                items_data = self.request.data.get('items', [])
                
                # Generate new order number for the updated order
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
                
                # Create NEW order with same table but new order number
                updated_order = Order.objects.create(
                    order_number=new_order_number,
                    table=original_order.table,  # Keep the same table
                    created_by=user,
                    branch=original_order.branch,
                    food_status='accepted',  # Auto-accept food items for updated orders
                    beverage_status='accepted'  # Auto-accept beverage items for updated orders
                )
                
                # Add all items to the new order
                for item_data in items_data:
                    OrderItem.objects.create(
                        order=updated_order,
                        name=item_data.get('name'),
                        quantity=item_data.get('quantity', 1),
                        price=item_data.get('price', 0),
                        item_type=item_data.get('item_type'),  # Remove default fallback - item_type must be set
                        product_id=item_data.get('product'),
                        status='accepted'  # Auto-accept items for updated orders (no need for bartender approval)
                    )
                
                # Calculate total for the new order
                total = sum(item.price * item.quantity for item in updated_order.items.all())
                updated_order.total_money = total
                updated_order.save()
                
                print(f"[DEBUG] Edit Order - Created NEW order {updated_order.order_number} from original {original_order.order_number}")
                print(f"[DEBUG] Edit Order - Same table: {updated_order.table.number}, New items: {len(items_data)}")
                print(f"[DEBUG] Edit Order - New order ID: {updated_order.id}, Original order ID: {original_order.id}")
                print(f"[DEBUG] Edit Order - Auto-accepted: food_status={updated_order.food_status}, beverage_status={updated_order.beverage_status}")
                
                # Return the NEW order (not the original)
                return updated_order
                
            except Order.DoesNotExist:
                raise ValidationError("Original order not found")
        
        # This is a new order
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

    def list(self, request, *args, **kwargs):
        """
        Custom list method to ensure proper JSON serialization
        """
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        print(f"[DEBUG] OrderDetailView.get_queryset - User: {user.username if user.is_authenticated else 'Anonymous'}")
        print(f"[DEBUG] OrderDetailView.get_queryset - User authenticated: {user.is_authenticated}")
        print(f"[DEBUG] OrderDetailView.get_queryset - User ID: {user.id if user.is_authenticated else 'None'}")
        print(f"[DEBUG] OrderDetailView.get_queryset - User role: {getattr(user, 'role', 'None')}")
        
        if not user.is_authenticated:
            print(f"[DEBUG] OrderDetailView.get_queryset - User not authenticated, returning empty queryset")
            return Order.objects.none()
        
        # Check user role and filter accordingly
        if user.is_superuser:
            # Superuser can see all orders
            queryset = Order.objects.prefetch_related('items').all()
            print(f"[DEBUG] OrderDetailView.get_queryset - Superuser - showing all orders: {queryset.count()}")
        elif hasattr(user, 'role') and user.role in ['manager', 'owner', 'cashier']:
            # Managers, owners, and cashiers can see all orders in their branch
            if hasattr(user, 'branch') and user.branch:
                queryset = Order.objects.filter(branch=user.branch).prefetch_related('items')
                print(f"[DEBUG] OrderDetailView.get_queryset - {user.role} - showing orders for branch {user.branch.name}: {queryset.count()}")
            else:
                queryset = Order.objects.prefetch_related('items').all()
                print(f"[DEBUG] OrderDetailView.get_queryset - {user.role} without branch - showing all orders: {queryset.count()}")
        else:
            # Waiters and other users can only see their own orders
            queryset = Order.objects.filter(created_by=user).prefetch_related('items')
            print(f"[DEBUG] OrderDetailView.get_queryset - Waiter {user.username} - showing own orders: {queryset.count()}")
            print(f"[DEBUG] OrderDetailView.get_queryset - Orders created by user {user.id}: {list(queryset.values_list('id', 'order_number'))}")
        
        return queryset

    def retrieve(self, request, *args, **kwargs):
        """
        Custom retrieve method with better debugging and error handling
        """
        try:
            print(f"[DEBUG] OrderDetailView.retrieve - User: {request.user.username if request.user.is_authenticated else 'Anonymous'}")
            print(f"[DEBUG] OrderDetailView.retrieve - Order ID: {kwargs.get('pk')}")
            print(f"[DEBUG] OrderDetailView.retrieve - User authenticated: {request.user.is_authenticated}")
            print(f"[DEBUG] OrderDetailView.retrieve - User role: {getattr(request.user, 'role', 'None')}")
            
            instance = self.get_object()
            print(f"[DEBUG] OrderDetailView.retrieve - Order found: {instance.id}, Order number: {instance.order_number}")
            
            serializer = self.get_serializer(instance)
            response_data = serializer.data
            print(f"[DEBUG] OrderDetailView.retrieve - Response data keys: {list(response_data.keys())}")
            
            return Response(response_data)
        except Exception as e:
            print(f"[ERROR] OrderDetailView.retrieve - Exception: {str(e)}")
            return Response(
                {"error": f"Failed to retrieve order: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FoodOrderListView(generics.ListAPIView):
    serializer_class = FoodOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        
        # Filter by user's branch and ensure orders actually contain food items
        if hasattr(user, 'branch') and user.branch:
            queryset = Order.objects.filter(
                branch=user.branch,
                food_status__in=['pending', 'preparing', 'completed'],
                cashier_status__in=['pending', 'ready_for_payment', 'printed'],
                items__item_type='food'  # Only orders with food items
            ).prefetch_related('items').distinct()
            print(f"[DEBUG] Filtering food orders for branch: {user.branch.name}")
        elif user.is_superuser:
            # Superuser can see all food orders
            queryset = Order.objects.filter(
                food_status__in=['pending', 'preparing', 'completed'],
                cashier_status__in=['pending', 'ready_for_payment', 'printed'],
                items__item_type='food'  # Only orders with food items
            ).prefetch_related('items').distinct()
            print(f"[DEBUG] Superuser - showing all food orders")
        else:
            # For users without branch, show only their own food orders
            queryset = Order.objects.filter(
                created_by=user,
                food_status__in=['pending', 'preparing', 'completed'],
                cashier_status__in=['pending', 'ready_for_payment', 'printed'],
                items__item_type='food'  # Only orders with food items
            ).prefetch_related('items').distinct()
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
        
        # Filter by user's branch and ensure orders actually contain beverage items
        if hasattr(user, 'branch') and user.branch:
            # Show orders that have beverage items AND are pending beverage preparation
            # This includes mixed orders (food + beverage) - they appear in both dashboards
            queryset = Order.objects.filter(
                branch=user.branch,
                beverage_status__in=['pending', 'preparing', 'completed'],
                cashier_status__in=['pending', 'ready_for_payment', 'printed'],
                items__item_type='beverage'  # Only orders with beverage items
            ).prefetch_related('items').distinct()
            print(f"[DEBUG] Filtering beverage orders for branch: {user.branch.name}")
        elif user.is_superuser:
            # Superuser can see all beverage orders
            queryset = Order.objects.filter(
                beverage_status__in=['pending', 'preparing', 'completed'],
                cashier_status__in=['pending', 'ready_for_payment', 'printed'],
                items__item_type='beverage'  # Only orders with beverage items
            ).prefetch_related('items').distinct()
            print(f"[DEBUG] Superuser - showing all beverage orders")
        else:
            # For users without branch, show only their own beverage orders
            queryset = Order.objects.filter(
                created_by=user,
                beverage_status__in=['pending', 'preparing', 'completed'],
                cashier_status__in=['pending', 'ready_for_payment', 'printed'],
                items__item_type='beverage'  # Only orders with beverage items
            ).prefetch_related('items').distinct()
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
        
        # Check if order has been processed (has a payment)
        from payments.models import Payment
        has_payment = Payment.objects.filter(order=instance).exists()
        
        if has_payment:
            print(f"[DEBUG] UpdatePaymentOptionView - Order has been processed, payment option cannot be changed")
            return Response({
                'error': 'Payment option cannot be changed after order has been processed'
            }, status=400)
        
        # Check if order has been printed
        if instance.cashier_status == 'printed':
            print(f"[DEBUG] UpdatePaymentOptionView - Order has been printed, payment option cannot be changed")
            return Response({
                'error': 'Payment option cannot be changed after order has been printed'
            }, status=400)
        
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

class PrintOrderView(generics.UpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        
        print(f"[DEBUG] PrintOrderView - Order ID: {instance.id}")
        print(f"[DEBUG] PrintOrderView - Order Number: {instance.order_number}")
        print(f"[DEBUG] PrintOrderView - Current cashier_status: {instance.cashier_status}")
        print(f"[DEBUG] PrintOrderView - Request user: {request.user}")
        
        # Check if order can be printed
        if instance.cashier_status == 'printed':
            return Response({'error': 'Order has already been printed'}, status=400)
        
        # Check if payment option is selected
        if not instance.payment_option:
            return Response({'error': 'Payment method must be selected before printing'}, status=400)
        
        # Check if all items are accepted
        if not instance.all_items_completed():
            return Response({'error': 'All order items must be accepted before printing'}, status=400)
        
        # Update order status to printed
        instance.cashier_status = 'printed'
        instance.save()
        
        print(f"[DEBUG] PrintOrderView - Order printed successfully")
        
        serializer = self.get_serializer(instance)
        return Response({
            'message': 'Order printed successfully',
            'order': serializer.data
        })

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


class CancelOrderView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
            
            # Get cancellation reason from request
            reason = request.data.get('reason', 'No reason provided')
            
            # Update order status to cancelled
            if order.food_status in ['pending', 'preparing']:
                order.food_status = 'cancelled'
            if order.beverage_status in ['pending', 'preparing']:
                order.beverage_status = 'cancelled'
            
            # Update all pending items to cancelled
            pending_items = order.items.filter(status='pending')
            for item in pending_items:
                item.status = 'cancelled'
                item.save()
            
            order.save()
            
            # Log the cancellation for reporting
            print(f"[CANCELLATION] Order {order.order_number} cancelled. Reason: {reason}")
            
            return Response({
                'message': 'Order cancelled successfully',
                'order_number': order.order_number,
                'reason': reason
            })
            
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)
        except Exception as e:
            return Response({'error': f'Error cancelling order: {str(e)}'}, status=500)


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
        if not (request.user.is_authenticated and getattr(request.user, 'role', None) in ['meat', 'manager', 'owner', 'waiter', 'bartender', 'cashier']):
            return Response({'error': 'Forbidden'}, status=403)
        try:
            item = OrderItem.objects.select_related('order').get(pk=pk)
        except OrderItem.DoesNotExist:
            return Response({'error': 'Order item not found'}, status=status.HTTP_404_NOT_FOUND)

        status_value = request.data.get('status')
        if status_value not in ['pending', 'accepted', 'rejected']:
            return Response({'error': 'Invalid status value'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle beverage stock deduction
        # if status_value == 'accepted' and item.item_type == 'beverage':
        #     bartender = request.user
        #     try:
        #         barman_stock = BarmanStock.objects.select_related('stock__product').get(
        #             bartender=bartender,
        #             stock__product__name__iexact=item.name,
        #             stock__branch=item.order.branch
        #         )
        #     except BarmanStock.DoesNotExist:
        #         return Response(
        #             {'error': f"No barman stock found for '{item.name}'"},
        #             status=status.HTTP_400_BAD_REQUEST
        #         )

        #     if barman_stock.quantity_in_base_units < item.quantity:
        #         return Response(
        #             {
        #                 'error': (
        #                     f"Not enough stock. Available: {barman_stock.quantity_in_base_units}, "
        #                     f"Required: {item.quantity}"
        #                 )
        #             },
        #             status=status.HTTP_400_BAD_REQUEST
        #         )

        # product = barman_stock.stock.product
        # try:
        #     # Assuming you have a method to get conversion factor from base unit to original unit
        #     conversion_factor = product.get_conversion_factor(product.base_unit, barman_stock.original_unit)
        #     original_quantity_delta = item.quantity / conversion_factor
        # except Exception:
        #     # Fallback: treat original quantity same as base units if conversion unavailable
        #     original_quantity_delta = item.quantity

        # # Use your adjust_quantity method to deduct stock (make sure this method is in BarmanStock or Stock model)
        # try:
        #     barman_stock.adjust_quantity(
        #         quantity=item.quantity,
        #         unit=product.base_unit,
        #         is_addition=False
        #     )
        # except Exception as e:
        #     return Response({'error': f'Stock adjustment failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Update item status
        item.status = status_value
        item.save()

        # Update order total money based on accepted items
        order = item.order
        accepted_items = order.items.filter(status='accepted')
        order.total_money = sum(i.price * i.quantity for i in accepted_items)

        # Update order status based on item types
        food_items = order.items.filter(item_type='food')
        beverage_items = order.items.filter(item_type='beverage')
        
        # Update food_status
        if food_items.exists():
            food_statuses = list(food_items.values_list('status', flat=True))
            if all(s in ['accepted', 'rejected'] for s in food_statuses):
                if any(s == 'accepted' for s in food_statuses):
                    order.food_status = 'completed'
                else:
                    order.food_status = 'rejected'
            elif any(s == 'accepted' for s in food_statuses):
                order.food_status = 'preparing'
            else:
                order.food_status = 'pending'
        
        # Update beverage_status
        if beverage_items.exists():
            beverage_statuses = list(beverage_items.values_list('status', flat=True))
            if all(s in ['accepted', 'rejected'] for s in beverage_statuses):
                if any(s == 'accepted' for s in beverage_statuses):
                    order.beverage_status = 'completed'
                else:
                    order.beverage_status = 'rejected'
            elif any(s == 'accepted' for s in beverage_statuses):
                order.beverage_status = 'preparing'
            else:
                order.beverage_status = 'pending'
        
        order.save()
        
        return Response({'message': 'Order item status updated successfully'})

@api_view(['GET'])
def test_order_update(request, order_id):
    """Test endpoint to verify order update functionality"""
    try:
        from .models import Order, OrderItem
        
        # Get the order
        order = Order.objects.get(id=order_id)
        
        # Get current state
        current_items = list(order.items.values())
        current_total = order.total_money
        
        # Create a test item
        test_item = OrderItem.objects.create(
            order=order,
            name="TEST_ITEM",
            quantity=1,
            price=10.00,
            item_type="beverage",
            status="pending"
        )
        
        # Update order total
        order.total_money = (current_total or 0) + 10.00
        order.save()
        
        # Get updated state
        order.refresh_from_db()
        updated_items = list(order.items.values())
        updated_total = order.total_money
        
        # Clean up test item
        test_item.delete()
        order.total_money = current_total
        order.save()
        
        return Response({
            'message': 'Database test successful',
            'order_id': order_id,
            'before': {
                'items_count': len(current_items),
                'total_money': current_total,
                'items': current_items
            },
            'after': {
                'items_count': len(updated_items),
                'total_money': updated_total,
                'items': updated_items
            }
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_waiter_actions_view(request, order_id):
    """Get available waiter actions for a specific order"""
    try:
        actions = get_waiter_actions(order_id)
        return Response(actions)
    except Exception as e:
        return Response({
            'error': f'Error getting waiter actions: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order_update(request):
    """Create a new order update (addition, modification, removal)"""
    try:
        serializer = OrderUpdateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            order_update = serializer.save()
            
            # Return success response
            return Response({
                'message': 'Order update created successfully',
                'order_update': OrderUpdateSerializer(order_update).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return Response({
            'error': 'Failed to create order update',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_updates(request, order_id):
    """Get all updates for a specific order"""
    try:
        order = get_object_or_404(Order, id=order_id)
        updates = OrderUpdate.objects.filter(original_order=order).order_by('-created_at')
        
        serializer = OrderUpdateSerializer(updates, many=True)
        return Response({
            'order_id': order_id,
            'updates': serializer.data
        })
    
    except Exception as e:
        return Response({
            'error': 'Failed to fetch order updates',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_order_update(request, update_id):
    """Accept or reject an order update"""
    try:
        order_update = get_object_or_404(OrderUpdate, id=update_id)
        
        # Check if update can be processed
        if not order_update.can_be_processed():
            return Response({
                'error': 'Order update cannot be processed',
                'details': f'Update status is {order_update.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = OrderUpdateActionSerializer(data=request.data)
        if serializer.is_valid():
            action = serializer.validated_data['action']
            
            if action == 'accept':
                notes = serializer.validated_data.get('notes', '')
                order_update.mark_accepted(request.user, notes)
                message = 'Order update accepted successfully'
            else:  # reject
                reason = serializer.validated_data.get('rejection_reason', '')
                order_update.mark_rejected(request.user, reason)
                message = 'Order update rejected successfully'
            
            return Response({
                'message': message,
                'order_update': OrderUpdateSerializer(order_update).data
            })
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return Response({
            'error': 'Failed to process order update',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_updates(request):
    """Get all pending order updates for kitchen/bar staff"""
    try:
        pending_updates = OrderUpdate.objects.filter(status='pending').order_by('created_at')
        
        serializer = OrderUpdateSerializer(pending_updates, many=True)
        return Response({
            'pending_updates': serializer.data,
            'count': pending_updates.count()
        })
    
    except Exception as e:
        return Response({
            'error': 'Failed to fetch pending updates',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def edit_order_view(request, order_id):
    """
    Edit an existing order by adding new items while preserving accepted items.
    
    This endpoint uses the edit_order function which:
    - Preserves accepted items
    - Removes pending items
    - Adds new items with 'pending' status
    - Logs all changes in OrderUpdate table
    - Maintains transaction safety
    """
    try:
        from .utils import edit_order
        
        # Get the new items from request data
        new_items = request.data.get('items', [])
        
        if not new_items:
            return Response({
                'error': 'No items provided for order update'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate new items structure
        for item in new_items:
            if not all(key in item for key in ['name', 'quantity', 'price']):
                return Response({
                    'error': 'Each item must have name, quantity, and price'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Call the edit_order function
        result = edit_order(
            order_id=order_id,
            new_items=new_items,
            user=request.user
        )
        
        if result['success']:
            return Response({
                'message': result['message'],
                'order_id': result['order_id'],
                'order_update_id': result['order_update_id'],
                'update_type': result['update_type'],
                'accepted_items_preserved': result['accepted_items_preserved'],
                'pending_items_removed': result['pending_items_removed'],
                'new_items_added': result['new_items_added'],
                'total_addition_cost': result['total_addition_cost'],
                'new_total_money': result['new_total_money'],
                'order_update_status': result['order_update_status']
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'error': f'Failed to edit order: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_display_view(request, order_id):
    """
    Get comprehensive order display information including:
    - All items (accepted and pending)
    - Order updates history
    - Order metadata
    """
    try:
        from .utils import get_order_display_items
        
        result = get_order_display_items(order_id)
        
        if 'error' in result:
            return Response({
                'error': result['error']
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to get order display: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_order_update_completion_view(request, order_update_id):
    """
    Check if an order update is complete (all items accepted).
    If complete, mark the update as 'accepted'.
    """
    try:
        from .utils import check_order_update_completion
        
        result = check_order_update_completion(order_update_id)
        
        return Response({
            'order_update_id': order_update_id,
            'was_completed': result,
            'message': 'Order update marked as accepted' if result else 'Order update still has pending items'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to check order update completion: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def add_items_to_order(request, order_id):
    """
    Simple endpoint to add items to an existing order.
    This bypasses the complex validation system for basic item addition.
    """
    try:
        from .models import Order, OrderItem
        
        # Get the order
        order = Order.objects.get(id=order_id)
        
        # Get items data from request
        items_data = request.data.get('items', [])
        
        if not items_data:
            return Response({'error': 'No items provided'}, status=400)
        
        # Add new items
        new_items = []
        for item_data in items_data:
            try:
                new_item = OrderItem.objects.create(
                    order=order,
                    name=item_data.get('name'),
                    quantity=item_data.get('quantity', 1),
                    price=item_data.get('price', 0),
                    item_type=item_data.get('item_type', 'food'),
                    product_id=item_data.get('product_id') or item_data.get('product'),
                    status='pending'
                )
                new_items.append(new_item)
                print(f"[DEBUG] add_items_to_order - Created item: {new_item.name} ({new_item.item_type})")
            except Exception as e:
                print(f"[ERROR] add_items_to_order - Failed to create item {item_data.get('name')}: {str(e)}")
                return Response({'error': f'Failed to create item: {str(e)}'}, status=400)
        
        # Recalculate order total
        total = sum(item.price * item.quantity for item in order.items.all())
        order.total_money = total
        
        # Update order statuses based on new items
        if new_items:
            # Check if we have food or beverage items
            has_food = order.items.filter(item_type='food').exists()
            has_beverage = order.items.filter(item_type='beverage').exists()
            
            if has_food and order.food_status == 'not_applicable':
                order.food_status = 'pending'
            
            if has_beverage and order.beverage_status == 'not_applicable':
                order.beverage_status = 'pending'
        
        order.save()
        
        print(f"[DEBUG] add_items_to_order - Successfully added {len(new_items)} items to order {order.id}")
        
        # Send notifications to appropriate staff based on item types
        try:
            from .serializers import send_notification_to_role
            
            # Group new items by type
            beverage_items = [item for item in new_items if item.item_type == 'beverage']
            food_items = [item for item in new_items if item.item_type == 'food']
            
            if beverage_items:
                beverage_message = f"Order #{order.order_number} (Table {order.table.number if order.table else 'Unknown'}) updated with {len(beverage_items)} beverage item(s)"
                send_notification_to_role('bartender', beverage_message)
                print(f"[DEBUG] add_items_to_order - Notification sent to bartender: {beverage_message}")
            
            if food_items:
                food_message = f"Order #{order.order_number} (Table {order.table.number if order.table else 'Unknown'}) updated with {len(food_items)} food item(s)"
                send_notification_to_role('meat_area', food_message)
                print(f"[DEBUG] add_items_to_order - Notification sent to meat area: {food_message}")
                
        except Exception as e:
            print(f"[WARNING] add_items_to_order - Failed to send notifications: {str(e)}")
        
        return Response({
            'success': True,
            'message': f'Successfully added {len(new_items)} items to order',
            'order_id': order.id,
            'new_items': [{'name': item.name, 'quantity': item.quantity, 'price': item.price, 'item_type': item.item_type} for item in new_items],
            'total_money': float(total)
        })
        
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    except Exception as e:
        print(f"[ERROR] add_items_to_order - Unexpected error: {str(e)}")
        return Response({'error': f'Unexpected error: {str(e)}'}, status=500)