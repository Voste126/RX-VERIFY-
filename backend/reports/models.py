import uuid
from django.db import models


class CrowdFlag(models.Model):
    """Model representing crowdsourced quality reports and flags."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter_type = models.CharField(
        max_length=50,
        help_text="Type of reporter (e.g., Pharmacist, Patient, Healthcare Worker)"
    )
    issue_type = models.CharField(
        max_length=100,
        help_text="Type of issue reported (e.g., Counterfeit Suspected, Quality Issue, Packaging Damage)"
    )
    description = models.TextField(
        help_text="Detailed description of the issue"
    )
    
    SEVERITY_CHOICES = [
        ('CRITICAL', 'Critical - Immediate safety concern'),
        ('HIGH', 'High - Significant quality issue'),
        ('MEDIUM', 'Medium - Notable concern'),
        ('LOW', 'Low - Minor issue'),
    ]
    
    severity = models.CharField(
        max_length=10,
        choices=SEVERITY_CHOICES,
        default='MEDIUM',
        db_index=True,
        help_text="Severity level of the reported issue (impacts trust score calculation)"
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='crowd_flags',
        help_text="User who reported the issue"
    )
    lot = models.ForeignKey(
        'manifests.LotManifest',
        on_delete=models.CASCADE,
        related_name='crowd_flags',
        help_text="Lot manifest being flagged"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.issue_type} - Lot {self.lot.batch_number} by {self.user.username}"
    
    class Meta:
        db_table = 'crowd_flags'
        verbose_name = 'Crowd Flag'
        verbose_name_plural = 'Crowd Flags'
        ordering = ['-created_at']
