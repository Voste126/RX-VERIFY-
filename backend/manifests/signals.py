from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender='reports.CrowdFlag')
@receiver(post_delete, sender='reports.CrowdFlag')
def update_score_on_flag(sender, instance, **kwargs):
    """Update trust score when a CrowdFlag is modified/deleted."""
    if instance.lot:
        instance.lot.update_trust_score()


@receiver(post_save, sender='logs.ReceiptEvent')
@receiver(post_delete, sender='logs.ReceiptEvent')
def update_score_on_receipt(sender, instance, **kwargs):
    """Update trust score when a ReceiptEvent is generated/deleted."""
    if instance.lot:
        instance.lot.update_trust_score()
