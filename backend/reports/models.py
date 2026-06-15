import uuid
from django.db import models


class CrowdFlag(models.Model):
    """
    Model representing an Incident Report for crowdsourced quality reporting.

    Implements a full Investigation Lifecycle with states:
    NEW → INVESTIGATING → ESCALATED_DISTRIBUTOR / ESCALATED_REGULATOR → RESOLVED / CLOSED_NO_ACTION
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter_type = models.CharField(
        max_length=50,
        help_text="Type of reporter (e.g., Pharmacist, Patient, Healthcare Worker)"
    )

    # ── Issue Type (enumerated choices for new flags, legacy free-text preserved) ──
    ISSUE_TYPE_CHOICES = [
        ('COUNTERFEIT', 'Counterfeit Suspected'),
        ('QUALITY', 'Quality Issue'),
        ('PACKAGING', 'Packaging Damage'),
        ('ADVERSE_EVENT', 'Adverse Patient Reaction'),
        ('MISSING_MANIFEST', 'Missing Manifest'),
    ]

    issue_type = models.CharField(
        max_length=100,
        choices=ISSUE_TYPE_CHOICES,
        help_text="Type of issue reported"
    )

    description = models.TextField(
        help_text="Detailed description of the issue"
    )
    latitude = models.FloatField(
        null=True,
        blank=True,
        help_text="Latitude coordinate of the report"
    )
    longitude = models.FloatField(
        null=True,
        blank=True,
        help_text="Longitude coordinate of the report"
    )
    region = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Geographical region or administrative area"
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

    # ── Investigation Lifecycle Status ────────────────────────────────────────
    STATUS_CHOICES = [
        ('NEW', 'New — Awaiting Review'),
        ('INVESTIGATING', 'Under Investigation'),
        ('ESCALATED_DISTRIBUTOR', 'Escalated to Distributor'),
        ('ESCALATED_REGULATOR', 'Escalated to Regulator'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED_NO_ACTION', 'Closed — No Action Required'),
    ]

    status = models.CharField(
        max_length=25,
        choices=STATUS_CHOICES,
        default='NEW',
        db_index=True,
        help_text="Current investigation lifecycle status"
    )

    # ── Point of Dispensing Context ───────────────────────────────────────────
    dispensing_pharmacy_name = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text="Name of the pharmacy where the product was purchased"
    )
    date_of_purchase = models.DateField(
        null=True,
        blank=True,
        help_text="Date the product was purchased by the reporter"
    )

    # ── Evidence ─────────────────────────────────────────────────────────────
    evidence_image = models.ImageField(
        upload_to='reports/evidence/%Y/%m/',
        null=True,
        blank=True,
        help_text="Photographic evidence of the reported issue"
    )

    # ── Audit Trail ──────────────────────────────────────────────────────────
    investigator_notes = models.TextField(
        blank=True,
        default='',
        help_text="Timestamped investigation notes appended by administrators"
    )

    # ── Backward Compatibility ───────────────────────────────────────────────
    @property
    def is_resolved(self):
        """Backward-compatible property: True when status is a terminal resolved state."""
        return self.status in ('RESOLVED', 'CLOSED_NO_ACTION')

    def __str__(self):
        return f"{self.issue_type} - Lot {self.lot.batch_number} by {self.user.username}"

    class Meta:
        db_table = 'crowd_flags'
        verbose_name = 'Crowd Flag'
        verbose_name_plural = 'Crowd Flags'
        ordering = ['-created_at']
