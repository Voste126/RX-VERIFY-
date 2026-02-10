from django.contrib import admin
from .models import SupplyOrder


@admin.register(SupplyOrder)
class SupplyOrderAdmin(admin.ModelAdmin):
    """Admin interface for SupplyOrder model."""
    
    list_display = [
        'id',
        'pharmacist',
        'distributor',
        'status',
        'manifest',
        'created_at',
    ]
    
    list_filter = ['status', 'created_at']
    
    search_fields = [
        'id',
        'pharmacist__username',
        'distributor__name',
        'delivery_token',
    ]
    
    readonly_fields = ['id', 'delivery_token', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('id', 'pharmacist', 'distributor', 'status')
        }),
        ('Items', {
            'fields': ('items',)
        }),
        ('Fulfillment', {
            'fields': ('manifest', 'delivery_token')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def has_delete_permission(self, request, obj=None):
        """Only admins can delete orders."""
        return request.user.is_superuser or request.user.role == 'Admin'
