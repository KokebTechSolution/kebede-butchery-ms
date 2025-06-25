from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'food_status', 'drink_status', 'created_by', 'branch', 'created_at']
    list_filter = ['food_status', 'drink_status', 'branch', 'created_at']
    search_fields = ['order_number']
    inlines = [OrderItemInline]

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'quantity', 'price', 'item_type', 'order']
    list_filter = ['item_type']
    search_fields = ['name']
