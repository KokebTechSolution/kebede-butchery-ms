from decimal import Decimal
from django.db import transaction, models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.contrib.auth import get_user_model

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser # Import IsAdminUser

# Get the custom User model if defined, otherwise Django's default
User = get_user_model()

from .models import (
    ItemType, Category, Product, InventoryTransaction,
    InventoryRequest, Stock, Branch, ProductMeasurement, BarmanStock, ProductUnit
)
from .serializers import (
    ItemTypeSerializer, CategorySerializer, ProductSerializer,
    InventoryTransactionSerializer, InventoryRequestSerializer,
    StockSerializer, BranchSerializer, BarmanStockSerializer
)

# --- Branch ViewSet (Read-Only) ---
class BranchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [AllowAny] # Branches can be publicly listed

# --- Item Type ViewSet ---
class ItemTypeViewSet(viewsets.ModelViewSet):
    queryset = ItemType.objects.all()
    serializer_class = ItemTypeSerializer
    permission_classes = [IsAdminUser] # Only admins can manage item types

# --- Category ViewSet ---
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser] # Only admins can manage categories

# --- Product ViewSet ---
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    # Allow authenticated users to view products and perform stock actions
    # Only admins can create/update/delete products themselves
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def restock(self, request, pk=None):
        """
        Records a restock event for a product into the main store stock.
        Requires 'quantity', 'unit_name', 'branch_id', and optionally 'price'.
        """
        self.permission_classes = [IsAdminUser] # Only admins can restock
        return self._handle_stock_transaction(request, pk, 'restock', is_addition=True)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def record_sale_from_main_store(self, request, pk=None):
        """
        Records a sale directly from the main store stock (e.g., bulk sale).
        Requires 'quantity', 'unit_name', 'branch_id', and 'price'.
        """
        self.permission_classes = [IsAdminUser] # Only admins/managers should sell from main store
        return self._handle_stock_transaction(request, pk, 'sale', is_addition=False)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def record_wastage_from_main_store(self, request, pk=None):
        """
        Records wastage from the main store stock.
        Requires 'quantity', 'unit_name', 'branch_id', and optionally 'notes'.
        """
        self.permission_classes = [IsAdminUser] # Only admins/managers should record wastage
        return self._handle_stock_transaction(request, pk, 'wastage', is_addition=False)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        Retrieves the transaction history for a specific product.
        """
        product = self.get_object()
        transactions = InventoryTransaction.objects.filter(product=product).order_by('-transaction_date')
        serializer = InventoryTransactionSerializer(transactions, many=True)
        return Response({
            'product': ProductSerializer(product).data,
            'transactions': serializer.data
        })

    @action(detail=False, methods=['get'])
    def available(self, request):
        """
        Returns products that have any quantity (greater than 0) in the main store stock.
        """
        product_ids = Stock.objects.filter(
            quantity_in_base_units__gt=0
        ).values_list('product_id', flat=True).distinct()
        products = Product.objects.filter(id__in=product_ids, is_active=True)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    def _handle_stock_transaction(self, request, pk, transaction_type, is_addition):
        """
        Helper method for common main store stock transactions (restock, sale, wastage).
        """
        product = self.get_object()
        quantity_str = request.data.get('quantity')
        unit_name = request.data.get('unit_name') # Unit name (e.g., 'carton', 'bottle', 'shot')
        branch_id = request.data.get('branch_id') # Use branch ID for consistency
        price_at_transaction = request.data.get('price', None) # For sales/restocks
        notes = request.data.get('notes', None) # For wastage

        if not all([quantity_str, unit_name, branch_id]):
            return Response({'error': 'Quantity, unit_name, and branch_id are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = Decimal(quantity_str)
            if quantity <= 0:
                return Response({'error': 'Quantity must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)
            if price_at_transaction is not None:
                price_at_transaction = Decimal(price_at_transaction)
        except ValueError:
            return Response({'error': 'Quantity and/or Price must be valid numbers.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            branch = Branch.objects.get(pk=branch_id)
        except Branch.DoesNotExist:
            return Response({'error': f'Branch with ID "{branch_id}" does not exist.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transaction_unit = ProductUnit.objects.get(unit_name=unit_name)
        except ProductUnit.DoesNotExist:
            return Response({'error': f'Unit "{unit_name}" is not a valid product unit.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get the main store stock, locking it for update
            stock, created = Stock.objects.select_for_update().get_or_create(
                product=product,
                branch=branch,
                defaults={'minimum_threshold_base_units': Decimal('0.00')}
            )

            # Use the adjust_quantity method, which handles conversions
            stock.adjust_quantity(quantity, transaction_unit, is_addition=is_addition)

            # Create the InventoryTransaction
            InventoryTransaction.objects.create(
                product=product,
                transaction_type=transaction_type,
                quantity=quantity,
                transaction_unit=transaction_unit,
                from_stock_main=stock if not is_addition else None, # Source for outbound
                to_stock_main=stock if is_addition else None,     # Destination for inbound
                initiated_by=request.user, # The user performing the action
                price_at_transaction=price_at_transaction,
                notes=notes
            )

            return Response({'message': f'{transaction_type.title()} transaction recorded successfully.'}, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e: # Catch errors from get_conversion_factor (e.g., no conversion path)
            return Response({'error': f"Conversion error: {e}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Inventory Request ViewSet ---
class InventoryRequestViewSet(viewsets.ModelViewSet):
    queryset = InventoryRequest.objects.all()
    serializer_class = InventoryRequestSerializer
    permission_classes = [IsAuthenticated] # Authenticated users can create/view requests

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_staff: # Staff can see all requests
            return qs
        # Regular users (e.g., barmen) only see their own requests
        return qs.filter(requested_by=user)

    def perform_create(self, serializer):
        # Automatically set requested_by to current user
        if not self.request.user.is_authenticated:
            raise ValidationError("Authenticated user is required to create a request.")
        serializer.save(requested_by=self.request.user)


    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    @transaction.atomic
    def accept(self, request, pk=None):
        """
        Accepts a pending inventory request. This implies the store acknowledges
        the request and marks it for fulfillment by a manager/admin.
        """
        req = self.get_object()
        if req.status != 'pending':
            return Response({'error': 'Request already processed (not pending).'}, status=status.HTTP_400_BAD_REQUEST)

        req.status = 'accepted'
        req.responded_at = timezone.now()
        req.responded_by = request.user
        req.save() # This save triggers the model's logic for status update

        return Response({'message': 'Request accepted successfully. Awaiting fulfillment (delivery).'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    @transaction.atomic
    def fulfill(self, request, pk=None):
        """
        Marks an accepted request as fulfilled, performing the stock transfer
        from main store stock to barman stock. This is typically done by a manager.
        """
        req = self.get_object()
        if req.status != 'accepted':
            return Response({'error': 'Request must be in "accepted" status to be fulfilled.'}, status=status.HTTP_400_BAD_REQUEST)
        if req.status == 'fulfilled':
            return Response({'error': 'Request already fulfilled.'}, status=status.HTTP_400_BAD_REQUEST)

        product = req.product
        requested_quantity = req.quantity
        requested_unit = req.request_unit

        try:
            # 1. Get main store stock, locking for update to prevent race conditions
            store_stock = Stock.objects.select_for_update().get(product=product, branch=req.branch)
        except Stock.DoesNotExist:
            return Response({'error': f"Main store stock for {product.name} at {req.branch.name} not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            # 2. Get or create barman stock, also locking for update
            barman_stock, created = BarmanStock.objects.select_for_update().get_or_create(
                product=product,
                bartender=req.requested_by, # The barman who made the request
                branch=req.branch,
                defaults={'minimum_threshold_base_units': Decimal('0.00')} # Set default if new
            )

            # Perform the stock deductions and additions
            # adjust_quantity will handle validation (e.g., insufficient stock)
            store_stock.adjust_quantity(requested_quantity, requested_unit, is_addition=False)
            barman_stock.adjust_quantity(requested_quantity, requested_unit, is_addition=True)

            # Update request status to 'fulfilled'
            req.status = 'fulfilled'
            req.responded_at = timezone.now()
            req.responded_by = request.user # User performing the fulfillment
            req.save() # This save will trigger the InventoryTransaction creation in the model

            return Response({'message': 'Request fulfilled. Stock transferred to bartender.'}, status=status.HTTP_200_OK)

        except ValidationError as e:
            # Catch validation errors from adjust_quantity (e.g., insufficient stock)
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e: # Catch errors from get_conversion_factor (e.g., no conversion path)
            return Response({'error': f"Conversion error during fulfillment: {e}"}, status=status.HTTP_400_BAD_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f"An unexpected error occurred during fulfillment: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    @transaction.atomic
    def reject(self, request, pk=None):
        """
        Rejects a pending or accepted inventory request.
        """
        req = self.get_object()
        if req.status not in ['pending', 'accepted']:
            return Response({'error': 'Request cannot be rejected from its current status.'}, status=status.HTTP_400_BAD_REQUEST)

        req.status = 'rejected'
        req.responded_at = timezone.now()
        req.responded_by = request.user
        req.save()

        return Response({'message': 'Request rejected successfully.'}, status=status.HTTP_200_OK)

# --- Inventory Transaction ViewSet (Read-Only/Admin) ---
class InventoryTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventoryTransactionSerializer
    permission_classes = [IsAdminUser] # Transactions are typically managed/viewed by admins

    # If you need to allow specific users to view their own related transactions:
    # def get_queryset(self):
    #     user = self.request.user
    #     qs = super().get_queryset()
    #     if user.is_staff:
    #         return qs
    #     return qs.filter(Q(initiated_by=user) | Q(from_stock_barman__bartender=user) | Q(to_stock_barman__bartender=user)).distinct()

from rest_framework import viewsets
from .models import ProductUnit
from .serializers import ProductUnitSerializer

class ProductUnitViewSet(viewsets.ModelViewSet):
    queryset = ProductUnit.objects.all()
    serializer_class = ProductUnitSerializer
# --- Main Store Stock ViewSet (Admin Only) ---
class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.select_related('product__base_unit', 'branch').all()
    serializer_class = StockSerializer
    permission_classes = [IsAdminUser] # Only admins manage main store stock

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Creates a new main store stock entry or adds to an existing one (as a restock).
        Expects 'product_id', 'branch_id', 'quantity' (in base units), and optionally 'minimum_threshold_base_units'.
        """
        data = request.data
        product_id = data.get('product_id')
        branch_id = data.get('branch_id')
        initial_quantity_str = data.get('quantity') # Expected in base_unit
        minimum_threshold_str = data.get('minimum_threshold_base_units') # Optional

        if not all([product_id, branch_id, initial_quantity_str is not None]):
            return Response({'error': 'product_id, branch_id, and quantity are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(pk=product_id)
            branch = Branch.objects.get(pk=branch_id)
        except Product.DoesNotExist:
            return Response({'error': 'Invalid product_id.'}, status=status.HTTP_400_BAD_REQUEST)
        except Branch.DoesNotExist:
            return Response({'error': 'Invalid branch_id.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            initial_quantity = Decimal(initial_quantity_str)
            if initial_quantity < 0:
                 return Response({'error': 'Quantity cannot be negative.'}, status=status.HTTP_400_BAD_REQUEST)

            minimum_threshold = Decimal(minimum_threshold_str) if minimum_threshold_str is not None else Decimal('0.00')
            if minimum_threshold < 0:
                return Response({'error': 'Minimum threshold cannot be negative.'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception:
            return Response({'error': 'Quantities and thresholds must be valid numbers.'}, status=status.HTTP_400_BAD_REQUEST)

        existing_stock = Stock.objects.select_for_update().filter(
            product=product,
            branch=branch
        ).first()

        created = False
        if existing_stock:
            # If stock exists, treat it as a restock
            stock = existing_stock
            try:
                stock.adjust_quantity(initial_quantity, product.base_unit, is_addition=True)
                if minimum_threshold_str is not None: # Only update if provided
                     stock.minimum_threshold_base_units = minimum_threshold
                     stock.save(update_fields=['minimum_threshold_base_units', 'last_stock_update']) # Ensure last_stock_update is also updated
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Create new stock entry
            try:
                stock = Stock.objects.create(
                    product=product,
                    branch=branch,
                    quantity_in_base_units=initial_quantity,
                    minimum_threshold_base_units=minimum_threshold,
                    running_out=False # Status will be updated on save
                )
                created = True
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': f"Error creating new stock: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Create a single restock transaction for the amount
        if initial_quantity > 0:
            InventoryTransaction.objects.create(
                product=product,
                transaction_type='restock',
                quantity=initial_quantity,
                transaction_unit=product.base_unit, # Transaction recorded in base unit
                to_stock_main=stock,
                initiated_by=request.user
            )

        serializer = self.get_serializer(stock)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    # You can override the 'update' and 'partial_update' methods here
    # to also use adjust_quantity if you intend to directly modify stock levels
    # via PUT/PATCH, ensuring a corresponding transaction is logged.
    # For simplicity, this example assumes stock changes primarily through actions like 'restock' or 'sale'.

# --- Barman Stock ViewSet ---
class BarmanStockViewSet(viewsets.ModelViewSet):
    # Corrected queryset to reflect direct product/branch links
    queryset = BarmanStock.objects.select_related('product__base_unit', 'branch', 'bartender').all()
    serializer_class = BarmanStockSerializer
    permission_classes = [IsAuthenticated] # Barmen view/manage their own stock

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        # If the user is staff/admin, they see all barman stocks.
        # Otherwise, they only see their own.
        return qs if user.is_staff else qs.filter(bartender=user)

    def perform_create(self, serializer):
        if not self.request.user.is_authenticated:
            raise ValidationError("Authenticated user is required to create barman stock.")

        # Ensure product and branch are explicitly handled from request data
        product_id = self.request.data.get('product')
        branch_id = self.request.data.get('branch') # Assume branch is provided for barman stock creation

        if not all([product_id, branch_id]):
            return Response({'error': 'Product ID and Branch ID are required for Barman Stock creation.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            product = Product.objects.get(pk=product_id)
            branch = Branch.objects.get(pk=branch_id)
        except (Product.DoesNotExist, Branch.DoesNotExist):
            return Response({'error': 'Invalid Product ID or Branch ID provided.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Check for existing BarmanStock for this product, bartender, and branch to avoid duplicates
        existing_stock = BarmanStock.objects.filter(
            product=product,
            bartender=self.request.user,
            branch=branch
        ).first()

        if existing_stock:
            # If stock already exists, return an error or allow an update (restock)
            return Response({'error': 'Barman Stock for this product, bartender, and branch already exists. Use PUT/PATCH to update or request stock.'},
                            status=status.HTTP_409_CONFLICT) # 409 Conflict

        serializer.save(
            bartender=self.request.user,
            branch=branch # Ensure branch is saved
        )

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def record_sale(self, request, pk=None):
        """
        Allows a barman to record a sale from their stock.
        Requires 'quantity', 'unit_name', and optionally 'price'.
        """
        barman_stock = self.get_object() # This is the specific BarmanStock instance
        # Ensure the current user is the bartender associated with this stock
        if barman_stock.bartender != request.user and not request.user.is_staff:
             return Response({'error': 'You do not have permission to record sales for this stock.'}, status=status.HTTP_403_FORBIDDEN)

        quantity_str = request.data.get('quantity')
        unit_name = request.data.get('unit_name') # Unit in which the sale was made (e.g., 'shot', 'glass')
        price_at_transaction = request.data.get('price', None)

        if not all([quantity_str, unit_name]):
            return Response({'error': 'Quantity and unit_name are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = Decimal(quantity_str)
            if quantity <= 0:
                return Response({'error': 'Quantity must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)
            if price_at_transaction is not None:
                price_at_transaction = Decimal(price_at_transaction)
        except ValueError:
            return Response({'error': 'Quantity and/or Price must be valid numbers.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transaction_unit = ProductUnit.objects.get(unit_name=unit_name)
        except ProductUnit.DoesNotExist:
            return Response({'error': f'Unit "{unit_name}" is not a valid product unit.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Deduct from barman's stock using the model method
            barman_stock.adjust_quantity(quantity, transaction_unit, is_addition=False)

            # Create an InventoryTransaction record for the sale
            InventoryTransaction.objects.create(
                product=barman_stock.product,
                transaction_type='sale',
                quantity=quantity,
                transaction_unit=transaction_unit,
                from_stock_barman=barman_stock,
                initiated_by=request.user, # The barman recording the sale
                price_at_transaction=price_at_transaction
            )
            return Response({'message': 'Sale recorded successfully.'}, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({'error': f"Conversion error: {e}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def record_wastage(self, request, pk=None):
        """
        Allows a barman to record wastage from their stock.
        Requires 'quantity', 'unit_name', and optionally 'notes'.
        """
        barman_stock = self.get_object()
        # Ensure the current user is the bartender associated with this stock
        if barman_stock.bartender != request.user and not request.user.is_staff:
             return Response({'error': 'You do not have permission to record wastage for this stock.'}, status=status.HTTP_403_FORBIDDEN)

        quantity_str = request.data.get('quantity')
        unit_name = request.data.get('unit_name') # Unit in which wastage occurred
        notes = request.data.get('notes', None)

        if not all([quantity_str, unit_name]):
            return Response({'error': 'Quantity and unit_name are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = Decimal(quantity_str)
            if quantity <= 0:
                return Response({'error': 'Quantity must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Quantity must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transaction_unit = ProductUnit.objects.get(unit_name=unit_name)
        except ProductUnit.DoesNotExist:
            return Response({'error': f'Unit "{unit_name}" is not a valid product unit.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Deduct from barman's stock
            barman_stock.adjust_quantity(quantity, transaction_unit, is_addition=False)

            # Create an InventoryTransaction record for wastage
            InventoryTransaction.objects.create(
                product=barman_stock.product,
                transaction_type='wastage',
                quantity=quantity,
                transaction_unit=transaction_unit,
                from_stock_barman=barman_stock,
                initiated_by=request.user,
                notes=notes
            )
            return Response({'message': 'Wastage recorded successfully.'}, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({'error': f"Conversion error: {e}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def return_to_store(self, request, pk=None):
        """
        Allows a barman to return stock to the main store.
        Requires 'quantity' and 'unit_name'.
        """
        barman_stock = self.get_object()
        # Ensure the current user is the bartender associated with this stock
        if barman_stock.bartender != request.user and not request.user.is_staff:
             return Response({'error': 'You do not have permission to return stock from this barman.'}, status=status.HTTP_403_FORBIDDEN)

        quantity_str = request.data.get('quantity')
        unit_name = request.data.get('unit_name')

        if not all([quantity_str, unit_name]):
            return Response({'error': 'Quantity and unit_name are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = Decimal(quantity_str)
            if quantity <= 0:
                return Response({'error': 'Quantity must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Quantity must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transaction_unit = ProductUnit.objects.get(unit_name=unit_name)
        except ProductUnit.DoesNotExist:
            return Response({'error': f'Unit "{unit_name}" is not a valid product unit.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get main store stock for the receiving branch
            main_store_stock, created = Stock.objects.select_for_update().get_or_create(
                product=barman_stock.product,
                branch=barman_stock.branch,
                defaults={'minimum_threshold_base_units': Decimal('0.00')}
            )

            # Deduct from barman's stock
            barman_stock.adjust_quantity(quantity, transaction_unit, is_addition=False)
            # Add to main store stock
            main_store_stock.adjust_quantity(quantity, transaction_unit, is_addition=True)

            # Create an InventoryTransaction record for the transfer
            InventoryTransaction.objects.create(
                product=barman_stock.product,
                transaction_type='barman_to_store',
                quantity=quantity,
                transaction_unit=transaction_unit,
                from_stock_barman=barman_stock,
                to_stock_main=main_store_stock,
                initiated_by=request.user,
                notes=request.data.get('notes', None)
            )
            return Response({'message': 'Stock successfully returned to store.'}, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({'error': f"Conversion error: {e}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)