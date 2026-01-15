from django.contrib import admin
from .models import Medicine


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    """Admin configuration for the Medicine model."""
    
    list_display = ['name', 'category', 'distributor', 'id']
    list_filter = ['category', 'distributor']
    search_fields = ['name', 'category']
    ordering = ['name']
    readonly_fields = ['id']
    autocomplete_fields = ['distributor']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'category')
        }),
        ('Distributor', {
            'fields': ('distributor',)
        }),
    )
