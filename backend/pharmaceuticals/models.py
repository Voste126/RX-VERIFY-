import uuid
from django.db import models


class Medicine(models.Model):
    """Model representing pharmaceutical medicines."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, help_text="Medicine category (e.g., Antibiotic, Analgesic)")
    distributor = models.ForeignKey(
        'entities.Distributor',
        on_delete=models.CASCADE,
        related_name='medicines',
        help_text="Distributor responsible for this medicine"
    )
    
    def __str__(self):
        return f"{self.name} ({self.category})"
    
    class Meta:
        db_table = 'medicines'
        verbose_name = 'Medicine'
        verbose_name_plural = 'Medicines'
        ordering = ['name']
