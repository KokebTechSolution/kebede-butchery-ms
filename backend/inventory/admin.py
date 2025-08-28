from django.contrib import admin
from .models import ItemType, Category, Product, Stock, InventoryTransaction, InventoryRequest, AuditLog, BarmanStock

class ItemTypeAdmin(admin.ModelAdmin):
    list_display = ('type_name', 'description', 'created_at', 'updated_at')
    list_filter = ('type_name',)
    search_fields = ('type_name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('type_name', 'description')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('category_name', 'item_type', 'is_active', 'sort_order', 'created_at')
    list_filter = ('item_type', 'is_active')
    search_fields = ('category_name', 'description')
    list_editable = ('is_active', 'sort_order')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('category_name', 'item_type', 'description', 'is_active', 'sort_order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'item_type', 'category', 'base_unit', 'base_unit_price', 'input_unit', 'conversion_amount', 'is_active')
    list_filter = ('is_active', 'category', 'item_type', 'base_unit', 'input_unit')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'category', 'item_type', 'is_active')
        }),
        ('Units & Conversion', {
            'fields': ('base_unit', 'input_unit', 'conversion_amount', 'base_unit_price')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

class StockAdmin(admin.ModelAdmin):
    list_display = ('product', 'branch', 'input_quantity', 'calculated_base_units', 'minimum_threshold_base_units')
    list_filter = ('branch', 'product__category')
    search_fields = ('product__name', 'branch__name')
    fieldsets = (
        ('Stock Information', {
            'fields': ('product', 'branch', 'input_quantity', 'calculated_base_units')
        }),
        ('Thresholds', {
            'fields': ('minimum_threshold_base_units',)
        }),
    )

class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'action', 'object_id', 'content_type', 'timestamp', 'notes')

admin.site.register(ItemType, ItemTypeAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Product, ProductAdmin)
admin.site.register(Stock, StockAdmin)
admin.site.register(InventoryTransaction)
admin.site.register(InventoryRequest)
admin.site.register(AuditLog, AuditLogAdmin)
admin.site.register(BarmanStock)
