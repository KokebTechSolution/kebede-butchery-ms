from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsOwner
from payments.models import Payment
from orders.models import Order, OrderItem
from branches.models import Branch
from branches.serializers import BranchSerializer
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from datetime import datetime, timedelta
from django.utils import timezone
from decimal import Decimal
from django.utils.dateparse import parse_date
from users.models import User
from inventory.models import Stock

class OwnerDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def get(self, request):
        # Get date range from query params
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')
        branch_id = request.query_params.get('branch')
        today = timezone.now().date()
        if start_str and end_str:
            start_date = parse_date(start_str)
            end_date = parse_date(end_str)
        else:
            # Default: current month
            start_date = today.replace(day=1)
            end_date = today

        # Build base queryset for payments
        payments = Payment.objects.filter(processed_at__date__gte=start_date, processed_at__date__lte=end_date, is_completed=True)
        
        # Apply branch filter if specified
        if branch_id:
            payments = payments.filter(order__branch_id=branch_id)
        
        total_orders = payments.count()
        total_sales = sum(p.amount for p in payments)
        cash_sales = sum(p.amount for p in payments if p.payment_method == 'cash')
        online_sales = sum(p.amount for p in payments if p.payment_method == 'online')
        avg_order_value = total_sales / total_orders if total_orders else 0

        # Cost of goods (placeholder, as no cost field in Product/OrderItem)
        cost_of_goods = Decimal('45000')  # TODO: Replace with real calculation if available
        operating_expenses = Decimal('35000')  # TODO: Replace with real calculation if available
        gross_profit = Decimal(total_sales) - cost_of_goods
        net_profit = gross_profit - operating_expenses

        # Profit trend (by week in range)
        profit_trend = []
        range_days = (end_date - start_date).days + 1
        num_weeks = max(1, (range_days + 6) // 7)
        for week in range(num_weeks):
            week_start = start_date + timedelta(days=week*7)
            week_end = min(week_start + timedelta(days=6), end_date)
            week_payments = payments.filter(processed_at__date__gte=week_start, processed_at__date__lte=week_end)
            week_revenue = sum(p.amount for p in week_payments)
            week_costs = cost_of_goods / Decimal(str(num_weeks))  # Placeholder
            week_net = Decimal(week_revenue) - week_costs
            profit_trend.append({
                'name': f'Week {week+1}',
                'revenue': float(week_revenue),
                'costs': float(week_costs),
                'netProfit': float(week_net)
            })

        # Top selling items (by quantity)
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
                'revenue': float(i['revenue']) if i['revenue'] is not None else 0.0
            }
            for i in top_items
        ]

        # Calculate total inventory value (cost of inventory)
        stocks = Stock.objects.select_related('product').all()
        
        # Apply branch filter to stocks if specified
        if branch_id:
            stocks = stocks.filter(branch_id=branch_id)
        
        total_inventory_value = 0
        for stock in stocks:
            product = stock.product
            if product.base_unit_price:
                # Use quantity_in_base_units and base_unit_price for calculation
                total_inventory_value += float(stock.quantity_in_base_units * product.base_unit_price)

        # Calculate profit of inventory: sum of closed (paid) orders by waiters in the date range
        waiter_ids = User.objects.filter(role='waiter').values_list('id', flat=True)
        closed_orders = Order.objects.filter(
            created_by_id__in=waiter_ids,
            cashier_status='printed',
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            payment__is_completed=True
        ).distinct()
        
        # Apply branch filter to orders if specified
        if branch_id:
            closed_orders = closed_orders.filter(branch_id=branch_id)
        
        profit_of_inventory = 0
        for order in closed_orders:
            beverage_items = order.items.filter(item_type__in=['beverage', 'drink'], status='accepted')
            order_total = sum(item.price * item.quantity for item in beverage_items)
            profit_of_inventory += order_total

        # Calculate food income: sum of accepted food items from closed (printed and paid) orders in the date range
        closed_orders = Order.objects.filter(
            created_by_id__in=waiter_ids,
            cashier_status='printed',
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            payment__is_completed=True
        ).distinct()
        
        # Apply branch filter to orders if specified
        if branch_id:
            closed_orders = closed_orders.filter(branch_id=branch_id)
        
        food_income = 0
        for order in closed_orders:
            food_items = order.items.filter(item_type='food', status='accepted')
            order_food_total = sum(item.price * item.quantity for item in food_items)
            food_income += order_food_total

        data = {
            'kpi': {
                'totalRevenue': float(total_sales),
                'costOfInventory': float(total_inventory_value),
                'profitOfInventory': float(profit_of_inventory),
                'operatingExpenses': float(operating_expenses),
                'netProfit': float(net_profit),
                'avgOrderValue': float(avg_order_value),
                'foodIncome': float(food_income)
            },
            'profitTrend': profit_trend,
            'topSellingItems': top_selling_items
        }
        return Response(data)

class BranchPerformanceView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def get(self, request):
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')
        today = timezone.now().date()
        if start_str and end_str:
            start_date = parse_date(start_str)
            end_date = parse_date(end_str)
        else:
            start_date = today.replace(day=1)
            end_date = today

        branches = Branch.objects.all()
        branch_data = []
        for branch in branches:
            payments = Payment.objects.filter(order__branch=branch, processed_at__date__gte=start_date, processed_at__date__lte=end_date, is_completed=True)
            total_orders = payments.count()
            total_sales = sum(p.amount for p in payments)
            # Placeholder for cost/profit
            cost_of_goods = Decimal('45000') / branches.count() if branches.count() else Decimal('0')
            gross_profit = Decimal(total_sales) - cost_of_goods
            branch_data.append({
                'branch': branch.name,
                'totalRevenue': float(total_sales),
                'totalOrders': total_orders,
                'grossProfit': float(gross_profit)
            })
        return Response({'branches': branch_data})

class StaffPerformanceView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def get(self, request):
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')
        today = timezone.now().date()
        if start_str and end_str:
            start_date = parse_date(start_str)
            end_date = parse_date(end_str)
        else:
            start_date = today.replace(day=1)
            end_date = today

        waiters = User.objects.filter(role='waiter')
        data = []
        for waiter in waiters:
            # Only count orders that are printed
            orders = Order.objects.filter(
                created_by=waiter,
                created_at__date__gte=start_date,
                created_at__date__lte=end_date,
                cashier_status='printed'
            )
            order_ids = orders.values_list('id', flat=True)
            payments = Payment.objects.filter(order_id__in=order_ids, is_completed=True)
            total_orders = orders.count()
            total_sales = sum(p.amount for p in payments)
            branch_name = waiter.branch.name if waiter.branch else 'N/A'
            data.append({
                'waiter': f'{waiter.first_name} {waiter.last_name}' if waiter.first_name or waiter.last_name else waiter.username,
                'branch': branch_name,
                'totalOrders': total_orders,
                'totalSales': float(total_sales)
            })
        return Response({'waiters': data})

class BranchesListView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def get(self, request):
        """Fetch all branches for the owner dashboard"""
        branches = Branch.objects.all()
        serializer = BranchSerializer(branches, many=True)
        return Response(serializer.data) 