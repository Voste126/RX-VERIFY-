from django.contrib import admin
from .models import CrowdFlag


@admin.register(CrowdFlag)
class CrowdFlagAdmin(admin.ModelAdmin):
    """Admin configuration for the CrowdFlag / Incident Report model."""
    
    list_display = [
        'issue_type', 'severity', 'reporter_type', 'user', 'lot',
        'status', 'is_resolved', 'created_at',
    ]
    list_filter = ['status', 'severity', 'issue_type', 'reporter_type', 'created_at']
    search_fields = ['description', 'user__username', 'lot__batch_number', 'issue_type']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'is_resolved']
    autocomplete_fields = ['user', 'lot']
    
    fieldsets = (
        ('Flag Information', {
            'fields': ('id', 'issue_type', 'severity', 'reporter_type', 'description', 'created_at')
        }),
        ('Relationships', {
            'fields': ('user', 'lot')
        }),
        ('Investigation Lifecycle', {
            'fields': ('status', 'is_resolved', 'investigator_notes')
        }),
        ('Point of Dispensing', {
            'fields': ('dispensing_pharmacy_name', 'date_of_purchase'),
            'classes': ('collapse',),
        }),
        ('Evidence', {
            'fields': ('evidence_image',),
            'classes': ('collapse',),
        }),
        ('Location', {
            'fields': ('latitude', 'longitude', 'region'),
            'classes': ('collapse',),
        }),
    )
    
    actions = ['mark_as_resolved', 'mark_as_investigating', 'mark_as_new']
    
    def mark_as_resolved(self, request, queryset):
        """Admin action to mark selected flags as resolved."""
        count = queryset.update(status='RESOLVED')
        self.message_user(request, f"{count} flag(s) marked as resolved.")
    
    def mark_as_investigating(self, request, queryset):
        """Admin action to mark selected flags as under investigation."""
        count = queryset.update(status='INVESTIGATING')
        self.message_user(request, f"{count} flag(s) marked as investigating.")
    
    def mark_as_new(self, request, queryset):
        """Admin action to reset selected flags to NEW status."""
        count = queryset.update(status='NEW')
        self.message_user(request, f"{count} flag(s) reset to NEW.")
    
    mark_as_resolved.short_description = "Mark as Resolved"
    mark_as_investigating.short_description = "Mark as Investigating"
    mark_as_new.short_description = "Reset to NEW"
