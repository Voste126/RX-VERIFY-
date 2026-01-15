import uuid
from django.db import models
from decimal import Decimal


class LotManifest(models.Model):
    """Model representing batch/lot manifests with digital signatures and trust scores."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=100, unique=True)
    expiry_date = models.DateField()
    digital_signature = models.TextField(
        help_text="Digital signature from the distributor"
    )
    trust_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Trust score based on verification (0.00 to 100.00)"
    )
    medicine = models.ForeignKey(
        'pharmaceuticals.Medicine',
        on_delete=models.CASCADE,
        related_name='lot_manifests',
        help_text="Medicine associated with this lot"
    )
    distributor = models.ForeignKey(
        'entities.Distributor',
        on_delete=models.CASCADE,
        related_name='lot_manifests',
        help_text="Distributor who provided this lot"
    )
    
    def verify_signature(self):
        """
        Placeholder method for signature verification.
        
        In production, this would verify the digital_signature against
        the distributor's public_key using cryptographic algorithms.
        
        Returns:
            bool: True if signature is valid, False otherwise
        """
        # TODO: Implement actual signature verification logic
        return True
    
    def __str__(self):
        return f"Lot {self.batch_number} - {self.medicine.name}"
    
    class Meta:
        db_table = 'lot_manifests'
        verbose_name = 'Lot Manifest'
        verbose_name_plural = 'Lot Manifests'
        ordering = ['-expiry_date']
