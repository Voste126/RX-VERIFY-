from django.contrib import admin
from .models import ReceiptEvent


@admin.register(ReceiptEvent)
class ReceiptEventAdmin(admin.ModelAdmin):
    """Admin configuration for the ReceiptEvent model."""
    
    list_display = ['id', 'user', 'lot', 'created_at', 'get_location_summary']
    list_filter = ['created_at', 'user', 'lot__medicine']
    search_fields = ['user__username', 'lot__batch_number']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at']
    autocomplete_fields = ['user', 'lot']
    
    fieldsets = (
        ('Event Information', {
            'fields': ('id', 'created_at')
        }),
        ('Relationships', {
            'fields': ('user', 'lot')
        }),
        ('Location Data', {
            'fields': ('location_coord',)
        }),
    )
    
    def get_location_summary(self, obj):
        """Display a summary of location coordinates."""
        if obj.location_coord:
            return f"Lat: {obj.location_coord.get('lat', 'N/A')}, Lng: {obj.location_coord.get('lng', 'N/A')}"
        return "No location"
    
    get_location_summary.short_description = 'Location'
