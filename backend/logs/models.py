import uuid
from django.db import models


class ReceiptEvent(models.Model):
    """Model representing receipt events with location tracking."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    location_coord = models.JSONField(
        help_text="Geographic coordinates in JSON format (e.g., {'lat': 40.7128, 'lng': -74.0060})"
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='receipt_events',
        help_text="User who scanned/received the lot"
    )
    lot = models.ForeignKey(
        'manifests.LotManifest',
        on_delete=models.CASCADE,
        related_name='receipt_events',
        help_text="Lot manifest that was scanned/received"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Receipt by {self.user.username} - Lot {self.lot.batch_number}"
    
    class Meta:
        db_table = 'receipt_events'
        verbose_name = 'Receipt Event'
        verbose_name_plural = 'Receipt Events'
        ordering = ['-created_at']
