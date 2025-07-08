from django.contrib import admin
from .models import AuditLog  



@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        'product', 'action_type', 'quantity', 'unit_type',
        'action_by', 'branch', 'timestamp'
    )
    search_fields = ('product__name', 'action_by__username')
    list_filter = ('action_type', 'timestamp', 'branch')
