"""
Activate all existing inactive users.

This migration script activates all users who were registered
but not marked as active due to the bug in the registration serializer.

Run with: python manage.py shell < activate_users.py
"""

from accounts.models import User

# Find all inactive users
inactive_users = User.objects.filter(is_active=False)


# Activate them
if inactive_users.exists():
    inactive_users.update(is_active=True)
    
    # List activated users
    for user in inactive_users:
else:

