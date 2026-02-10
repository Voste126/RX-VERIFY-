import uuid
import hashlib
from django.db import models
from decimal import Decimal


class SupplyOrder(models.Model):
    """
    Model representing supply orders from pharmacists to distributors.
    
    This creates a secure chain of custody by linking orders to lot manifests,
    enabling verification that medicines were delivered to authorized recipients.
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('REJECTED', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Participants
    pharmacist = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='supply_orders',
        limit_choices_to={'role': 'Pharmacist'},
        help_text="Pharmacist who placed this order"
    )
    
    distributor = models.ForeignKey(
        'entities.Distributor',
        on_delete=models.CASCADE,
        related_name='supply_orders',
        help_text="Distributor who will fulfill this order"
    )
    
    # Order details
    items = models.JSONField(
        help_text="List of medicines and quantities requested (e.g., [{'medicine_id': '<uuid>', 'name': 'Aspirin', 'quantity': 100}])"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        help_text="Current status of the order"
    )
    
    # Chain of custody link
    manifest = models.OneToOneField(
        'manifests.LotManifest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='supply_order',
        help_text="Lot manifest linked to this order (creates chain of custody)"
    )
    
    # Delivery verification
    delivery_token = models.CharField(
        max_length=64,
        blank=True,
        help_text="SHA-256 hash generated for offline verification"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        """Generate delivery token on creation."""
        if not self.delivery_token:
            # Generate a unique hash for offline verification
            token_data = f"{self.id}:{self.pharmacist_id}:{self.distributor_id}"
            self.delivery_token = hashlib.sha256(token_data.encode()).hexdigest()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Order {self.id} - {self.pharmacist.username} from {self.distributor.name} ({self.status})"
    
    class Meta:
        db_table = 'supply_orders'
        verbose_name = 'Supply Order'
        verbose_name_plural = 'Supply Orders'
        ordering = ['-created_at']
