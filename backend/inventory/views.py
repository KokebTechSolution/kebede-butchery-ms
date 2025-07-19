from decimal import Decimal
from django.db import transaction
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import (
    ItemType, Category, Product, InventoryTransaction, 
    InventoryRequest, Stock, StockUnit, Branch, BarmanStock
)
from .serializers import (
    ItemTypeSerializer, CategorySerializer, ProductSerializer,
    InventoryTransactionSerializer, InventoryRequestSerializer,
    StockSerializer, BranchSerializer, BarmanStockSerializer, StockUnitSerializer
)


# Branch
class BranchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [permissions.AllowAny]


# Item Type
class ItemTypeViewSet(viewsets.ModelViewSet):
    queryset = ItemType.objects.all()
    serializer_class = ItemTypeSerializer
    permission_classes = [permissions.AllowAny]


# Category
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class InventoryRequestViewSet(viewsets.ModelViewSet):
    queryset = InventoryRequest.objects.all()
    serializer_class = InventoryRequestSerializer
    permission_classes = [permissions.AllowAny]

    def get_unit_conversions(self):
        """Get unit conversion multipliers"""
        try:
            from .models import UnitConversion
            conversions = UnitConversion.objects.all()
            unit_conversions = {}
            
            for conversion in conversions:
                if conversion.from_unit not in unit_conversions:
                    unit_conversions[conversion.from_unit] = {}
                unit_conversions[conversion.from_unit][conversion.to_unit] = float(conversion.multiplier)
            
            # If no conversions in database, provide default ones
            if not unit_conversions:
                unit_conversions = {
                    'carton': {
                        'bottle': 24,
                        'shot': 24 * 16,
                    },
                    'bottle': {
                        'shot': 16,
                    },
                    'litre': {
                        'shot': 33,
                    },
                    'unit': {
                        'shot': 1,
                    }
                }
            
            return unit_conversions
        except Exception as e:
            print(f"Error getting unit conversions: {e}")
            return {}

    def create_converted_requests(self, original_request, unit_conversions):
        """Create additional requests for converted units"""
        from .models import InventoryRequest
        
        product = original_request.product
        quantity = original_request.quantity
        unit_type = original_request.unit_type
        branch = original_request.branch
        
        # Get conversions for this unit type
        conversions = unit_conversions.get(unit_type, {})
        created_requests = []
        
        for to_unit, multiplier in conversions.items():
            converted_quantity = quantity * multiplier
            
            # Create a new request for the converted unit
            converted_request = InventoryRequest.objects.create(
                product=product,
                quantity=converted_quantity,
                unit_type=to_unit,
                status='pending',
                branch=branch
            )
            created_requests.append(converted_request)
            
        return created_requests

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def accept(self, request, pk=None):
        req = self.get_object()
        if req.status != 'pending':
            return Response({'error': 'Request already processed.'}, status=400)

        # Get unit conversions
        unit_conversions = self.get_unit_conversions()
        
        # Check if there's enough stock available for the original request
        product = req.product
        qty = Decimal(req.quantity)
        unit = req.unit_type
        branch = req.branch

        stock, _ = Stock.objects.select_for_update().get_or_create(product=product, branch=branch)
        stock_unit, _ = StockUnit.objects.select_for_update().get_or_create(
            stock=stock, unit_type=unit,
            defaults={'quantity': Decimal('0.00')}
        )

        if stock_unit.quantity < qty:
            return Response({'error': f'Not enough stock in unit type {unit}.'}, status=400)

        # Create converted requests if this is a convertible unit (like carton)
        converted_requests = []
        if unit in unit_conversions:
            converted_requests = self.create_converted_requests(req, unit_conversions)

        # Update InventoryRequest status to accepted
        req.status = 'accepted'
        req.reached_status = False
        req.save()

        # Update converted requests status as well
        for conv_req in converted_requests:
            conv_req.status = 'accepted'
            conv_req.reached_status = False
            conv_req.save()

        response_message = 'Request accepted successfully. Stock will be reduced when request is reached.'
        if converted_requests:
            response_message += f' Created {len(converted_requests)} additional requests for converted units.'

        return Response({'message': response_message})

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def reach(self, request, pk=None):
        print(f"DEBUG: Reach action called for request {pk}")
        req = self.get_object()
        print(f"DEBUG: Request status: {req.status}, reached_status: {req.reached_status}")

        if req.status != 'accepted':
            print(f"DEBUG: Request not accepted, current status: {req.status}")
            return Response({'error': 'Request must be accepted before marking as reached.'}, status=400)

        if req.reached_status:
            print(f"DEBUG: Request already reached")
            return Response({'error': 'Request already marked as reached.'}, status=400)

        product = req.product
        qty = Decimal(req.quantity)
        unit = req.unit_type
        branch = req.branch
        
        print(f"DEBUG: Processing request - Product: {product.name}, Quantity: {qty}, Unit: {unit}, Branch: {branch.name}")

        # Get stock and check availability
        stock = Stock.objects.select_for_update().filter(product=product, branch=branch).first()
        if not stock:
            print(f"DEBUG: Stock not found for product {product.name} and branch {branch.name}")
            return Response({'error': 'Stock not found for the given product and branch.'}, status=400)

        stock_unit, _ = StockUnit.objects.select_for_update().get_or_create(
            stock=stock, unit_type=unit,
            defaults={'quantity': Decimal('0.00')}
        )
        
        print(f"DEBUG: Current stock unit quantity: {stock_unit.quantity}, Required: {qty}")

        # Check if there's still enough stock (in case it was reduced after acceptance)
        if stock_unit.quantity < qty:
            print(f"DEBUG: Insufficient stock - Available: {stock_unit.quantity}, Required: {qty}")
            return Response({'error': f'Not enough stock in unit type {unit}.'}, status=400)

        # Reduce main stock when request is reached (delivery confirmed)
        old_quantity = stock_unit.quantity
        stock_unit.quantity -= qty
        stock_unit.save()
        print(f"DEBUG: Main stock reduced from {old_quantity} to {stock_unit.quantity}")

        # Get authenticated bartender
        bartender = request.user
        if not bartender.is_authenticated:
            print(f"DEBUG: User not authenticated")
            return Response({'error': 'Authentication required.'}, status=403)

        print(f"DEBUG: Processing for bartender: {bartender.username}")

        # Increase barman stock
        barman_stock, _ = BarmanStock.objects.select_for_update().get_or_create(
            stock=stock,
            bartender=bartender,
            defaults={
                'carton_quantity': Decimal('0.00'),
                'bottle_quantity': Decimal('0.00'),
                'litre_quantity': Decimal('0.00'),
                'unit_quantity': Decimal('0.00'),
                'shot_quantity': Decimal('0.00'),
                'minimum_threshold': Decimal('0.00'),
                'running_out': False,
            }
        )
        
        # Update the appropriate quantity field based on unit type
        old_quantity = barman_stock.get_quantity_by_unit_type(unit)
        barman_stock.reduce_quantity_by_unit_type(unit, -qty)  # Negative to add
        barman_stock.save()
        print(f"DEBUG: Barman stock {unit} quantity increased from {old_quantity} to {barman_stock.get_quantity_by_unit_type(unit)}")

        # Mark request as reached
        req.reached_status = True
        req.save()
        print(f"DEBUG: Request marked as reached")

        # Create InventoryTransaction record for the transfer
        transaction = InventoryTransaction.objects.create(
            product=product,
            transaction_type='sale',
            quantity=qty,
            unit_type=unit,
            branch=branch
        )
        print(f"DEBUG: Transaction created with ID: {transaction.id}")

        return Response({'detail': 'Request marked as reached. Stock transferred to bartender.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def reject(self, request, pk=None):
        req = self.get_object()
        if req.status != 'pending':
            return Response({'error': 'Request already processed.'}, status=400)

        req.status = 'rejected'
        req.save()
        return Response({'message': 'Request rejected successfully.'}, status=200)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def not_reach(self, request, pk=None):
        req = self.get_object()

        if req.status != 'accepted':
            return Response({'error': 'Request must be accepted before marking as not reached.'}, status=400)

        if not req.reached_status:
            return Response({'error': 'Request already marked as not reached.'}, status=400)

        # If request was reached but now marked as not reached, we need to reverse the stock changes
        product = req.product
        qty = Decimal(req.quantity)
        unit = req.unit_type
        branch = req.branch

        # Get stock
        stock = Stock.objects.select_for_update().filter(product=product, branch=branch).first()
        if stock:
            # Restore main stock
            stock_unit, _ = StockUnit.objects.select_for_update().get_or_create(
                stock=stock, unit_type=unit,
                defaults={'quantity': Decimal('0.00')}
            )
            stock_unit.quantity += qty
            stock_unit.save()

            # Reduce barman stock
            bartender = request.user
            if bartender.is_authenticated:
                barman_stock = BarmanStock.objects.select_for_update().filter(
                    stock=stock,
                    bartender=bartender
                ).first()
                
                if barman_stock:
                    barman_stock.reduce_quantity_by_unit_type(unit, qty)
                    barman_stock.save()

        # Mark request as not reached
        req.reached_status = False
        req.save()

        return Response({'detail': 'Request marked as not reached. Stock changes reversed.'}, status=status.HTTP_200_OK)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'])
    def unit_conversions(self, request):
        """
        Get unit conversion multipliers for calculating total available quantities
        """
        try:
            from .models import UnitConversion
            
            # Get all unit conversions from database
            conversions = UnitConversion.objects.all()
            
            # Organize conversions by from_unit
            unit_conversions = {}
            
            for conversion in conversions:
                if conversion.from_unit not in unit_conversions:
                    unit_conversions[conversion.from_unit] = {}
                unit_conversions[conversion.from_unit][conversion.to_unit] = float(conversion.multiplier)
            
            # If no conversions in database, provide default ones
            if not unit_conversions:
                unit_conversions = {
                    'carton': {
                        'bottle': 24,  # 1 carton = 24 bottles (typical)
                        'shot': 24 * 16,  # 1 carton = 24 bottles * 16 shots per bottle
                    },
                    'bottle': {
                        'shot': 16,  # 1 bottle = 16 shots (typical)
                    },
                    'litre': {
                        'shot': 33,  # 1 litre = 33 shots (typical)
                    },
                    'unit': {
                        'shot': 1,  # 1 unit = 1 shot
                    }
                }
            
            return Response({
                'conversions': unit_conversions,
                'message': 'Unit conversion multipliers retrieved successfully'
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=500)

    @action(detail=False, methods=['get'])
    def comprehensive_inventory(self, request):
        """
        Returns comprehensive inventory data in user-friendly format
        """
        try:
            # Get all products with their related data
            products = Product.objects.select_related(
                'category__item_type'
            ).prefetch_related(
                'stock_set__branch',
                'stock_set__units',
                'conversions'
            ).all()

            inventory_data = []
            
            for product in products:
                # Get all stocks for this product
                stocks = product.stock_set.all()
                
                for stock in stocks:
                    # Get all units for this stock
                    stock_units = stock.units.all()
                    
                    if stock_units.exists():
                        # If there are stock units, create entry for each unit
                        for unit in stock_units:
                            # Calculate total in base unit
                            total_in_base_unit = self.calculate_total_in_base_unit(
                                product, unit.unit_type, unit.quantity
                            )
                            
                            inventory_data.append({
                                'product_name': product.name,
                                'category': product.category.category_name,
                                'item_type': product.category.item_type.type_name,
                                'branch': stock.branch.name,
                                'quantity': float(unit.quantity),
                                'unit_type': unit.unit_type,
                                'base_unit': product.base_unit,
                                'total_in_base_unit': total_in_base_unit,
                                'price_per_unit': float(product.price_per_unit),
                                'minimum_threshold': float(stock.minimum_threshold),
                                'running_out': stock.running_out,
                                'stock_id': stock.id,
                                'product_id': product.id,
                                'unit_id': unit.id
                            })
                    else:
                        # If no stock units, create a default entry
                        inventory_data.append({
                            'product_name': product.name,
                            'category': product.category.category_name,
                            'item_type': product.category.item_type.type_name,
                            'branch': stock.branch.name,
                            'quantity': 0,
                            'unit_type': product.base_unit,
                            'base_unit': product.base_unit,
                            'total_in_base_unit': '0 ' + product.base_unit + 's',
                            'price_per_unit': float(product.price_per_unit),
                            'minimum_threshold': float(stock.minimum_threshold),
                            'running_out': stock.running_out,
                            'stock_id': stock.id,
                            'product_id': product.id,
                            'unit_id': None
                        })
                
                # If no stocks exist for this product, create a default entry
                if not stocks.exists():
                    inventory_data.append({
                        'product_name': product.name,
                        'category': product.category.category_name,
                        'item_type': product.category.item_type.type_name,
                        'branch': 'No Branch Assigned',
                        'quantity': 0,
                        'unit_type': product.base_unit,
                        'base_unit': product.base_unit,
                        'total_in_base_unit': '0 ' + product.base_unit + 's',
                        'price_per_unit': float(product.price_per_unit),
                        'minimum_threshold': 0,
                        'running_out': False,
                        'stock_id': None,
                        'product_id': product.id,
                        'unit_id': None
                    })

            return Response({
                'inventory': inventory_data,
                'total_items': len(inventory_data)
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=500)

    def calculate_total_in_base_unit(self, product, from_unit, quantity):
        """
        Calculate total quantity in base unit with user-friendly display
        """
        if from_unit == product.base_unit:
            return f"{quantity} {product.base_unit}s"
        
        # Check for unit conversions
        conversion = product.conversions.filter(
            from_unit=from_unit, 
            to_unit=product.base_unit
        ).first()
        
        if conversion:
            total_in_base = float(quantity) * float(conversion.multiplier)
            return f"{total_in_base:.2f} {product.base_unit}s"
        
        # If no conversion found, show as is
        return f"{quantity} {from_unit}s (no conversion to {product.base_unit})"

    @action(detail=True, methods=['post'])
    def restock(self, request, pk=None):
        return self.handle_transaction(request, pk, 'restock')

    @action(detail=True, methods=['post'])
    def sale(self, request, pk=None):
        return self.handle_transaction(request, pk, 'sale')

    @action(detail=True, methods=['post'])
    def wastage(self, request, pk=None):
        return self.handle_transaction(request, pk, 'wastage')

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        product = self.get_object()
        transactions = InventoryTransaction.objects.filter(product=product).order_by('-transaction_date')
        serializer = InventoryTransactionSerializer(transactions, many=True)
        return Response({
            'product': ProductSerializer(product).data,
            'transactions': serializer.data
        })

    def handle_transaction(self, request, pk, transaction_type):
        product = self.get_object()
        quantity = request.data.get('quantity')
        unit_type = request.data.get('unit_type')
        branch_name = request.data.get('branch_name')

        if not all([quantity, unit_type, branch_name]):
            return Response({'error': 'Quantity, unit_type, and branch_name are required.'}, status=400)

        try:
            quantity = Decimal(quantity)
            if quantity <= 0:
                return Response({'error': 'Quantity must be greater than zero.'}, status=400)
        except:
            return Response({'error': 'Quantity must be a valid number.'}, status=400)

        try:
            branch = Branch.objects.get(name=branch_name)
        except Branch.DoesNotExist:
            return Response({'error': f'Branch with name "{branch_name}" does not exist.'}, status=400)

        stock, _ = Stock.objects.get_or_create(product=product, branch=branch)
        stock_unit, _ = StockUnit.objects.get_or_create(
            stock=stock, unit_type=unit_type,
            defaults={'quantity': Decimal('0.00')}
        )

        if transaction_type != 'restock' and stock_unit.quantity < quantity:
            return Response({'error': f'Insufficient stock for unit type {unit_type}.'}, status=400)

        sign = Decimal('1') if transaction_type == 'restock' else Decimal('-1')
        stock_unit.quantity = max(Decimal('0.00'), stock_unit.quantity + (sign * quantity))
        stock_unit.save()

        InventoryTransaction.objects.create(
            product=product,
            transaction_type=transaction_type,
            quantity=quantity,
            unit_type=unit_type,
            branch=branch
        )

        return Response({'message': f'{transaction_type.title()} transaction recorded successfully.'})


class InventoryTransactionViewSet(viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventoryTransactionSerializer
    permission_classes = [permissions.AllowAny]


class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.select_related('product', 'branch').all()
    serializer_class = StockSerializer
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data
        product_id = data.get('product_id')
        branch_id = data.get('branch_id')
        unit_type = data.get('unit_type')
        quantity = data.get('quantity')
        minimum_threshold = data.get('minimum_threshold', 0)
        running_out = data.get('running_out', False)

        if not product_id or not branch_id or not unit_type or quantity is None:
            return Response({'error': 'product_id, branch_id, unit_type, and quantity are required.'}, status=400)

        try:
            product = Product.objects.get(pk=product_id)
            branch = Branch.objects.get(pk=branch_id)
            quantity = Decimal(quantity)
            minimum_threshold = Decimal(minimum_threshold)
            if quantity < 0 or minimum_threshold < 0:
                raise ValueError
        except Exception:
            return Response({'error': 'Invalid data for product, branch, quantity, or threshold.'}, status=400)

        # Create or get Stock with minimum_threshold and running_out
        stock, created = Stock.objects.get_or_create(
            product=product, 
            branch=branch,
            defaults={
                'minimum_threshold': minimum_threshold,
                'running_out': running_out
            }
        )
        
        # Update stock fields if it already existed
        if not created:
            if minimum_threshold > 0:
                stock.minimum_threshold = minimum_threshold
            stock.running_out = running_out
            stock.save()

        # Create or get StockUnit with quantity
        stock_unit, unit_created = StockUnit.objects.get_or_create(
            stock=stock,
            unit_type=unit_type,
            defaults={'quantity': Decimal('0.00')}
        )

        stock_unit.quantity += quantity
        stock_unit.save()

        serializer = StockUnitSerializer(stock_unit)
        return Response(serializer.data, status=status.HTTP_201_CREATED if unit_created else status.HTTP_200_OK)


class BarmanStockViewSet(viewsets.ModelViewSet):
    queryset = BarmanStock.objects.select_related('stock__product', 'stock__branch', 'bartender')
    serializer_class = BarmanStockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(bartender=self.request.user)

    def perform_create(self, serializer):
        serializer.save(bartender=self.request.user)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def use_item(self, request, pk=None):
        """
        Reduce barman stock when an item is used
        """
        barman_stock = self.get_object()
        quantity_to_use = Decimal(request.data.get('quantity', 0))
        
        if quantity_to_use <= 0:
            return Response({'error': 'Quantity must be greater than zero.'}, status=400)
        
        if barman_stock.quantity < quantity_to_use:
            return Response({'error': 'Not enough stock available.'}, status=400)
        
        # Reduce barman stock
        barman_stock.quantity -= quantity_to_use
        barman_stock.save()
        
        # Create transaction record
        InventoryTransaction.objects.create(
            product=barman_stock.stock.product,
            transaction_type='sale',
            quantity=quantity_to_use,
            unit_type=barman_stock.unit_type,
            branch=barman_stock.stock.branch
        )
        
        return Response({
            'message': f'Used {quantity_to_use} {barman_stock.unit_type} of {barman_stock.stock.product.name}',
            'remaining_quantity': float(barman_stock.quantity)
        })

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def return_item(self, request, pk=None):
        """
        Return items to barman stock (e.g., unused items)
        """
        barman_stock = self.get_object()
        quantity_to_return = Decimal(request.data.get('quantity', 0))
        
        if quantity_to_return <= 0:
            return Response({'error': 'Quantity must be greater than zero.'}, status=400)
        
        # Increase barman stock
        barman_stock.quantity += quantity_to_return
        barman_stock.save()
        
        return Response({
            'message': f'Returned {quantity_to_return} {barman_stock.unit_type} of {barman_stock.stock.product.name}',
            'current_quantity': float(barman_stock.quantity)
        })
