import uuid
from django.db import models


class Distributor(models.Model):
    """Model representing pharmaceutical distributors and suppliers."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    public_key = models.TextField(help_text="Public key for verifying digital signatures")
    is_verified_regulator = models.BooleanField(
        default=False,
        help_text="Whether this distributor is verified by regulatory authorities"
    )
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'distributors'
        verbose_name = 'Distributor'
        verbose_name_plural = 'Distributors'
        ordering = ['name']
