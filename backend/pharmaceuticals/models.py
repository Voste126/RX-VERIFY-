import uuid
from django.db import models


class Medicine(models.Model):
    """Model representing pharmaceutical medicines with detailed drug information."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text="Product name")
    category = models.CharField(
        max_length=100, 
        help_text="Medicine category (e.g., Antibiotic, Analgesic)",
        blank=True
    )
    
    # New pharmaceutical fields
    active_ingredient = models.CharField(
        max_length=255,
        help_text="Active pharmaceutical ingredient (API) or generic name",
        default="Unknown",
        blank=True
    )
    strength = models.CharField(
        max_length=100,
        help_text="Drug strength (e.g., 500mg, 250mg/5ml)",
        default="Not specified",
        blank=True
    )
    dosage_form = models.CharField(
        max_length=100,
        help_text="Form of medication (e.g., Tablet, Capsule, Syrup, Injection)",
        default="Not specified",
        blank=True
    )
    manufacturer_name = models.CharField(
        max_length=255,
        help_text="Name of the manufacturing company",
        default="Unknown",
        blank=True
    )
    
    distributor = models.ForeignKey(
        'entities.Distributor',
        on_delete=models.CASCADE,
        related_name='medicines',
        help_text="Distributor responsible for this medicine"
    )
    
    def __str__(self):
        return f"{self.name} ({self.active_ingredient} {self.strength})"
    
    class Meta:
        db_table = 'medicines'
        verbose_name = 'Medicine'
        verbose_name_plural = 'Medicines'
        ordering = ['name']

