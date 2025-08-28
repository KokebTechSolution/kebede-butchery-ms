from decimal import Decimal
from django.db import transaction, models
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from .models import (
    ItemType, Category, Product, InventoryTransaction, 
    InventoryRequest, Stock, Branch, BarmanStock, ProductUnit, ProductMeasurement
)
from .serializers import (
    ItemTypeSerializer, CategorySerializer, ProductSerializer, ProductWithStockSerializer,
    InventoryTransactionSerializer, InventoryRequestSerializer,
    StockSerializer, BranchSerializer, BarmanStockSerializer, ProductUnitSerializer, ProductMeasurementSerializer
)
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from users.permissions import IsManager, IsBartender, IsAuthenticated
# Branch
class BranchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [AllowAny]


# Item Type
class ItemTypeViewSet(viewsets.ModelViewSet):
    queryset = ItemType.objects.all()
    serializer_class = ItemTypeSerializer
    permission_classes = [AllowAny]


# Category
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """Create category and also create corresponding MenuCategory"""
        with transaction.atomic():
            # Create the inventory category first
            response = super().create(request, *args, **kwargs)
            created_category = response.data
            
            try:
                # Also create a corresponding MenuCategory
                from menu.models import MenuCategory
                
                # Map item_type to menu item_type
                item_type = created_category.get('item_type', {}).get('type_name', '')
                menu_item_type = 'beverage' if 'beverage' in item_type.lower() else 'food'
                
                MenuCategory.objects.get_or_create(
                    name=created_category['category_name'],
                    item_type=menu_item_type,
                    defaults={
                        'name': created_category['category_name'],
                        'item_type': menu_item_type
                    }
                )
                print(f"✅ MenuCategory created: {created_category['category_name']} ({menu_item_type})")
                
            except Exception as e:
                print(f"⚠️ Warning: Could not create MenuCategory: {e}")
                # Don't fail the main request if MenuCategory creation fails
            
            return response


class InventoryRequestViewSet(viewsets.ModelViewSet):
    queryset = InventoryRequest.objects.all()
    serializer_class = InventoryRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        Customize permissions based on action:
        - accept: Only managers can accept requests
        - reach: Only bartenders can mark as reached
        - create/update: Authenticated users can create/update their own requests
        - list/retrieve: Authenticated users can view requests
        """
        if self.action == 'accept':
            permission_classes = [IsManager]
        elif self.action == 'reject':
            permission_classes = [IsManager]
        elif self.action == 'reach':
            permission_classes = [IsBartender]
        elif self.action in ['create', 'update', 'partial_update']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filter requests based on user role:
        - Managers: See all requests from their branch
        - Bartenders: See only their own requests
        - Other users: See requests they created
        """
        user = self.request.user
        if user.role == 'manager':
            # Managers see all requests from their branch
            return InventoryRequest.objects.filter(branch=user.branch)
        elif user.role == 'bartender':
            # Bartenders see only their own requests
            return InventoryRequest.objects.filter(requested_by=user)
        else:
            # Other users see requests they created
            return InventoryRequest.objects.filter(requested_by=user)

    def perform_create(self, serializer):
        # 🔧 NEW: Automatically set input unit and calculate both quantities
        data = serializer.validated_data
        product = data['product']
        
        # Auto-select input unit if not specified
        if not data.get('request_unit') and product.input_unit:
            data['request_unit'] = product.input_unit
            print(f"[DEBUG] Auto-selected input unit: {product.input_unit.unit_name}")
        
        # Calculate both input and base unit quantities
        if data.get('request_unit') and product.base_unit:
            try:
                # Calculate base units from request quantity
                conversion_factor = product.get_conversion_factor(data['request_unit'], product.base_unit)
                quantity_in_base_units = (data['quantity'] * conversion_factor).quantize(Decimal('0.01'))
                
                # Store both quantities
                data['quantity_in_input_units'] = data['quantity']
                data['quantity_in_base_units'] = quantity_in_base_units
                
                print(f"[DEBUG] Request quantities calculated:")
                print(f"  Input: {data['quantity']} {data['request_unit'].unit_name}")
                print(f"  Base: {quantity_in_base_units} {product.base_unit.unit_name}")
                
            except ValueError as e:
                print(f"[WARNING] Could not calculate conversion: {e}")
                # Fallback: store input quantity only
                data['quantity_in_input_units'] = data['quantity']
        
        # Set requested_by to the current user if not already set
        if not data.get('requested_by'):
            serializer.save(requested_by=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def accept(self, request, pk=None):
        """
        Accept an inventory request (managers only)
        """
        print(f"[DEBUG] Accept method called - User: {request.user.username}, Role: {getattr(request.user, 'role', 'None')}")
        print(f"[DEBUG] Request method: {request.method}, URL: {request.path}")
        
        try:
            req = self.get_object()
            
            # Debug logging
            print(f"[DEBUG] Accept request - User: {request.user.username}, Role: {getattr(request.user, 'role', 'None')}, Branch: {getattr(request.user, 'branch', 'None')}")
            print(f"[DEBUG] Request: {req.id}, Status: {req.status}, Branch: {req.branch}")
            
            # Check if request is pending
            if req.status != 'pending':
                return Response({'detail': 'Request is not pending.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if manager is from the same branch as the request
            user_branch_id = request.user.branch.id if hasattr(request.user.branch, 'id') else request.user.branch
            request_branch_id = req.branch.id if hasattr(req.branch, 'id') else req.branch
            
            print(f"[DEBUG] Branch comparison - User branch: {request.user.branch} (ID: {user_branch_id}), Request branch: {req.branch} (ID: {request_branch_id})")
            print(f"[DEBUG] Branch types - User branch type: {type(request.user.branch)}, Request branch type: {type(req.branch)}")
            
            if user_branch_id != request_branch_id:
                print(f"[ERROR] Branch mismatch - user_branch_id: {user_branch_id}, request_branch_id: {request_branch_id}")
                return Response({
                    'detail': 'You can only accept requests from your own branch.',
                    'user_branch': str(request.user.branch),
                    'request_branch': str(req.branch),
                    'user_branch_id': user_branch_id,
                    'request_branch_id': request_branch_id
                }, status=status.HTTP_403_FORBIDDEN)
            
            print(f"[DEBUG] Branch check passed - both branches match: {user_branch_id}")
            
            # Check stock availability
            stock = Stock.objects.get(product=req.product, branch=req.branch)
            conversion_factor = req.product.get_conversion_factor(req.request_unit, req.product.base_unit)
            quantity_in_base_units = (req.quantity * conversion_factor).quantize(Decimal('0.01'))
            
            # 🔧 FIXED: Use calculated_base_units instead of quantity_in_base_units
            available_stock = stock.calculated_base_units or 0
            
            if available_stock < quantity_in_base_units:
                return Response({
                    'detail': 'Not enough stock to fulfill request.',
                    'available': available_stock,
                    'required': quantity_in_base_units,
                    'unit': stock.product.base_unit.unit_name
                }, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"[DEBUG] Accepted request: Stock check passed - {quantity_in_base_units} base units available")
            
            # Update request status
            req.status = 'accepted'
            req.responded_by = request.user
            req.save()
            
            return Response({'status': 'accepted'}, status=status.HTTP_200_OK)
            
        except Stock.DoesNotExist:
            return Response({'detail': 'No stock found for this product and branch.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"[ERROR] Error accepting request: {e}")
            return Response({'detail': f'Error accepting request: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def reject(self, request, pk=None):
        """
        Reject an inventory request (managers only)
        """
        req = self.get_object()
        
        # Check if request is pending
        if req.status != 'pending':
            return Response({'detail': 'Request is not pending.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if manager is from the same branch as the request
        user_branch_id = request.user.branch.id if hasattr(request.user.branch, 'id') else request.user.branch
        request_branch_id = req.branch.id if hasattr(req.branch, 'id') else req.branch
        
        if user_branch_id != request_branch_id:
            return Response({'detail': 'You can only reject requests from your own branch.'}, status=status.HTTP_403_FORBIDDEN)
        
        req.status = 'rejected'
        req.responded_by = request.user
        req.save()
        return Response({'status': 'rejected'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def debug_permissions(self, request):
        """
        Debug endpoint to check user permissions and role
        """
        user = request.user
        return Response({
            'user_id': user.id if user.is_authenticated else None,
            'username': user.username if user.is_authenticated else None,
            'is_authenticated': user.is_authenticated,
            'role': getattr(user, 'role', None),
            'branch': getattr(user, 'branch', None),
            'branch_id': getattr(user, 'branch_id', None),
            'is_staff': getattr(user, 'is_staff', False),
            'is_superuser': getattr(user, 'is_superuser', False),
        })

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def reach(self, request, pk=None):
        """
        Mark an inventory request as reached (bartenders only)
        """
        req = self.get_object()
        
        # Check if request is accepted
        if req.status != 'accepted':
            return Response({'detail': 'Request is not accepted.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if the user is the one who made the request
        if request.user != req.requested_by:
            return Response({'detail': 'You can only mark your own requests as reached.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Only update if not already fulfilled
        if req.status != 'fulfilled':
            try:
                # Get the stock to check availability
                stock = Stock.objects.get(product=req.product, branch=req.branch)
                
                # Convert request quantity to base units
                conversion_factor = req.product.get_conversion_factor(req.request_unit, req.product.base_unit)
                quantity_in_base_units = (req.quantity * conversion_factor).quantize(Decimal('0.01'))
                
                # Check if enough stock is available
                # 🔧 FIXED: Use calculated_base_units instead of quantity_in_base_units
                available_stock = stock.calculated_base_units or 0
                if available_stock < quantity_in_base_units:
                    return Response({
                        'detail': f'Not enough stock to fulfill request. Available: {available_stock} {stock.product.base_unit.unit_name}, Required: {quantity_in_base_units} {stock.product.base_unit.unit_name}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Update the request status to fulfilled
                req.status = 'fulfilled'
                req.reached_status = True
                req.responded_by = request.user
                req.save()  # This triggers InventoryRequest.save(), which creates the transaction and deducts stock
                
                print(f"[DEBUG] Request {req.id} marked as reached and fulfilled. Stock deducted: {quantity_in_base_units} {req.product.base_unit.unit_name}")
                
            except Stock.DoesNotExist:
                return Response({'detail': 'No stock found for this product and branch.'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                print(f"[ERROR] Error marking request as reached: {e}")
                return Response({'detail': f'Error marking request as reached: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'reached_status': True, 'status': 'fulfilled'}, status=status.HTTP_200_OK)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.prefetch_related('store_stocks', 'store_stocks__branch').all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductWithStockSerializer
        return ProductSerializer

    def create(self, request, *args, **kwargs):
        # Custom create to handle initial stock with correct conversion
        with transaction.atomic():
            response = super().create(request, *args, **kwargs)
            product_id = response.data.get('id')
            product = Product.objects.get(id=product_id)
            # Expect initial stock info in request.data
            stock_data = request.data.get('initial_stock')
            if stock_data:
                branch_id = stock_data.get('branch_id')
                input_quantity = Decimal(stock_data.get('input_quantity', 0))
                minimum_threshold_input_units = Decimal(stock_data.get('minimum_threshold_input_units', 0))
                branch = Branch.objects.get(id=branch_id)
                
                # 🔧 NEW: Calculate calculated_base_units using the new simplified structure
                calculated_base_units = None
                minimum_threshold_base_units = None
                if input_quantity and product.conversion_amount:
                    try:
                        calculated_base_units = (Decimal(str(input_quantity)) * product.conversion_amount).quantize(Decimal('0.01'))
                        # Also calculate minimum threshold in base units
                        if minimum_threshold_input_units:
                            minimum_threshold_base_units = (minimum_threshold_input_units * product.conversion_amount).quantize(Decimal('0.01'))
                    except Exception as e:
                        print(f"Error calculating base units: {e}")
                
                Stock.objects.create(
                    product=product,
                    branch=branch,
                    minimum_threshold_base_units=minimum_threshold_base_units or Decimal('0'),
                    # 🔧 NEW: Use simplified fields
                    input_quantity=input_quantity,
                    calculated_base_units=calculated_base_units,
                )
            
            # 🔧 NEW: Create ProductMeasurement for input unit to base unit conversion
            if product.input_unit and product.base_unit and product.conversion_amount:
                try:
                    from .models import ProductMeasurement
                    ProductMeasurement.objects.create(
                        product=product,
                        from_unit=product.input_unit,
                        to_unit=product.base_unit,
                        amount_per=product.conversion_amount,
                        is_default_sales_unit=True,
                    )
                    print(f"✅ Product measurement created: 1 {product.input_unit.unit_name} = {product.conversion_amount} {product.base_unit.unit_name}")
                except Exception as e:
                    print(f"⚠️ Warning: Could not create product measurement: {e}")
            
            return response

    def create_product_with_related(self, product_data):
        # Check for duplicate product name first
        product_name = product_data.get('name', '').strip()
        if Product.objects.filter(name__iexact=product_name).exists():
            raise ValueError(f"Product with name '{product_name}' already exists.")
        
        # Extract stock and measurement data
        stock_data = product_data.get('stock', {})
        measurement_data = product_data.get('measurement', {})
        
        # Create the product with new fields
        product = Product.objects.create(
            name=product_data['name'],
            description=product_data.get('description', ''),
            base_unit_price=product_data.get('base_unit_price'),
            base_unit_id=product_data.get('base_unit_id'),
            category_id=product_data.get('category_id'),
            # 🔧 NEW: Add new fields from Add Product form
            item_type_id=product_data.get('item_type_id'),
            input_unit_id=product_data.get('input_unit_id'),
            conversion_amount=product_data.get('conversion_amount'),
        )
        
        # Create measurement FIRST if measurement_data is provided
        if measurement_data:
            try:
                ProductMeasurement.objects.create(
                    product=product,
                    from_unit_id=measurement_data.get('from_unit_id'),
                    to_unit_id=measurement_data.get('to_unit_id'),
                    amount_per=measurement_data.get('amount_per'),
                    is_default_sales_unit=measurement_data.get('is_default_sales_unit', False),
                )
                print(f"Product measurement created successfully")
            except Exception as e:
                print(f"Error creating measurement: {e}")
                raise ValueError(f"Error creating measurement: {e}")
        
        # Create stock AFTER measurement is created
        if stock_data:
            try:
                branch_id = stock_data.get('branch_id')
                input_quantity = stock_data.get('input_quantity')
                minimum_threshold_input_units = stock_data.get('minimum_threshold_input_units', 0)
                
                print(f"[DEBUG] Stock data - input_quantity: {input_quantity} (from Add Product form)")
                print(f"[DEBUG] Stock data - minimum_threshold_input_units: {minimum_threshold_input_units}")
                
                if not branch_id:
                    raise ValueError("branch_id is required in stock_data")
                
                branch = Branch.objects.get(id=branch_id)
                
                # 🔧 NEW: Calculate calculated_base_units using the new simplified structure
                calculated_base_units = None
                minimum_threshold_base_units = None
                if input_quantity and product.conversion_amount:
                    try:
                        calculated_base_units = (Decimal(str(input_quantity)) * product.conversion_amount).quantize(Decimal('0.01'))
                        print(f"Calculated base units from input_quantity * conversion_amount: {calculated_base_units}")
                        # Also calculate minimum threshold in base units
                        if minimum_threshold_input_units:
                            minimum_threshold_base_units = (Decimal(str(minimum_threshold_input_units)) * product.conversion_amount).quantize(Decimal('0.01'))
                            print(f"Calculated minimum threshold base units: {minimum_threshold_base_units}")
                    except Exception as e:
                        print(f"Error calculating base units: {e}")
                
                stock = Stock.objects.create(
                    product=product,
                    branch=branch,
                    minimum_threshold_base_units=minimum_threshold_base_units or Decimal('0'),
                    # 🔧 NEW: Use simplified fields
                    input_quantity=input_quantity,
                    calculated_base_units=calculated_base_units,
                )
                print(f"Stock created successfully: {stock.id}")
                
                # Create inventory transaction for initial stock
                if input_quantity:
                    InventoryTransaction.objects.create(
                        product=product,
                        transaction_type='restock',
                        quantity=Decimal(str(input_quantity)),
                        transaction_unit=product.input_unit,
                        to_stock_main=stock,
                        branch=branch,
                        price_at_transaction=product.base_unit_price or Decimal('0.00'),
                        notes=f"Initial stock: {input_quantity} {product.input_unit.unit_name if product.input_unit else 'units'}"
                    )
                    print(f"Inventory transaction created for initial stock")
                
            except Exception as e:
                print(f"Error creating stock: {e}")
                raise ValueError(f"Error creating stock: {e}")
        
        return product

    def _get_default_conversion_factor(self, from_unit_name, to_unit_name):
        """Get default conversion factor for common unit combinations"""
        default_conversions = {
            'carton': {
                'bottle': 24,
                'shot': 480,
                'unit': 24,
            },
            'bottle': {
                'shot': 20,
                'ml': 750,
                'unit': 1,
            },
            'shot': {
                'ml': 37.5,
                'unit': 1,
            },
            'unit': {
                'shot': 1,
                'ml': 37.5,
            }
        }
        
        return default_conversions.get(from_unit_name.lower(), {}).get(to_unit_name.lower())

    @action(detail=False, methods=['get'], url_path='available')
    def available(self, request):
        products = Product.objects.filter(is_active=True)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='valid_units')
    def valid_units(self, request, pk=None):
        """Get valid restock units for a specific product"""
        try:
            product = self.get_object()
            valid_units = []
            measurements = ProductMeasurement.objects.filter(product=product)
            
            # Get all from_units that have conversions
            for measurement in measurements:
                if measurement.from_unit:
                    unit_name = measurement.from_unit.unit_name.lower()
                    if unit_name not in valid_units:
                        valid_units.append(unit_name)
            
            # If no valid units found, try to create common conversions
            if not valid_units:
                valid_units = self._create_default_conversions(product)
            
            return Response({
                'product_id': product.id,
                'product_name': product.name,
                'valid_units': valid_units,
                'base_unit': product.base_unit.unit_name if product.base_unit else None,
                'available_conversions': [
                    {
                        'from': m.from_unit.unit_name,
                        'to': m.to_unit.unit_name,
                        'factor': float(m.amount_per)
                    } for m in measurements
                ]
            })
        except Exception as e:
            return Response({'error': f'Error fetching valid units: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    def _create_default_conversions(self, product):
        """Create default unit conversions for common beverage products"""
        try:
            # Common beverage unit conversions
            default_conversions = {
                'carton': {
                    'bottle': 24,  # 1 carton = 24 bottles
                    'shot': 480,   # 1 carton = 480 shots (assuming 20 shots per bottle)
                },
                'bottle': {
                    'shot': 20,    # 1 bottle = 20 shots
                    'ml': 750,     # 1 bottle = 750ml
                },
                'shot': {
                    'ml': 37.5,    # 1 shot = 37.5ml
                }
            }
            
            created_units = []
            
            # Get or create common units
            units_to_create = {}
            for unit_name in ['carton', 'bottle', 'shot', 'ml']:
                unit, created = ProductUnit.objects.get_or_create(
                    unit_name=unit_name,
                    defaults={'is_liquid_unit': unit_name in ['shot', 'ml', 'bottle']}
                )
                units_to_create[unit_name] = unit
            
            # Create conversions
            for from_unit_name, conversions in default_conversions.items():
                from_unit = units_to_create.get(from_unit_name)
                if not from_unit:
                    continue
                    
                for to_unit_name, factor in conversions.items():
                    to_unit = units_to_create.get(to_unit_name)
                    if not to_unit:
                        continue
                    
                    # Check if conversion already exists
                    existing = ProductMeasurement.objects.filter(
                        product=product,
                        from_unit=from_unit,
                        to_unit=to_unit
                    ).first()
                    
                    if not existing:
                        ProductMeasurement.objects.create(
                            product=product,
                            from_unit=from_unit,
                            to_unit=to_unit,
                            amount_per=Decimal(str(factor)),
                            is_default_sales_unit=False
                        )
                        print(f"Created conversion: {from_unit_name} -> {to_unit_name} = {factor}")
                    
                    # Add to valid units if not already there
                    if from_unit_name not in created_units:
                        created_units.append(from_unit_name)
            
            return created_units
            
        except Exception as e:
            print(f"Error creating default conversions: {e}")
            return ['carton', 'bottle', 'unit']  # Fallback

    @action(detail=True, methods=['post'], url_path='add_conversion')
    def add_conversion(self, request, pk=None):
        """Add a new unit conversion for a product"""
        try:
            product = self.get_object()
            data = request.data
            
            from_unit_name = data.get('from_unit')
            to_unit_name = data.get('to_unit')
            conversion_factor = data.get('conversion_factor')
            
            if not all([from_unit_name, to_unit_name, conversion_factor]):
                return Response({
                    'error': 'Missing required fields: from_unit, to_unit, conversion_factor'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get or create units
            from_unit, _ = ProductUnit.objects.get_or_create(
                unit_name=from_unit_name,
                defaults={'is_liquid_unit': from_unit_name in ['shot', 'ml', 'bottle']}
            )
            to_unit, _ = ProductUnit.objects.get_or_create(
                unit_name=to_unit_name,
                defaults={'is_liquid_unit': to_unit_name in ['shot', 'ml', 'bottle']}
            )
            
            # Check if conversion already exists
            existing = ProductMeasurement.objects.filter(
                product=product,
                from_unit=from_unit,
                to_unit=to_unit
            ).first()
            
            if existing:
                existing.amount_per = Decimal(str(conversion_factor))
                existing.save()
                message = f"Updated conversion: {from_unit_name} -> {to_unit_name} = {conversion_factor}"
            else:
                ProductMeasurement.objects.create(
                    product=product,
                    from_unit=from_unit,
                    to_unit=to_unit,
                    amount_per=Decimal(str(conversion_factor)),
                    is_default_sales_unit=False
                )
                message = f"Created conversion: {from_unit_name} -> {to_unit_name} = {conversion_factor}"
            
            return Response({
                'message': message,
                'conversion': {
                    'from_unit': from_unit_name,
                    'to_unit': to_unit_name,
                    'factor': float(conversion_factor)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Error adding conversion: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='bulk_create')
    def bulk_create(self, request):
        products_data = request.data.get('products', [])
        print(f"Received {len(products_data)} products for bulk creation")
        if not isinstance(products_data, list):
            return Response({'detail': 'products must be a list'}, status=status.HTTP_400_BAD_REQUEST)
        created_products = []
        errors = []
        for i, pdata in enumerate(products_data):
            print(f"Processing product {i+1}: {pdata.get('name', 'Unknown')}")
            try:
                product = self.create_product_with_related(pdata)
                created_products.append(product)
                print(f"Successfully created product: {product.name}")
            except Exception as e:
                error_msg = f"Error creating product {pdata.get('name', 'Unknown')}: {str(e)}"
                print(error_msg)
                errors.append({'product': pdata.get('name'), 'error': str(e)})
        
        print(f"Bulk creation completed. Created: {len(created_products)}, Errors: {len(errors)}")
        if errors:
            return Response({'created': ProductSerializer(created_products, many=True).data, 'errors': errors}, status=status.HTTP_207_MULTI_STATUS)
        return Response(ProductSerializer(created_products, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='debug_values')
    def debug_values(self, request, pk=None):
        """Debug endpoint to show actual vs calculated values"""
        product = self.get_object()
        stocks = product.store_stocks.all()
        
        debug_data = {
            'product_id': product.id,
            'product_name': product.name,
            'base_unit': product.base_unit.unit_name if product.base_unit else None,
            'stocks': []
        }
        
        for stock in stocks:
            # Get the actual stored values
            actual_quantity_in_base_units = float(stock.calculated_base_units or 0)
            actual_input_quantity = float(stock.input_quantity or 0)
            
            # Calculate what the display property would show
            calculated_full_units = None
            if stock.product and stock.product.input_unit and stock.product.base_unit:
                try:
                    conversion_factor = stock.product.get_conversion_factor(stock.product.input_unit, stock.product.base_unit)
                    calculated_full_units = int(actual_quantity_in_base_units // conversion_factor)
                except:
                    pass
            
            stock_data = {
                'stock_id': stock.id,
                'branch': stock.branch.name,
                'actual_quantity_in_base_units': actual_quantity_in_base_units,
                'actual_input_quantity': actual_input_quantity,
                'input_unit': stock.product.input_unit.unit_name if stock.product and stock.product.input_unit else None,
                'calculated_full_units': calculated_full_units,
                'input_quantity_display': stock.input_quantity_with_unit,
            }
            debug_data['stocks'].append(stock_data)
        
        return Response(debug_data)


# Inventory Transaction
class InventoryTransactionViewSet(viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventoryTransactionSerializer
    permission_classes = [AllowAny]


# Stock
class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.select_related('product', 'branch').all()
    serializer_class = StockSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['post'], url_path='restock')
    @transaction.atomic
    def restock(self, request, pk=None):
        stock = self.get_object()
        product = stock.product
        data = request.data
        
        # Debug logging
        print(f"Restock request data: {data}")
        print(f"Files: {request.FILES}")
        
        try:
            restock_quantity = data.get('quantity')
            restock_type = data.get('type')  # 'carton', 'bottle', or 'unit'
            # Handle both field names that might be sent from frontend
            price_per_unit = data.get('price_per_unit') or data.get('price_at_transaction')
            total_amount = data.get('total_amount')
            receipt_file = request.FILES.get('receipt')
            
            print(f"Parsed values - quantity: {restock_quantity}, type: {restock_type}, price: {price_per_unit}")
            
            # Validate required fields with better error messages
            if not restock_quantity:
                return Response({'detail': 'Quantity is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                restock_quantity = Decimal(restock_quantity)
                if restock_quantity <= 0:
                    return Response({'detail': 'Quantity must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({'detail': 'Quantity must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not restock_type:
                return Response({'detail': 'Restock type is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not price_per_unit:
                return Response({'detail': 'Price per unit is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                price_per_unit = Decimal(price_per_unit)
                if price_per_unit <= 0:
                    return Response({'detail': 'Price per unit must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({'detail': 'Price per unit must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the restock unit
            try:
                restock_unit = ProductUnit.objects.get(unit_name=restock_type)
            except ProductUnit.DoesNotExist:
                return Response({'detail': f'Unit "{restock_type}" not found.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get conversion factor and validate
            try:
                conversion_factor = product.get_conversion_factor(restock_unit, product.base_unit)
                quantity_in_base_units = (restock_quantity * conversion_factor).quantize(Decimal('0.01'))
            except ValueError as e:
                # Try to create missing conversion automatically
                print(f"Missing conversion for {product.name}: {restock_type} -> {product.base_unit.unit_name}")
                try:
                    # Create a reasonable default conversion
                    default_factor = self._get_default_conversion_factor(restock_type, product.base_unit.unit_name)
                    if default_factor:
                        ProductMeasurement.objects.create(
                            product=product,
                            from_unit=restock_unit,
                            to_unit=product.base_unit,
                            amount_per=Decimal(str(default_factor)),
                            is_default_sales_unit=False
                        )
                        print(f"Auto-created conversion: {restock_type} -> {product.base_unit.unit_name} = {default_factor}")
                        conversion_factor = Decimal(str(default_factor))
                        quantity_in_base_units = (restock_quantity * conversion_factor).quantize(Decimal('0.01'))
                    else:
                        return Response({
                            'detail': f'No conversion path found for Product "{product.name}" from "{restock_type}" to "{product.base_unit.unit_name}". Please configure unit conversions.',
                            'suggestion': f'Try adding conversion: 1 {restock_type} = X {product.base_unit.unit_name}'
                        }, status=status.HTTP_400_BAD_REQUEST)
                except Exception as auto_create_error:
                    print(f"Failed to auto-create conversion: {auto_create_error}")
                    return Response({
                        'detail': f'No conversion path found for Product "{product.name}" from "{restock_type}" to "{product.base_unit.unit_name}". Please configure unit conversions.',
                        'suggestion': f'Try adding conversion: 1 {restock_type} = X {product.base_unit.unit_name}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update stock quantities - ADD to existing quantities, don't replace
            print(f"[DEBUG] Before restock - calculated_base_units: {stock.calculated_base_units}, input_quantity: {stock.input_quantity}")
            print(f"[DEBUG] Restock calculation - restock_quantity: {restock_quantity}, conversion_factor: {conversion_factor}, quantity_in_base_units: {quantity_in_base_units}")
            
            # Update the stock quantities directly to ADD to existing amounts
            if stock.calculated_base_units:
                stock.calculated_base_units = (stock.calculated_base_units + quantity_in_base_units).quantize(Decimal('0.01'))
            else:
                stock.calculated_base_units = quantity_in_base_units
            
            # Update input_quantity - this is what the frontend displays
            if stock.input_quantity and stock.product and stock.product.input_unit and stock.product.input_unit == restock_unit:
                # Same input unit, add to existing
                stock.input_quantity = (stock.input_quantity + restock_quantity).quantize(Decimal('0.01'))
                print(f"[DEBUG] Same input unit restock - added {restock_quantity} to existing input_quantity: {stock.input_quantity}")
            elif stock.input_quantity and stock.product and stock.product.input_unit and stock.product.input_unit != restock_unit:
                # Different input units, try to convert existing to new unit and add
                try:
                    existing_conversion = product.get_conversion_factor(stock.product.input_unit, restock_unit)
                    converted_existing = stock.input_quantity * existing_conversion
                    stock.input_quantity = (converted_existing + restock_quantity).quantize(Decimal('0.01'))
                    # Update the product's input_unit to match the restock unit
                    stock.product.input_unit = restock_unit
                    stock.product.save(update_fields=['input_unit'])
                    print(f"[DEBUG] Input unit conversion restock - from {stock.product.input_unit.unit_name} to {restock_unit.unit_name}, factor: {existing_conversion}, converted: {converted_existing}")
                except ValueError:
                    # If conversion doesn't exist, just add the new quantity and update unit
                    stock.input_quantity = restock_quantity
                    stock.product.input_unit = restock_unit
                    stock.product.save(update_fields=['input_unit'])
                    print(f"[DEBUG] No input unit conversion found, using new quantity: {restock_quantity}")
            else:
                # No existing input_quantity or input_unit, set to new values
                stock.input_quantity = restock_quantity
                if not stock.product.input_unit:
                    stock.product.input_unit = restock_unit
                    stock.product.save(update_fields=['input_unit'])
                print(f"[DEBUG] No existing input unit, set to new values: {restock_quantity} {restock_unit.unit_name}")
            
            stock.last_stock_update = timezone.now()
            stock.save()
            
            print(f"[DEBUG] After restock - calculated_base_units: {stock.calculated_base_units}, input_quantity: {stock.input_quantity}")
            
            # Create inventory transaction - use constructor to avoid double save
            user = request.user if request.user.is_authenticated else None
            username = user.username if user else "API"
            
            transaction_notes = f"Restocked {restock_quantity} {restock_unit.unit_name}(s) by {username}"
            if receipt_file:
                transaction_notes += f" - Receipt: {receipt_file.name}"
            
            # REMOVED: Update the stock's original_unit to match the restock unit
            # Let the InventoryTransaction handle all stock updates
            # if stock.original_unit != restock_unit:
            #     stock.original_unit = restock_unit
            #     stock.save(update_fields=['original_unit'])
            
            # Use constructor instead of create() to avoid double save
            transaction = InventoryTransaction(
                product=product,
                transaction_type='restock',
                quantity=restock_quantity,
                transaction_unit=restock_unit,
                to_stock_main=stock,
                branch=stock.branch,
                initiated_by=user,
                price_at_transaction=price_per_unit,
                notes=transaction_notes,
            )
            # Set the quantity_in_base_units directly to avoid double calculation
            transaction.quantity_in_base_units = quantity_in_base_units
            transaction._skip_quantity_calculation = True
            transaction.save(skip_stock_adjustment=True)  # Skip stock adjustment since we handled it manually
            
            return Response({
                'detail': 'Restocked successfully.',
                'quantity_added': float(quantity_in_base_units),
                'base_unit': product.base_unit.unit_name,
                'total_amount': float(total_amount) if total_amount else None
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Restock error: {str(e)}")
            return Response({'detail': f'Restock failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    def _get_default_conversion_factor(self, from_unit_name, to_unit_name):
        """Get default conversion factor for common unit combinations"""
        default_conversions = {
            'carton': {
                'bottle': 24,
                'shot': 480,
                'unit': 24,
            },
            'bottle': {
                'shot': 20,
                'ml': 750,
                'unit': 1,
            },
            'shot': {
                'ml': 37.5,
                'unit': 1,
            },
            'unit': {
                'shot': 1,
                'ml': 37.5,
            }
        }
        
        return default_conversions.get(from_unit_name.lower(), {}).get(to_unit_name.lower())


class BarmanStockViewSet(viewsets.ModelViewSet):
    queryset = BarmanStock.objects.select_related('stock__product', 'stock__branch', 'bartender')
    serializer_class = BarmanStockSerializer
    permission_classes = [AllowAny]  # Temporarily allow all access for debugging

    def get_queryset(self):
        # Temporarily return all records for debugging
        qs = BarmanStock.objects.select_related('stock__product', 'stock__branch', 'bartender')
        print(f"[DEBUG] BarmanStockViewSet.get_queryset() - Returning all records: {qs.count()}")
        return qs

    @action(detail=True, methods=['post'], url_path='restock')
    @transaction.atomic
    def restock(self, request, pk=None):
        barman_stock = self.get_object()
        product = barman_stock.stock.product
        data = request.data
        
        # Debug logging
        print(f"[DEBUG] BarmanStock restock request data: {data}")
        print(f"[DEBUG] Files: {request.FILES}")
        
        try:
            restock_quantity = data.get('quantity')
            restock_type = data.get('type')  # 'carton', 'bottle', or 'unit'
            price_per_unit = data.get('price_per_unit') or data.get('price_at_transaction')
            total_amount = data.get('total_amount')
            receipt_file = request.FILES.get('receipt')
            
            print(f"[DEBUG] Parsed values - quantity: {restock_quantity}, type: {restock_type}, price: {price_per_unit}")
            
            # Validate required fields
            if not restock_quantity:
                return Response({'detail': 'Quantity is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                restock_quantity = Decimal(restock_quantity)
                if restock_quantity <= 0:
                    return Response({'detail': 'Quantity must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({'detail': 'Quantity must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not restock_type:
                return Response({'detail': 'Restock type is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not price_per_unit:
                return Response({'detail': 'Price per unit is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                price_per_unit = Decimal(price_per_unit)
                if price_per_unit <= 0:
                    return Response({'detail': 'Price per unit must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({'detail': 'Price per unit must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the restock unit
            try:
                restock_unit = ProductUnit.objects.get(unit_name=restock_type)
            except ProductUnit.DoesNotExist:
                return Response({'detail': f'Unit "{restock_type}" not found.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get conversion factor and validate
            try:
                conversion_factor = product.get_conversion_factor(restock_unit, product.base_unit)
                quantity_in_base_units = (restock_quantity * conversion_factor).quantize(Decimal('0.01'))
            except ValueError as e:
                # Try to create missing conversion automatically
                print(f"Missing conversion for {product.name}: {restock_type} -> {product.base_unit.unit_name}")
                try:
                    # Create a reasonable default conversion
                    default_factor = self._get_default_conversion_factor(restock_type, product.base_unit.unit_name)
                    if default_factor:
                        ProductMeasurement.objects.create(
                            product=product,
                            from_unit=restock_unit,
                            to_unit=product.base_unit,
                            amount_per=Decimal(str(default_factor)),
                            is_default_sales_unit=False
                        )
                        print(f"Auto-created conversion: {restock_type} -> {product.base_unit.unit_name} = {default_factor}")
                        conversion_factor = Decimal(str(default_factor))
                        quantity_in_base_units = (restock_quantity * conversion_factor).quantize(Decimal('0.01'))
                    else:
                        return Response({
                            'detail': f'No conversion path found for Product "{product.name}" from "{restock_type}" to "{product.base_unit.unit_name}". Please configure unit conversions.',
                            'suggestion': f'Try adding conversion: 1 {restock_type} = X {product.base_unit.unit_name}'
                        }, status=status.HTTP_400_BAD_REQUEST)
                except Exception as auto_create_error:
                    print(f"Failed to auto-create conversion: {auto_create_error}")
                    return Response({
                        'detail': f'No conversion path found for Product "{product.name}" from "{restock_type}" to "{product.base_unit.unit_name}". Please configure unit conversions.',
                        'suggestion': f'Try adding conversion: 1 {restock_type} = X {product.base_unit.unit_name}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update barman stock quantities - let InventoryTransaction handle this
            # barman_stock.adjust_quantity(quantity_in_base_units, restock_unit, is_addition=True)  # REMOVED - causes double counting
            
            # Create inventory transaction - use constructor to avoid double save
            user = request.user if request.user.is_authenticated else None
            username = user.username if user else "API"
            
            transaction_notes = f"Barman restocked {restock_quantity} {restock_unit.unit_name}(s) by {username}"
            if receipt_file:
                transaction_notes += f" - Receipt: {receipt_file.name}"
            
            # Use constructor instead of create() to avoid double save
            transaction = InventoryTransaction(
                product=product,
                transaction_type='restock',
                quantity=restock_quantity,
                transaction_unit=restock_unit,
                to_stock_barman=barman_stock,
                branch=barman_stock.branch,
                initiated_by=user,
                price_at_transaction=price_per_unit,
                notes=transaction_notes,
            )
            # Set the quantity_in_base_units directly to avoid double calculation
            transaction.quantity_in_base_units = quantity_in_base_units
            transaction._skip_quantity_calculation = True
            transaction.save(skip_stock_adjustment=False)  # Single save call
            
            return Response({
                'detail': 'Barman stock restocked successfully.',
                'quantity_added': float(quantity_in_base_units),
                'base_unit': product.base_unit.unit_name,
                'total_amount': float(total_amount) if total_amount else None
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"BarmanStock restock error: {str(e)}")
            return Response({'detail': f'BarmanStock restock failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    def _get_default_conversion_factor(self, from_unit_name, to_unit_name):
        """Get default conversion factor for common unit combinations"""
        default_conversions = {
            'carton': {
                'bottle': 24,
                'shot': 480,
                'unit': 24,
            },
            'bottle': {
                'shot': 20,
                'ml': 750,
                'unit': 1,
            },
            'shot': {
                'ml': 37.5,
                'unit': 1,
            },
            'unit': {
                'shot': 1,
                'ml': 37.5,
            }
        }
        
        return default_conversions.get(from_unit_name.lower(), {}).get(to_unit_name.lower())


class ProductUnitViewSet(viewsets.ModelViewSet):
    queryset = ProductUnit.objects.all()
    serializer_class = ProductUnitSerializer
    permission_classes = [AllowAny]


class ProductMeasurementViewSet(viewsets.ModelViewSet):
    queryset = ProductMeasurement.objects.all()
    serializer_class = ProductMeasurementSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['product']

    @action(detail=False, methods=['post'], url_path='quick_fix')
    def quick_fix(self, request):
        """Quick fix for missing unit conversions"""
        try:
            data = request.data
            product_name = data.get('product_name')
            from_unit = data.get('from_unit')
            to_unit = data.get('to_unit')
            factor = data.get('factor')
            
            if not all([product_name, from_unit, to_unit, factor]):
                return Response({
                    'error': 'Missing required fields: product_name, from_unit, to_unit, factor'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get product
            try:
                product = Product.objects.get(name__iexact=product_name)
            except Product.DoesNotExist:
                return Response({
                    'error': f'Product "{product_name}" not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get or create units
            from_unit_obj, _ = ProductUnit.objects.get_or_create(
                unit_name=from_unit,
                defaults={'is_liquid_unit': from_unit in ['shot', 'ml', 'bottle']}
            )
            to_unit_obj, _ = ProductUnit.objects.get_or_create(
                unit_name=to_unit,
                defaults={'is_liquid_unit': to_unit in ['shot', 'ml', 'bottle']}
            )
            
            # Create conversion
            measurement, created = ProductMeasurement.objects.get_or_create(
                product=product,
                from_unit=from_unit_obj,
                to_unit=to_unit_obj,
                defaults={'amount_per': Decimal(str(factor))}
            )
            
            if not created:
                measurement.amount_per = Decimal(str(factor))
                measurement.save()
            
            return Response({
                'message': f'{"Created" if created else "Updated"} conversion for {product_name}: {from_unit} -> {to_unit} = {factor}',
                'conversion': {
                    'product': product.name,
                    'from_unit': from_unit,
                    'to_unit': to_unit,
                    'factor': float(factor)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Error creating conversion: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def reduce_bartender_inventory(request):
    """
    Reduce bartender inventory when an order is printed.
    Only reduces inventory for accepted items that are marked as 'reached'.
    """
    try:
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({
                'error': 'Order ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Import Order model here to avoid circular imports
        from orders.models import Order, OrderItem
        
        # Get the order and its items
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({
                'error': f'Order {order_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get accepted items from the order
        accepted_items = order.items.filter(status='accepted')
        print(f"🔍 DEBUG: Found {accepted_items.count()} accepted items in order {order_id}")
        for item in accepted_items:
            print(f"🔍 DEBUG: Accepted item: {item.name} x{item.quantity} (status: {item.status})")
        
        if not accepted_items.exists():
            return Response({
                'message': 'No accepted items to reduce inventory for'
            }, status=status.HTTP_200_OK)
        
        # Get the branch from the order
        branch = order.branch
        print(f"🔍 DEBUG: Order branch: {branch.name if branch else 'None'}")
        if not branch:
            return Response({
                'error': 'Order has no branch information'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        reduced_items = []
        errors = []
        
        with transaction.atomic():
            for item in accepted_items:
                try:
                    print(f"🔍 DEBUG: Processing item: {item.name} x{item.quantity}")
                    
                    # Find the product in the main inventory
                    product = Product.objects.filter(name__iexact=item.name).first()
                    print(f"🔍 DEBUG: Product found: {product.name if product else 'None'}")
                    if not product:
                        errors.append(f'Product "{item.name}" not found in inventory')
                        continue
                    
                    # Find the stock for this product and branch
                    stock = Stock.objects.filter(product=product, branch=branch).first()
                    print(f"�� DEBUG: Stock found: {stock.id if stock else 'None'} for product {product.name} in branch {branch.name}")
                    if not stock:
                        errors.append(f'Stock not found for product "{item.name}" in branch {branch.name}')
                        continue
                    
                    # Find bartender stocks for this product (regardless of branch)
                    # The issue was filtering by both stock AND branch, which excludes records with different branch values
                    bartender_stocks = BarmanStock.objects.filter(
                        stock=stock
                    ).order_by('-quantity_in_base_units')  # Order by highest quantity first
                    print(f"🔍 DEBUG: Found {bartender_stocks.count()} bartender stocks for {item.name}")
                    
                    if not bartender_stocks.exists():
                        errors.append(f'No bartender stock found for "{item.name}" in branch {branch.name}')
                        continue
                    
                    # Calculate total available stock across all bartender stocks
                    total_available_original = sum(bs.original_quantity or 0 for bs in bartender_stocks)
                    total_available_base = sum(bs.quantity_in_base_units or 0 for bs in bartender_stocks)
                    print(f"🔍 DEBUG: Total available - original: {total_available_original}, base: {total_available_base}")
                    
                    if total_available_original < item.quantity and total_available_base < item.quantity:
                        errors.append(f'Insufficient total stock for "{item.name}" - requested: {item.quantity}, available original: {total_available_original}, available base: {total_available_base}')
                        continue
                    
                    # Distribute reduction across bartender stocks intelligently
                    remaining_to_reduce = item.quantity
                    print(f"🔍 DEBUG: Need to reduce {remaining_to_reduce} units of {item.name}")
                    
                    for bartender_stock in bartender_stocks:
                        if remaining_to_reduce <= 0:
                            break
                            
                        print(f"🔍 DEBUG: Processing bartender stock {bartender_stock.id} - original_qty: {bartender_stock.original_quantity}, base_qty: {bartender_stock.quantity_in_base_units}")
                        
                        # Calculate how much to reduce from this stock
                        available_in_this_stock = bartender_stock.original_quantity or bartender_stock.quantity_in_base_units
                        if available_in_this_stock <= 0:
                            continue
                            
                        # Reduce from this stock (either all remaining or what's available)
                        reduction_amount = min(remaining_to_reduce, available_in_this_stock)
                        print(f"🔍 DEBUG: Reducing {reduction_amount} from stock {bartender_stock.id}")
                        
                        # Reduce original quantity
                        if bartender_stock.original_quantity:
                            bartender_stock.original_quantity = max(0, bartender_stock.original_quantity - reduction_amount)
                        
                        # Reduce base units proportionally
                        if bartender_stock.original_unit:
                            try:
                                conversion_factor = product.get_conversion_factor(bartender_stock.original_unit, product.base_unit)
                                base_units_to_reduce = reduction_amount * conversion_factor
                                print(f"🔍 DEBUG: Converting {reduction_amount} {bartender_stock.original_unit} to {base_units_to_reduce} {product.base_unit}")
                                bartender_stock.quantity_in_base_units = max(0, bartender_stock.quantity_in_base_units - base_units_to_reduce)
                            except Exception as e:
                                print(f"Warning: Could not convert units for {item.name}: {e}")
                                bartender_stock.quantity_in_base_units = max(0, bartender_stock.quantity_in_base_units - reduction_amount)
                        else:
                            bartender_stock.quantity_in_base_units = max(0, bartender_stock.quantity_in_base_units - reduction_amount)
                        
                        print(f"🔍 DEBUG: After reduction - original_qty: {bartender_stock.original_quantity}, base_qty: {bartender_stock.quantity_in_base_units}")
                        bartender_stock.save()
                        print(f"🔍 DEBUG: Bartender stock saved successfully")
                        
                        # Update remaining amount to reduce
                        remaining_to_reduce -= reduction_amount
                        print(f"🔍 DEBUG: Remaining to reduce: {remaining_to_reduce}")
                        
                        reduced_items.append({
                            'product': item.name,
                            'quantity': reduction_amount,
                            'bartender': bartender_stock.bartender.username,
                            'remaining_original': float(bartender_stock.original_quantity),
                            'remaining_base': float(bartender_stock.quantity_in_base_units)
                        })
                    
                    if remaining_to_reduce > 0:
                        errors.append(f'Could not fully reduce {item.name} - still need to reduce {remaining_to_reduce} units')
                    
                except Exception as e:
                    errors.append(f'Error processing item "{item.name}": {str(e)}')
                    continue
        
        if errors:
            return Response({
                'message': 'Inventory reduction completed with some errors',
                'reduced_items': reduced_items,
                'errors': errors
            }, status=status.HTTP_200_OK)
        
        return Response({
            'message': 'Inventory reduced successfully',
            'reduced_items': reduced_items
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Error reducing bartender inventory: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


