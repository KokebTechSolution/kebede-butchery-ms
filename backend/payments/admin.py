from django.contrib import admin
from .models import Payment, Income

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'order', 'branch', 'amount', 'payment_method', 'processed_by', 'processed_at', 'is_completed', 'order_items'
    )
    list_filter = ('payment_method', 'processed_by', 'is_completed')

    def branch(self, obj):
        return obj.order.branch if obj.order and obj.order.branch else "-"
    branch.short_description = "Branch"

    def order_items(self, obj):
        if hasattr(obj.order, 'items'):
            return ", ".join([f"{item.quantity}x {item.name}" for item in obj.order.items.all()])
        return "-"
    order_items.short_description = "Order Items"

@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = ('id', 'date', 'amount', 'cashier', 'branch', 'payment', 'order_items')
    list_filter = ('branch', 'date', 'cashier')

    def order_items(self, obj):
        if hasattr(obj.payment, 'order') and hasattr(obj.payment.order, 'items'):
            return ", ".join([f"{item.quantity}x {item.name}" for item in obj.payment.order.items.all()])
        return "-"
    order_items.short_description = "Order Items"
