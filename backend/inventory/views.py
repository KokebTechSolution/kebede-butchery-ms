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


class InventoryRequestViewSet(viewsets.ModelViewSet):
    queryset = InventoryRequest.objects.all()
    serializer_class = InventoryRequestSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        # Set requested_by to the current user if not already set
        if not serializer.validated_data.get('requested_by'):
            serializer.save(requested_by=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def accept(self, request, pk=None):
        req = self.get_object();
        if req.status != 'pending':
            return Response({'detail': 'Request is not pending.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            stock = Stock.objects.get(product=req.product, branch=req.branch)
            # Convert request quantity to base units
            conversion_factor = req.product.get_conversion_factor(req.request_unit, req.product.base_unit)
            quantity_in_base_units = (req.quantity * conversion_factor).quantize(Decimal('0.01'))
            if stock.quantity_in_base_units < quantity_in_base_units:
                return Response({'detail': 'Not enough stock to fulfill request.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Update stock quantities
            stock.quantity_in_base_units = (stock.quantity_in_base_units - quantity_in_base_units).quantize(Decimal('0.01'))
            stock.original_quantity = max(Decimal('0.00'), (stock.original_quantity - req.quantity).quantize(Decimal('0.01')))
            stock.original_unit = req.request_unit
            stock.last_stock_update = timezone.now()
            stock.save()
            
            print(f"[DEBUG] Accepted request: Reduced stock by {quantity_in_base_units} base units, {req.quantity} {req.request_unit.unit_name}")
            
        except Stock.DoesNotExist:
            return Response({'detail': 'No stock found for this product and branch.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"[ERROR] Error accepting request: {e}")
            return Response({'detail': f'Error accepting request: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        req.status = 'accepted'
        req.save()
        return Response({'status': 'accepted'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def reach(self, request, pk=None):
        req = self.get_object()
        if req.status != 'accepted':
            return Response({'detail': 'Request is not accepted.'}, status=status.HTTP_400_BAD_REQUEST)
        # Only update if not already fulfilled
        if req.status != 'fulfilled':
            req.status = 'fulfilled'
            req.reached_status = True
            req.responded_by = request.user
            req.save()  # This triggers InventoryRequest.save(), which creates the transaction
        return Response({'reached_status': True}, status=status.HTTP_200_OK)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.prefetch_related('store_stocks', 'store_stocks__original_unit', 'store_stocks__branch').all()
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
                original_quantity = Decimal(stock_data.get('original_quantity'))
                original_unit_id = stock_data.get('original_unit_id')
                branch = Branch.objects.get(id=branch_id)
                original_unit = ProductUnit.objects.get(id=original_unit_id)
                conversion_factor = product.get_conversion_factor(original_unit, product.base_unit)
                quantity_in_base_units = original_quantity * conversion_factor
                Stock.objects.create(
                    product=product,
                    branch=branch,
                    quantity_in_base_units=quantity_in_base_units,
                    original_quantity=original_quantity,
                    original_unit=original_unit,
                    minimum_threshold_base_units=Decimal(stock_data.get('minimum_threshold_base_units', 0)),
                )
            return response

    def create_product_with_related(self, product_data):
        # Check for duplicate product name first
        product_name = product_data.get('name', '').strip()
        if Product.objects.filter(name__iexact=product_name).exists():
            raise ValueError(f"Product with name '{product_name}' already exists.")
        
        # Extract stock and measurement data
        stock_data = product_data.get('stock', {})
        measurement_data = product_data.get('measurement', {})
        
        # Create the product
        product = Product.objects.create(
            name=product_data['name'],
            description=product_data.get('description', ''),
            base_unit_price=product_data.get('base_unit_price'),
            base_unit_id=product_data.get('base_unit_id'),
            category_id=product_data.get('category_id'),
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
                original_quantity = stock_data.get('original_quantity')
                original_unit_id = stock_data.get('original_unit_id')
                provided_quantity_in_base_units = stock_data.get('quantity_in_base_units')
                
                if not original_unit_id:
                    raise ValueError("original_unit_id is required in stock_data")
                
                branch = Branch.objects.get(id=branch_id)
                original_unit = ProductUnit.objects.get(id=original_unit_id)
                
                # Use provided quantity_in_base_units if available, otherwise calculate
                if provided_quantity_in_base_units is not None:
                    quantity_in_base_units = Decimal(provided_quantity_in_base_units).quantize(Decimal('0.01'))
                    print(f"Using provided quantity_in_base_units: {quantity_in_base_units}")
                else:
                    # Calculate quantity in base units - now the conversion should exist
                    try:
                        conversion_factor = product.get_conversion_factor(original_unit, product.base_unit)
                        quantity_in_base_units = (Decimal(original_quantity) * conversion_factor).quantize(Decimal('0.01'))
                        print(f"Calculated quantity_in_base_units: {quantity_in_base_units} (original: {original_quantity}, conversion: {conversion_factor})")
                    except ValueError as e:
                        # If conversion doesn't exist, try to create it automatically
                        print(f"Missing conversion for {product.name}: {original_unit.unit_name} -> {product.base_unit.unit_name}")
                        default_factor = self._get_default_conversion_factor(original_unit.unit_name, product.base_unit.unit_name)
                        if default_factor:
                            ProductMeasurement.objects.create(
                                product=product,
                                from_unit=original_unit,
                                to_unit=product.base_unit,
                                amount_per=Decimal(str(default_factor)),
                                is_default_sales_unit=False
                            )
                            print(f"Auto-created conversion: {original_unit.unit_name} -> {product.base_unit.unit_name} = {default_factor}")
                            conversion_factor = Decimal(str(default_factor))
                            quantity_in_base_units = (Decimal(original_quantity) * conversion_factor).quantize(Decimal('0.01'))
                            print(f"Auto-calculated quantity_in_base_units: {quantity_in_base_units} (original: {original_quantity}, conversion: {conversion_factor})")
                        else:
                            raise ValueError(f"No conversion path found and no default available for {original_unit.unit_name} -> {product.base_unit.unit_name}")
                
                stock = Stock.objects.create(
                    product=product,
                    branch=branch,
                    quantity_in_base_units=quantity_in_base_units,
                    original_quantity=original_quantity,
                    original_unit=original_unit,
                    minimum_threshold_base_units=stock_data.get('minimum_threshold_base_units', 0),
                )
                print(f"Stock created successfully: {stock.id}")
                
                # Create inventory transaction for initial stock
                InventoryTransaction.objects.create(
                    product=product,
                    transaction_type='restock',
                    quantity=original_quantity,
                    transaction_unit=original_unit,
                    to_stock_main=stock,
                    branch=branch,
                    price_at_transaction=product.base_unit_price or Decimal('0.00'),
                    notes=f"Initial stock: {original_quantity} {original_unit.unit_name}"
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
            actual_quantity_in_base_units = float(stock.quantity_in_base_units)
            actual_original_quantity = float(stock.original_quantity)
            
            # Calculate what the display property would show
            calculated_full_units = None
            if stock.original_unit and stock.product.base_unit:
                try:
                    conversion_factor = stock.product.get_conversion_factor(stock.original_unit, stock.product.base_unit)
                    calculated_full_units = int(actual_quantity_in_base_units // conversion_factor)
                except:
                    pass
            
            stock_data = {
                'stock_id': stock.id,
                'branch': stock.branch.name,
                'actual_quantity_in_base_units': actual_quantity_in_base_units,
                'actual_original_quantity': actual_original_quantity,
                'original_unit': stock.original_unit.unit_name if stock.original_unit else None,
                'calculated_full_units': calculated_full_units,
                'original_quantity_display': stock.original_quantity_display,
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
            
            # Update stock quantities
            stock.quantity_in_base_units = (stock.quantity_in_base_units + quantity_in_base_units).quantize(Decimal('0.01'))
            # Add the restock quantity to original_quantity (this is the actual quantity in original units)
            stock.original_quantity = (stock.original_quantity + restock_quantity).quantize(Decimal('0.01'))
            stock.original_unit = restock_unit
            stock.last_stock_update = timezone.now()
            stock.save()
            
            # Create inventory transaction
            user = request.user if request.user.is_authenticated else None
            username = user.username if user else "API"
            
            transaction_notes = f"Restocked {restock_quantity} {restock_unit.unit_name}(s) by {username}"
            if receipt_file:
                transaction_notes += f" - Receipt: {receipt_file.name}"
            
            InventoryTransaction.objects.create(
                product=product,
                transaction_type='restock',
                quantity=restock_quantity,
                transaction_unit=restock_unit,
                to_stock_main=stock,
                branch=stock.branch,
                initiated_by=user,
                price_at_transaction=price_per_unit,
                notes=transaction_notes
            )
            
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
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        qs = BarmanStock.objects.select_related('stock__product', 'stock__branch', 'bartender')
        if user.is_staff:
            return qs
        return qs.filter(bartender=user)


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

