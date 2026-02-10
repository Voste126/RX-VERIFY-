"""
Activate all existing inactive users.

This migration script activates all users who were registered
but not marked as active due to the bug in the registration serializer.

Run with: python manage.py shell < activate_users.py
"""

from accounts.models import User

# Find all inactive users
inactive_users = User.objects.filter(is_active=False)

print(f"Found {inactive_users.count()} inactive users")

# Activate them
if inactive_users.exists():
    inactive_users.update(is_active=True)
    print(f"✅ Activated {inactive_users.count()} users")
    
    # List activated users
    for user in inactive_users:
        print(f"  - {user.username} ({user.email}) - Role: {user.role}")
else:
    print("No inactive users found.")

print("\n✅ Complete! All users are now active and can log in.")
