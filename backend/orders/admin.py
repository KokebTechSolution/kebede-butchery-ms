from django.contrib import admin
from .models import Order, OrderItem

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
