"""
Django signals for automatic trust score updates.

This module defines signals that automatically recalculate lot trust scores
when crowd flags are created, updated (resolved/unresolved), or deleted.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import CrowdFlag


@receiver(post_save, sender=CrowdFlag)
def update_trust_score_on_flag_save(sender, instance, created, **kwargs):
    """
    Update lot trust score when a flag is created or updated.
    
    Triggers when:
    - A new flag is created
    - A flag's is_resolved status changes
    - Any other flag field is updated
    
    Args:
        sender: The CrowdFlag model class
        instance: The CrowdFlag instance being saved
        created: Boolean indicating if this is a new instance
        **kwargs: Additional keyword arguments
    """
    # Update the associated lot's trust score
    if instance.lot:
        instance.lot.update_trust_score()


@receiver(post_delete, sender=CrowdFlag)
def update_trust_score_on_flag_delete(sender, instance, **kwargs):
    """
    Update lot trust score when a flag is deleted.
    
    Args:
        sender: The CrowdFlag model class
        instance: The CrowdFlag instance being deleted
        **kwargs: Additional keyword arguments
    """
    # Update the associated lot's trust score
    if instance.lot:
        instance.lot.update_trust_score()
