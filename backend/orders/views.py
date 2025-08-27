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

class OrderListView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def options(self, request, *args, **kwargs):
        """Handle preflight OPTIONS requests"""
        response = Response()
        response['Access-Control-Allow-Origin'] = 'https://kebede-butchery-ms-1.onrender.com'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
        response['Access-Control-Allow-Methods'] = 'DELETE, GET, OPTIONS, PATCH, POST, PUT'
        response['Access-Control-Max-Age'] = '3600'
        return response

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        
        # Add CORS headers directly
        response['Access-Control-Allow-Origin'] = 'https://kebede-butchery-ms-1.onrender.com'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
        response['Access-Control-Allow-Methods'] = 'DELETE, GET, OPTIONS, PATCH, POST, PUT'
        
        return response

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
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
                # For 'pending' filter, show only 'pending' orders
                # 'ready_for_payment' status is no longer automatically set
                queryset = queryset.filter(cashier_status='pending')
                print(f"DEBUG: Applied pending filter (pending only)")
            else:
                queryset = queryset.filter(cashier_status=cashier_status)
                print(f"DEBUG: Applied cashier_status filter: {cashier_status}")
            print(f"DEBUG: Query count after filter: {queryset.count()}")
        
        print(f"DEBUG: Final query count: {queryset.count()}")
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
        serializer.save(
            created_by=user, 
            order_number=new_order_number,
            food_status=food_status,
            beverage_status=beverage_status
        )


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]


class FoodOrderListView(generics.ListAPIView):
    serializer_class = FoodOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):

        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        # Show all orders that are not paid and have at least one item
        queryset = Order.objects.filter(
            food_status__in=['pending', 'preparing', 'completed'],
            cashier_status__in=['pending', 'printed'],  # Removed 'ready_for_payment'
            items__isnull=False
        ).distinct()
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
        queryset = Order.objects.filter(beverage_status__in=['pending', 'preparing']).distinct()

        branch_id = self.request.query_params.get('branch_id')
        queryset = Order.objects.filter(
            beverage_status__in=['pending', 'preparing', 'completed'],
            items__isnull=False
        ).distinct()

        date = self.request.query_params.get('date')
        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        if date:
            queryset = queryset.filter(created_at__date=parse_date(date))
        elif start and end:
            queryset = queryset.filter(created_at__date__gte=parse_date(start), created_at__date__lte=parse_date(end))

        queryset = Order.objects.filter(
            beverage_status__in=['pending', 'preparing', 'completed'],
            items__isnull=False
        ).distinct()
        date = self.request.query_params.get('date')
        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        if date:
            queryset = queryset.filter(created_at__date=parse_date(date))
        elif start and end:
            queryset = queryset.filter(created_at__date__gte=parse_date(start), created_at__date__lte=parse_date(end))

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
        queryset = Order.objects.filter(cashier_status='printed')
        date = self.request.query_params.get('date')
        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        if date:
            parsed_date = parse_date(date)
            queryset = queryset.filter(
                Q(payment__processed_at__date=parsed_date) |
                Q(payment__isnull=True, created_at__date=parsed_date)
            )
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
        try:
            waiter = User.objects.get(id=waiter_id)
        except User.DoesNotExist:
            return Response({'error': 'Waiter not found'}, status=404)

        # Only consider orders that are printed (sent to cashier)
        orders = Order.objects.filter(created_by=waiter, cashier_status='printed')
        total_orders = orders.count()
        total_sales = sum(order.total_money or 0 for order in orders if order.total_money)

        # Placeholder for rating and active tables
        average_rating = 0.0
        active_tables = 0

        return Response({
            'total_orders': total_orders,
            'total_sales': total_sales,
            'average_rating': average_rating,
            'active_tables': active_tables,
        })


class WaiterEarningsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        date = request.query_params.get('date')
        if not date:
            return Response({'error': 'Date is required'}, status=400)
        
        try:
            parsed_date = parse_date(date)
            if not parsed_date:
                return Response({'error': 'Invalid date format'}, status=400)
        except Exception as e:
            return Response({'error': f'Date parsing error: {str(e)}'}, status=400)

        try:
            # Get all orders for the specified date
            orders = Order.objects.filter(created_at__date=parsed_date).select_related('created_by')
            
            # Group orders by waiter and calculate earnings
            waiter_earnings = {}
            
            for order in orders:
                try:
                    # Only count orders that are completed/paid (printed status)
                    if order.cashier_status == 'printed':
                        waiter_name = order.created_by.username if order.created_by else 'Unknown Waiter'
                        
                        # Calculate order total
                        order_total = 0
                        if order.total_money:
                            order_total = float(order.total_money)
                        elif order.items.exists():
                            order_total = sum(
                                float(item.price) * int(item.quantity) 
                                for item in order.items.all() 
                                if item.status in ['accepted', 'completed', 'served']
                            )
                        
                        if order_total > 0:
                            if waiter_name not in waiter_earnings:
                                waiter_earnings[waiter_name] = {
                                    'name': waiter_name,
                                    'totalEarnings': 0,
                                    'ordersCount': 0,
                                    'avgOrderValue': 0
                                }
                            
                            waiter_earnings[waiter_name]['totalEarnings'] += order_total
                            waiter_earnings[waiter_name]['ordersCount'] += 1
                except Exception as order_error:
                    print(f"Error processing order {order.id}: {order_error}")
                    continue
            
            # Calculate averages and convert to list
            earnings_list = []
            for waiter_data in waiter_earnings.values():
                waiter_data['avgOrderValue'] = (
                    waiter_data['totalEarnings'] / waiter_data['ordersCount'] 
                    if waiter_data['ordersCount'] > 0 else 0
                )
                earnings_list.append(waiter_data)
            
            # Sort by total earnings (highest first)
            earnings_list.sort(key=lambda x: x['totalEarnings'], reverse=True)
            
            return Response({
                'waiter_earnings': earnings_list,
                'date': date,
                'total_waiters': len(earnings_list)
            })
            
        except Exception as e:
            print(f"Error in WaiterEarningsView: {str(e)}")
            return Response({'error': f'Internal server error: {str(e)}'}, status=500)


class TopSellingItemsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        date = request.query_params.get('date')
        if not date:
            return Response({'error': 'Date is required'}, status=400)
        
        try:
            parsed_date = parse_date(date)
            if not parsed_date:
                return Response({'error': 'Invalid date format'}, status=400)
        except Exception as e:
            return Response({'error': f'Date parsing error: {str(e)}'}, status=400)

        # Get all orders for the specified date
        orders = Order.objects.filter(created_at__date=parsed_date)
        
        # Get all order items from these orders
        all_items = []
        for order in orders:
            # Only count items from completed/paid orders (printed status)
            if order.cashier_status == 'printed':
                if order.items.exists():
                    for item in order.items.all():
                        # Only count accepted/completed items
                        if item.status in ['accepted', 'completed', 'served']:
                            all_items.append({
                                'name': item.name,
                                'quantity': int(item.quantity),
                                'price': float(item.price),
                                'revenue': float(item.price) * int(item.quantity)
                            })

        # Group items by name and calculate totals
        item_sales = {}
        for item in all_items:
            item_name = item['name']
            if item_name not in item_sales:
                item_sales[item_name] = {
                    'name': item_name,
                    'totalQuantity': 0,
                    'totalRevenue': 0,
                    'orderCount': 0,
                    'avgPrice': 0
                }
            
            item_sales[item_name]['totalQuantity'] += item['quantity']
            item_sales[item_name]['totalRevenue'] += item['revenue']
            item_sales[item_name]['orderCount'] += 1

        # Calculate averages and convert to list
        items_list = []
        for item_data in item_sales.values():
            item_data['avgPrice'] = (
                item_data['totalRevenue'] / item_data['totalQuantity'] 
                if item_data['totalQuantity'] > 0 else 0
            )
            items_list.append(item_data)

        # Sort by total revenue (highest first) and take top 10
        items_list.sort(key=lambda x: x['totalRevenue'], reverse=True)
        top_items = items_list[:10]

        return Response({
            'top_selling_items': top_items,
            'date': date,
            'total_items': len(top_items)
        })


class ManagerOrdersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        date = request.query_params.get('date')
        if not date:
            return Response({'error': 'Date is required'}, status=400)
        
        try:
            parsed_date = parse_date(date)
            if not parsed_date:
                return Response({'error': 'Invalid date format'}, status=400)
            
            # Check if the date is in the future
            from datetime import date as today_date
            today = today_date.today()
            if parsed_date > today:
                print(f"ManagerOrdersView - Date {parsed_date} is in the future, using today's date {today}")
                parsed_date = today
        except Exception as e:
            return Response({'error': f'Date parsing error: {str(e)}'}, status=400)

        try:
            # Get all orders for the specified date (manager can see all orders)
            print(f"ManagerOrdersView - Looking for orders on date: {parsed_date}")
            print(f"ManagerOrdersView - Date type: {type(parsed_date)}")
            
            # First, let's see all orders to debug
            all_orders = Order.objects.all().order_by('-created_at')[:10]
            print(f"ManagerOrdersView - Last 10 orders in system:")
            for o in all_orders:
                print(f"  Order {o.order_number}: created_at={o.created_at}, date={o.created_at.date()}")
            
            orders = Order.objects.filter(created_at__date=parsed_date).select_related(
                'created_by', 'branch'
            ).prefetch_related('items')
            
            print(f"ManagerOrdersView - Found {orders.count()} orders for date {parsed_date}")
            
            # If no orders found for the specific date, try to find orders from the last few days
            if orders.count() == 0:
                print(f"ManagerOrdersView - No orders found for {parsed_date}, checking last 7 days...")
                from datetime import timedelta
                last_week_orders = Order.objects.filter(
                    created_at__date__gte=parsed_date - timedelta(days=7)
                ).order_by('-created_at')[:5]
                print(f"ManagerOrdersView - Found {last_week_orders.count()} orders in last 7 days:")
                for o in last_week_orders:
                    print(f"  Order {o.order_number}: created_at={o.created_at}, date={o.created_at.date()}")
            
            # Serialize the orders
            orders_data = []
            for order in orders:
                try:
                    order_data = {
                        'id': order.id,
                        'order_number': order.order_number,
                        'table_number': order.table.table_number if order.table else None,
                        'created_by': order.created_by.username if order.created_by else 'Unknown',
                        'waiterName': order.created_by.username if order.created_by else 'Unknown',
                        'branch': order.branch.name if order.branch else 'Unknown',
                        'created_at': order.created_at,
                        'total_money': float(order.total_money) if order.total_money else 0,
                        'cashier_status': order.cashier_status,
                        'has_payment': order.cashier_status == 'printed',
                        'food_status': order.food_status,
                        'beverage_status': order.beverage_status,
                        'items': []
                    }
                    
                    # Add order items safely
                    if order.items.exists():
                        for item in order.items.all():
                            try:
                                item_data = {
                                    'id': item.id,
                                    'name': item.name,
                                    'price': float(item.price) if item.price else 0,
                                    'quantity': int(item.quantity) if item.quantity else 0,
                                    'status': item.status,
                                    'item_type': item.item_type
                                }
                                order_data['items'].append(item_data)
                            except Exception as item_error:
                                print(f"Error processing item {item.id}: {item_error}")
                                continue
                    
                    orders_data.append(order_data)
                except Exception as order_error:
                    print(f"Error processing order {order.id}: {order_error}")
                    continue

            return Response({
                'orders': orders_data,
                'date': date,
                'total_orders': len(orders_data)
            })
            
        except Exception as e:
            print(f"Error in ManagerOrdersView: {str(e)}")
            return Response({'error': f'Internal server error: {str(e)}'}, status=500)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from orders.models import OrderItem
from orders.serializers import OrderItemSerializer
from rest_framework.permissions import AllowAny
from inventory.models import BarmanStock
from django.db import transaction
from decimal import Decimal


class OrderItemStatusUpdateView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def patch(self, request, pk):
        if not (request.user.is_authenticated and getattr(request.user, 'role', None) in ['meat', 'manager', 'owner', 'waiter', 'bartender']):
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

        #     product = barman_stock.stock.product
        #     try:
        #         # Assuming you have a method to get conversion factor from base unit to original unit
        #         conversion_factor = product.get_conversion_factor(product.base_unit, barman_stock.original_unit)
        #         original_quantity_delta = item.quantity / conversion_factor
        #     except Exception:
        #         # Fallback: treat original quantity same as base units if conversion unavailable
        #         original_quantity_delta = item.quantity

        #     # Use your adjust_quantity method to deduct stock (make sure this method is in BarmanStock or Stock model)
        #     try:
        #         barman_stock.adjust_quantity(
        #             quantity=item.quantity,
        #             unit=product.base_unit,
        #             is_addition=False
        #         )
        #     except Exception as e:
        #         return Response({'error': f'Stock adjustment failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

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

        # DO NOT automatically change cashier_status - let waiter control this
        # order.cashier_status should only change when waiter explicitly prints
        # This prevents orders from appearing in cashier system prematurely

        order.save()

        return Response(OrderItemSerializer(item).data, status=status.HTTP_200_OK)