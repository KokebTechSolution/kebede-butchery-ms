# inventory/admin.py (Corrected)
from django.contrib import admin
from .models import ItemType, Category, Product, InventoryTransaction, InventoryRequest, Stock, Branch, BarmanStock, AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'action_type',
        'quantity_affected_sellable_units', # <-- Changed from 'quantity'
        'product',
        'branch',
        'action_by',
        'timestamp',
        'note'
    )
    list_filter = ('action_type', 'product', 'branch', 'action_by')
    search_fields = ('note', 'product__name', 'action_by__username')
    readonly_fields = (
        'timestamp', 'action_by', 'product', 'branch', 'action_type',
        'quantity_affected_sellable_units', # <-- Changed from 'quantity'
        'note', 'inventory_request', 'inventory_transaction', # Add these if they are foreign keys on AuditLog
        'previous_value', 'new_value' # Add these if they are fields on AuditLog
    )

    # Optional: If you want to see the unit type, you'd need to add a method
    # def get_unit_type(self, obj):
    #     # This assumes product has a sellable_unit_type
    #     return obj.product.sellable_unit_type if obj.product else 'N/A'
    # get_unit_type.short_description = "Unit Type"
    # Then add 'get_unit_type' to list_display