from django.contrib import admin
from .models import CrowdFlag


@admin.register(CrowdFlag)
class CrowdFlagAdmin(admin.ModelAdmin):
    """Admin configuration for the CrowdFlag model."""
    
    list_display = ['issue_type', 'reporter_type', 'user', 'lot', 'is_resolved', 'created_at']
    list_filter = ['issue_type', 'reporter_type', 'is_resolved', 'created_at']
    search_fields = ['description', 'user__username', 'lot__batch_number', 'issue_type']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at']
    autocomplete_fields = ['user', 'lot']
    
    fieldsets = (
        ('Flag Information', {
            'fields': ('id', 'issue_type', 'reporter_type', 'description', 'created_at')
        }),
        ('Relationships', {
            'fields': ('user', 'lot')
        }),
        ('Status', {
            'fields': ('is_resolved',)
        }),
    )
    
    actions = ['mark_as_resolved', 'mark_as_unresolved']
    
    def mark_as_resolved(self, request, queryset):
        """Admin action to mark selected flags as resolved."""
        count = queryset.update(is_resolved=True)
        self.message_user(request, f"{count} flag(s) marked as resolved.")
    
    def mark_as_unresolved(self, request, queryset):
        """Admin action to mark selected flags as unresolved."""
        count = queryset.update(is_resolved=False)
        self.message_user(request, f"{count} flag(s) marked as unresolved.")
    
    mark_as_resolved.short_description = "Mark as resolved"
    mark_as_unresolved.short_description = "Mark as unresolved"
