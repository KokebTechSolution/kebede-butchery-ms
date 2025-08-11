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
        
        if table_number:
            queryset = queryset.filter(table_number=table_number)
        if date:
            parsed_date = parse_date(date)
            queryset = queryset.filter(created_at__date=parsed_date)
        
        print(f"[DEBUG] OrderListView.get_queryset - Final queryset count: {queryset.count()}")
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

        # Recalculate order status based on current item statuses
        new_beverage_status = order.calculate_beverage_status()
        if new_beverage_status != order.beverage_status:
            print(f"[DEBUG] OrderItemStatusUpdateView - Updating beverage_status from '{order.beverage_status}' to '{new_beverage_status}'")
            order.beverage_status = new_beverage_status
        
        new_food_status = order.calculate_food_status()
        if new_food_status != order.food_status:
            print(f"[DEBUG] OrderItemStatusUpdateView - Updating food_status from '{order.food_status}' to '{new_food_status}'")
            order.food_status = new_food_status
        
        # Update order cashier status
        all_statuses = list(order.items.values_list('status', flat=True))
        if all(s in ['accepted', 'rejected'] for s in all_statuses):
            order.cashier_status = 'ready_for_payment'
        else:
            order.cashier_status = 'pending'

        order.save()

        return Response(OrderItemSerializer(item).data, status=status.HTTP_200_OK)

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