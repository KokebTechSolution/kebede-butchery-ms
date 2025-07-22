# inventory/admin.py

from django.contrib import admin
from .models import AuditLog # Import AuditLog (and any other models you register)
# from .models import ItemType, Category, Product, ProductUnit, ProductMeasurement, Stock, BarmanStock, InventoryTransaction, InventoryRequest


# ... (Your other admin registrations for other models) ...

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        'timestamp',
        'user',
        'action',
        'logged_object_display',
        'action_details_summary',
        'notes',
    )
    list_filter = (
        'timestamp',
        'action',
        'user',
        'content_type'
    )
    search_fields = (
        'user__username',
        'action',
        'notes',
        'details',
        # Add searching for logged_object_display if needed (might require custom search logic)
    )
    readonly_fields = (
        'timestamp',
        'user',
        'action',
        'content_type',
        'object_id',
        'content_object',
        'details',
        'logged_object_display',
        'action_details_summary',
    )