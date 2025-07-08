from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'table_number', 'food_status', 'drink_status', 'created_by', 'branch', 'created_at', 'total_money']
    list_filter = ['food_status', 'drink_status', 'branch', 'created_at']
    search_fields = ['order_number']
    inlines = [OrderItemInline]

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'quantity', 'price', 'item_type', 'order', 'status', 'order__table_number', 'order__created_by')
    list_filter = ('item_type', 'status')
    search_fields = ['name']

    def get_waiter_name(self, obj):
        if obj.order and obj.order.created_by:
            return obj.order.created_by.username
        return 'N/A'
    get_waiter_name.short_description = 'Waiter'
    get_waiter_name.admin_order_field = 'order__created_by'
