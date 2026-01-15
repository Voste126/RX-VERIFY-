from django.contrib import admin
from .models import LotManifest


@admin.register(LotManifest)
class LotManifestAdmin(admin.ModelAdmin):
    """Admin configuration for the LotManifest model."""
    
    list_display = ['batch_number', 'medicine', 'distributor', 'expiry_date', 'trust_score', 'id']
    list_filter = ['expiry_date', 'distributor', 'medicine']
    search_fields = ['batch_number', 'medicine__name', 'distributor__name']
    ordering = ['-expiry_date']
    readonly_fields = ['id']
    autocomplete_fields = ['medicine', 'distributor']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'batch_number', 'expiry_date')
        }),
        ('Relationships', {
            'fields': ('medicine', 'distributor')
        }),
        ('Verification', {
            'fields': ('digital_signature', 'trust_score')
        }),
    )
    
    actions = ['verify_signatures']
    
    def verify_signatures(self, request, queryset):
        """Admin action to verify signatures for selected manifests."""
        verified_count = 0
        for manifest in queryset:
            if manifest.verify_signature():
                verified_count += 1
        self.message_user(request, f"{verified_count} out of {queryset.count()} signatures verified successfully.")
    
    verify_signatures.short_description = "Verify digital signatures"
