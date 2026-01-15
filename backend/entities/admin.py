from django.contrib import admin
from .models import Distributor


@admin.register(Distributor)
class DistributorAdmin(admin.ModelAdmin):
    """Admin configuration for the Distributor model."""
    
    list_display = ['name', 'is_verified_regulator', 'id']
    list_filter = ['is_verified_regulator']
    search_fields = ['name']
    ordering = ['name']
    readonly_fields = ['id']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name')
        }),
        ('Verification', {
            'fields': ('public_key', 'is_verified_regulator')
        }),
    )
