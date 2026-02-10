import uuid
from django.db import models


class Distributor(models.Model):
    """Model representing pharmaceutical distributors and suppliers."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    public_key = models.TextField(help_text="Public key for verifying digital signatures")
    is_verified_regulator = models.BooleanField(
        default=True,  # Changed to True by default
        help_text="Whether this distributor is verified by regulatory authorities"
    )
    created_by = models.ForeignKey(
        'accounts.User',
        null=True,  # Temporarily nullable
        blank=True,
        on_delete=models.CASCADE,
        related_name='distributor_entities',
        help_text="User who created this distributor entity"
    )
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'distributors'
        verbose_name = 'Distributor'
        verbose_name_plural = 'Distributors'
        ordering = ['name']
