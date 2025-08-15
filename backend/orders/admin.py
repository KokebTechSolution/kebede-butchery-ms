from django.contrib import admin
from .models import Order, OrderItem, OrderUpdate

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number',
        'get_table_number',
        'food_status',
        'beverage_status',
        'created_by',
        'branch',
        'created_at',
        'total_money'
    ]
    list_filter = ['food_status', 'beverage_status', 'branch', 'created_at']
    search_fields = ['order_number']
    inlines = [OrderItemInline]

    def get_table_number(self, obj):
        return obj.table.number if obj.table else '-'
    get_table_number.short_description = 'Table Number'
    get_table_number.admin_order_field = 'table__table_number'


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'quantity',
        'price',
        'item_type',
        'order',
        'status',
        'get_table_number',
        'get_waiter_name'
    )
    list_filter = ('item_type', 'status')
    search_fields = ['name']

    def get_table_number(self, obj):
        return obj.order.table.table_number if obj.order and obj.order.table else '-'
    get_table_number.short_description = 'Table Number'

    def get_waiter_name(self, obj):
        return obj.order.created_by.username if obj.order and obj.order.created_by else 'N/A'
    get_waiter_name.short_description = 'Waiter'


@admin.register(OrderUpdate)
class OrderUpdateAdmin(admin.ModelAdmin):
    list_display = ['id', 'original_order', 'update_type', 'status', 'created_by', 'created_at', 'total_addition_cost']
    list_filter = ['status', 'update_type', 'created_at']
    search_fields = ['original_order__id', 'created_by__username', 'notes']
    readonly_fields = ['created_at', 'processed_at']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('original_order', 'update_type', 'status')
        }),
        ('Changes', {
            'fields': ('items_changes', 'total_addition_cost')
        }),
        ('Metadata', {
            'fields': ('created_by', 'processed_by', 'created_at', 'processed_at')
        }),
        ('Notes', {
            'fields': ('notes', 'rejection_reason')
        }),
    )
    
    def has_add_permission(self, request):
        return False  # Order updates should only be created through the API
    
    def has_delete_permission(self, request, obj=None):
        return False  # Don't allow deletion of order updates for audit purposes
