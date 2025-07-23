from decimal import Decimal
from django.contrib.auth import get_user_model 
from django.db import transaction, models
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError # Avoid conflict with DRF ValidationError
User = get_user_model()
from .models import (
    ItemType, Category, Product, InventoryTransaction,
    InventoryRequest, Stock, Branch, BarmanStock, AuditLog # Added BarmanStock, AuditLog
)
from .serializers import (
    ItemTypeSerializer, CategorySerializer, ProductSerializer,
    InventoryTransactionSerializer, InventoryRequestSerializer,
    StockSerializer, BranchSerializer, BarmanStockSerializer # Added BarmanStockSerializer
)


from rest_framework import serializers
from .models import ItemType, Category, Product, Stock, InventoryTransaction, InventoryRequest, BarmanStock, AuditLog
from branches.models import Branch
from django.db import transaction as db_transaction
from decimal import Decimal
# <-- Add this line
from django.utils import timezone # Add this if you don't have it for datetime operations

 # <-- And this line, to get the active User model



from decimal import Decimal
from django.db import transaction, models
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import get_user_model # <-- Add this line
from django.utils import timezone # Add this if you don't have it for datetime operations

# --- Basic Read-Only/CRUD ViewSets ---

class BranchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [AllowAny] # Adjust permissions as needed

class ItemTypeViewSet(viewsets.ModelViewSet):
    queryset = ItemType.objects.all()
    serializer_class = ItemTypeSerializer
    permission_classes = [AllowAny] # Adjust permissions as needed

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny] # Adjust permissions as needed

# --- Product ViewSet (Refined Transaction Handling) ---

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny] # Adjust permissions as needed

    # The restock, sale, wastage actions will now use the InventoryTransactionSerializer
    # directly for creation, which handles the stock updates.
    # No custom handle_transaction method needed here anymore.

    # Example endpoint for restock (handled by InventoryTransaction creation)
    # POST /products/{id}/restock/
    # {
    #   "branch_id": 1,
    #   "original_quantity_entered": 10,
    #   "original_unit_type_entered": "carton", // or "bottle", "piece", "liter", etc.
    #   "purchase_price_per_stocking_unit": 150.00
    # }
    @action(detail=True, methods=['post'])
    def restock(self, request, pk=None):
        product = self.get_object()
        serializer = InventoryTransactionSerializer(
            data={
                **request.data,
                'product': product.id, # Pass product ID
                'transaction_type': 'restock'
            },
            context={'request': request} # Pass request context for action_by
        )
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({'message': 'Restock transaction recorded successfully.'}, status=status.HTTP_201_CREATED)
        except DjangoValidationError as e:
            return Response({'error': e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    # Example endpoint for sale (handled by InventoryTransaction creation)
    # POST /products/{id}/sale/
    # {
    #   "branch_id": 1,
    #   "quantity_in_sellable_units": 5 // This is the "single piece" quantity
    # }
    @action(detail=True, methods=['post'])
    def sale(self, request, pk=None):
        product = self.get_object()
        serializer = InventoryTransactionSerializer(
            data={
                **request.data,
                'product': product.id,
                'transaction_type': 'sale'
            },
            context={'request': request}
        )
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({'message': 'Sale transaction recorded successfully.'}, status=status.HTTP_201_CREATED)
        except DjangoValidationError as e:
            return Response({'error': e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Example endpoint for wastage (handled by InventoryTransaction creation)
    # POST /products/{id}/wastage/
    # {
    #   "branch_id": 1,
    #   "quantity_in_sellable_units": 2
    # }
    @action(detail=True, methods=['post'])
    def wastage(self, request, pk=None):
        product = self.get_object()
        serializer = InventoryTransactionSerializer(
            data={
                **request.data,
                'product': product.id,
                'transaction_type': 'wastage'
            },
            context={'request': request}
        )
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({'message': 'Wastage transaction recorded successfully.'}, status=status.HTTP_201_CREATED)
        except DjangoValidationError as e:
            return Response({'error': e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        product = self.get_object()
        transactions = InventoryTransaction.objects.filter(product=product).order_by('-transaction_date')
        serializer = InventoryTransactionSerializer(transactions, many=True)
        return Response({
            'product': ProductSerializer(product).data,
            'transactions': serializer.data
        })

    @action(detail=False, methods=['get'])
    def available(self, request):
        # Now total_sellable_units holds the single source of truth for quantity
        product_ids = Stock.objects.filter(total_sellable_units__gt=0).values_list('product_id', flat=True).distinct()
        products = Product.objects.filter(id__in=product_ids)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)


# --- Inventory Transaction ViewSet (Standard CRUD) ---

class InventoryTransactionViewSet(viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.all().select_related('product', 'branch', 'action_by')
    serializer_class = InventoryTransactionSerializer
    permission_classes = [AllowAny] # Adjust permissions as needed

    def perform_create(self, serializer):
        # The create method in the serializer handles all the stock logic,
        # so just call super().perform_create
        serializer.save()

# --- Stock ViewSet (Simplified creation) ---

class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.select_related('product', 'branch').all()
    serializer_class = StockSerializer
    permission_classes = [AllowAny] # Adjust permissions as needed

    # We want to create/update Stock using total_sellable_units directly,
    # or by converting from grandpa units for initial setup.
    # The `Stock.add_stock` method is perfect for this.
    # This `create` method focuses on initial stock setup or adding more stock via an external process
    # (not necessarily a 'restock transaction').
    def create(self, request, *args, **kwargs):
        # Expected data: product_id, branch_id, quantity, unit_type, minimum_threshold (optional)
        product_id = request.data.get('product') # Use 'product' field name from serializer
        branch_id = request.data.get('branch') # Use 'branch' field name from serializer
        quantity = request.data.get('quantity')
        unit_type = request.data.get('unit_type') # e.g., 'carton', 'bottle', 'piece', 'liter'
        minimum_threshold = request.data.get('minimum_threshold')

        if not all([product_id, branch_id, quantity, unit_type]):
            return Response({'error': 'Product, Branch, Quantity, and Unit Type are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = get_object_or_404(Product, pk=product_id)
            branch = get_object_or_404(Branch, pk=branch_id)
            quantity = Decimal(quantity)
            if minimum_threshold is not None:
                minimum_threshold = Decimal(minimum_threshold)
        except (Product.DoesNotExist, Branch.DoesNotExist, ValueError, DjangoValidationError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            try:
                # Use the add_stock class method to handle the conversion and update
                stock = Stock.add_stock(product=product, branch=branch, quantity=quantity, unit_type=unit_type)

                if minimum_threshold is not None:
                    stock.minimum_threshold = minimum_threshold
                    stock.save(update_fields=['minimum_threshold']) # Save just the threshold

                serializer = self.get_serializer(stock)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except DjangoValidationError as e:
                return Response({'error': e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        # For updates, we primarily expect changes to minimum_threshold
        # or if you want to allow direct changes to total_sellable_units (less recommended)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save() # This will call the model's save and trigger check_running_out
            return Response(serializer.data)
        except DjangoValidationError as e:
            return Response({'error': e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# --- Inventory Request ViewSet (Refined Logic) ---

class InventoryRequestViewSet(viewsets.ModelViewSet):
    queryset = InventoryRequest.objects.all().select_related('product', 'requesting_branch', 'fulfilling_branch', 'requested_by', 'processed_by')
    serializer_class = InventoryRequestSerializer
    permission_classes = [IsAuthenticated] # Changed to IsAuthenticated, as requests are internal

    def perform_create(self, serializer):
        # The serializer's create method handles setting quantity_in_sellable_units
        # and logging.
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def accept_and_fulfill(self, request, pk=None):
        """
        Accepts an inventory request and immediately attempts to fulfill it
        by transferring stock from the fulfilling branch to the requesting branch.
        """
        req = self.get_object()

        if req.status == 'fulfilled':
            return Response({'error': 'Request has already been fulfilled.'}, status=status.HTTP_400_BAD_REQUEST)
        if req.status == 'rejected':
            return Response({'error': 'Request was rejected and cannot be accepted.'}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure the fulfilling branch is provided if it's not already set
        fulfilling_branch_id = request.data.get('fulfilling_branch_id')
        if not req.fulfilling_branch and not fulfilling_branch_id:
            return Response({'error': 'Fulfilling branch ID is required to accept and fulfill the request.'}, status=status.HTTP_400_BAD_REQUEST)

        if not req.fulfilling_branch: # Only set if it wasn't already set on the request
            try:
                req.fulfilling_branch = get_object_or_404(Branch, pk=fulfilling_branch_id)
            except DjangoValidationError as e:
                 return Response({'error': f"Invalid fulfilling branch ID: {e}"}, status=status.HTTP_400_BAD_REQUEST)


        try:
            # Update the request status to 'accepted' before attempting transfer
            # The serializer update method will handle the AuditLog for status change
            serializer = self.get_serializer(
                req,
                data={'status': 'accepted'},
                partial=True,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            req = serializer.save() # This will set accepted status, processed_by, processed_at and log it.

            # Now, attempt the stock transfer using the model methods
            source_stock = get_object_or_404(Stock, product=req.product, branch=req.fulfilling_branch)
            target_stock, _ = Stock.objects.get_or_create(product=req.product, branch=req.requesting_branch)

            # Deduct from source stock
            source_stock.total_sellable_units -= req.quantity_in_sellable_units
            source_stock.save() # This will trigger check_running_out and internal clean()

            # Add to target stock
            target_stock.total_sellable_units += req.quantity_in_sellable_units
            target_stock.save() # This will trigger check_running_out and internal clean()

            # Create InventoryTransaction for transfer_out from fulfilling branch
            InventoryTransaction.objects.create(
                product=req.product,
                transaction_type='transfer_out',
                quantity_in_sellable_units=req.quantity_in_sellable_units,
                branch=req.fulfilling_branch,
                action_by=request.user,
                note=f"Fulfilled request {req.id} to {req.requesting_branch.name}"
            )

            # Create InventoryTransaction for transfer_in to requesting branch
            InventoryTransaction.objects.create(
                product=req.product,
                transaction_type='transfer_in',
                quantity_in_sellable_units=req.quantity_in_sellable_units,
                branch=req.requesting_branch,
                action_by=request.user,
                note=f"Received request {req.id} from {req.fulfilling_branch.name}"
            )

            # Mark request as fulfilled
            req.status = 'fulfilled'
            req.reached_status = True # Keeping this for now, but could be redundant
            req.save(update_fields=['status', 'reached_status'])

            AuditLog.objects.create(
                product=req.product,
                action_type='inventory_request_status_change',
                action_by=request.user,
                branch=req.requesting_branch, # Log from requesting branch perspective too
                inventory_request=req,
                previous_value='accepted',
                new_value='fulfilled',
                note=f"Request {req.id} fully fulfilled. Stock transferred."
            )

            return Response({'message': 'Request accepted and stock transferred successfully.', 'request': self.get_serializer(req).data}, status=status.HTTP_200_OK)

        except DjangoValidationError as e:
            # If validation error occurs, it means there's an issue with the data for the request or stock
            return Response({'error': e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Stock.DoesNotExist:
            return Response({'error': 'Source stock for product not found at fulfilling branch.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # Catch any other unexpected errors during the transaction
            transaction.set_rollback(True) # Ensure rollback on generic exception
            AuditLog.objects.create( # Log the failure
                product=req.product,
                action_type='inventory_request_status_change',
                action_by=request.user,
                branch=req.requesting_branch,
                inventory_request=req,
                previous_value=req.status, # Could be 'pending' or 'accepted'
                new_value=f"Error during fulfillment",
                note=f"Error fulfilling request {req.id}: {str(e)}"
            )
            return Response({'error': f'An unexpected error occurred during fulfillment: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        req = self.get_object()
        if req.status != 'pending':
            return Response({'error': 'Request already processed.'}, status=status.HTTP_400_BAD_REQUEST)

        # Use serializer to update status, which will handle AuditLog
        serializer = self.get_serializer(
            req,
            data={'status': 'rejected'},
            partial=True,
            context={'request': request}
        )
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({'message': 'Request rejected successfully.'}, status=status.HTTP_200_OK)
        except DjangoValidationError as e:
            return Response({'error': e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # `reach` and `not_reach` actions might be better named `allocate_to_barman` and `deallocate_from_barman`
    # or combined into a single `transfer_to_barman` with a quantity.
    # Let's refactor `reach` to use BarmanStock.transfer_to_barman.
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def allocate_to_barman(self, request, pk=None):
        """
        Transfers stock from the branch's main stock to a specific barman's stock.
        This action should be initiated *after* an InventoryRequest is fulfilled (or independently).
        """
        # The request in this context is NOT an InventoryRequest,
        # but a request to allocate stock *to a barman*.
        # It's better to have a separate endpoint for this, not nested under InventoryRequest.
        # However, if you intend for this to be a *follow-up* to a fulfilled InventoryRequest,
        # then the logic below can be adapted.

        # Assuming this action is initiated from a fulfilled InventoryRequest,
        # and the `request.data` contains the `bartender_id` and the `quantity` to transfer.
        # If this is a standalone action, it should be in `StockViewSet` or a dedicated `BarmanStockManagementViewSet`.

        # Let's assume this action is for *transferring* a fulfilled request quantity to a barman
        # from the *requesting branch's* main stock.
        req = self.get_object() # This is the InventoryRequest instance

        if req.status != 'fulfilled':
            return Response({'error': 'Only fulfilled requests can be allocated to a barman via this endpoint.'}, status=status.HTTP_400_BAD_REQUEST)

        bartender_id = request.data.get('bartender_id')
        quantity_to_allocate = request.data.get('quantity') # This quantity could be less than total requested

        if not all([bartender_id, quantity_to_allocate]):
            return Response({'error': 'Bartender ID and quantity to allocate are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            bartender = get_object_or_404(User, pk=bartender_id)
            quantity_to_allocate = Decimal(quantity_to_allocate)
            if quantity_to_allocate <= 0:
                raise DjangoValidationError("Quantity to allocate must be positive.")
        except (ValueError, DjangoValidationError, User.DoesNotExist) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


        # Get the main branch stock for this product at the requesting branch
        main_stock = get_object_or_404(Stock, product=req.product, branch=req.requesting_branch)

        try:
            # Use the BarmanStock.transfer_to_barman class method
            BarmanStock.transfer_to_barman(
                branch_stock=main_stock,
                bartender=bartender,
                quantity=quantity_to_allocate
            )

            # Log this transfer to AuditLog
            AuditLog.objects.create(
                product=req.product,
                action_type='barman_stock_add',
                quantity_affected_sellable_units=quantity_to_allocate,
                action_by=request.user, # The person making the allocation
                branch=req.requesting_branch,
                note=f"Allocated {quantity_to_allocate} {req.product.sellable_unit_type.lower()} to {bartender.username} from fulfilled request {req.id}."
            )

            # You might want to track how much of a request has been allocated to barmen
            # For simplicity, let's just return success for now.
            return Response({'message': f'Stock allocated to {bartender.username} successfully.'}, status=status.HTTP_200_OK)

        except DjangoValidationError as e:
            return Response({'error': e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # `not_reach` is removed as it conceptually doesn't fit the new flow of `fulfilled` then `allocate_to_barman`.
    # If a request needs to be reversed from fulfilled, that's a more complex "return to stock" operation.


# --- Barman Stock ViewSet (Dedicated for Barman-specific operations) ---

class BarmanStockViewSet(viewsets.ModelViewSet):
    queryset = BarmanStock.objects.select_related('stock__product', 'stock__branch', 'bartender')
    serializer_class = BarmanStockSerializer
    permission_classes = [IsAuthenticated] # Only authenticated users can manage barman stock

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        # Non-staff users can only see their own barman stock
        return qs if user.is_staff else qs.filter(bartender=user)

    def perform_create(self, serializer):
        # A barman stock instance should typically be created when stock is transferred to a barman,
        # not directly via this create endpoint (unless it's an initial setup for a new barman).
        # It should usually happen via BarmanStock.transfer_to_barman.
        # If you still want to allow direct creation, consider the initial quantity.
        # For simplicity, if a direct creation happens, it should ideally be zero,
        # and then stock is added via `transfer_stock_to_barman` action below.
        serializer.save(bartender=self.request.user)

    def perform_update(self, serializer):
        # Allow updating minimum_threshold, but direct quantity changes should use dedicated actions.
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def deduct_sale(self, request, pk=None):
        """
        Deducts stock from a specific barman's inventory (e.g., after a sale).
        Expected data: {'quantity': <decimal_value>}
        """
        barman_stock = self.get_object()
        quantity_to_deduct = request.data.get('quantity')

        if not quantity_to_deduct:
            return Response({'error': 'Quantity to deduct is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity_to_deduct = Decimal(quantity_to_deduct)
            if quantity_to_deduct <= 0:
                raise DjangoValidationError("Quantity to deduct must be positive.")
        except (ValueError, DjangoValidationError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure the current user is authorized to deduct from this barman stock
        if not request.user.is_staff and barman_stock.bartender != request.user:
            return Response({'error': 'You are not authorized to deduct stock from this barman.'}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            try:
                # Use the BarmanStock.deduct_from_barman class method
                BarmanStock.deduct_from_barman(barman_stock_instance=barman_stock, quantity=quantity_to_deduct)

                # Create an InventoryTransaction for the sale from this barman's perspective
                InventoryTransaction.objects.create(
                    product=barman_stock.stock.product,
                    transaction_type='sale',
                    quantity_in_sellable_units=quantity_to_deduct,
                    branch=barman_stock.stock.branch,
                    action_by=request.user, # The bartender selling
                    note=f"Sale of {quantity_to_deduct} {barman_stock.stock.product.sellable_unit_type.lower()} by {request.user.username}"
                )

                AuditLog.objects.create(
                    product=barman_stock.stock.product,
                    action_type='barman_stock_deduct',
                    quantity_affected_sellable_units=quantity_to_deduct,
                    action_by=request.user,
                    branch=barman_stock.stock.branch,
                    note=f"Deducted {quantity_to_deduct} {barman_stock.stock.product.sellable_unit_type.lower()} from {barman_stock.bartender.username}'s stock for sale."
                )

                return Response({'message': 'Stock deducted from barman successfully.'}, status=status.HTTP_200_OK)

            except DjangoValidationError as e:
                return Response({'error': e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                transaction.set_rollback(True)
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def deduct_wastage(self, request, pk=None):
        """
        Deducts stock from a specific barman's inventory due to wastage.
        Expected data: {'quantity': <decimal_value>, 'note': 'reason for wastage'}
        """
        barman_stock = self.get_object()
        quantity_to_deduct = request.data.get('quantity')
        note = request.data.get('note', '')

        if not quantity_to_deduct:
            return Response({'error': 'Quantity to deduct is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity_to_deduct = Decimal(quantity_to_deduct)
            if quantity_to_deduct <= 0:
                raise DjangoValidationError("Quantity to deduct must be positive.")
        except (ValueError, DjangoValidationError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure the current user is authorized
        if not request.user.is_staff and barman_stock.bartender != request.user:
            return Response({'error': 'You are not authorized to deduct stock from this barman.'}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            try:
                BarmanStock.deduct_from_barman(barman_stock_instance=barman_stock, quantity=quantity_to_deduct)

                InventoryTransaction.objects.create(
                    product=barman_stock.stock.product,
                    transaction_type='wastage',
                    quantity_in_sellable_units=quantity_to_deduct,
                    branch=barman_stock.stock.branch,
                    action_by=request.user,
                    note=f"Wastage: {note}"
                )

                AuditLog.objects.create(
                    product=barman_stock.stock.product,
                    action_type='barman_stock_deduct',
                    quantity_affected_sellable_units=quantity_to_deduct,
                    action_by=request.user,
                    branch=barman_stock.stock.branch,
                    note=f"Deducted {quantity_to_deduct} {barman_stock.stock.product.sellable_unit_type.lower()} from {barman_stock.bartender.username}'s stock for wastage: {note}."
                )

                return Response({'message': 'Stock marked as wastage successfully.'}, status=status.HTTP_200_OK)

            except DjangoValidationError as e:
                return Response({'error': e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                transaction.set_rollback(True)
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)