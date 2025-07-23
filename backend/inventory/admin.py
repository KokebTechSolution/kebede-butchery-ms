from django.contrib import admin
from .models import ItemType, Category, Product, Stock, InventoryTransaction, InventoryRequest, AuditLog, BarmanStock

class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'action_type', 'quantity', 'action_by', 'branch', 'timestamp', 'note')

admin.site.register(ItemType)
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Stock)
admin.site.register(InventoryTransaction)
admin.site.register(InventoryRequest)
admin.site.register(AuditLog, AuditLogAdmin)
admin.site.register(BarmanStock)
