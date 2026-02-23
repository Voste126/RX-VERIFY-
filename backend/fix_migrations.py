#!/usr/bin/env python
"""
Script to completely reset migration history and reapply all migrations.
This removes all migration records and reapplies them in the correct order.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, '/home/steve/projects/RX-VERIFY-/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db.migrations.recorder import MigrationRecorder
from django.core.management import call_command

def reset_and_migrate():
    """Remove all migration records and reapply migrations in correct order."""
    
    
    # Delete all migration records except contenttypes and sessions (they don't have auth dependencies)
    apps_to_reset = ['admin', 'auth', 'accounts']
    deleted_count = 0
    
    for app in apps_to_reset:
        count = MigrationRecorder.Migration.objects.filter(app=app).count()
        if count > 0:
            MigrationRecorder.Migration.objects.filter(app=app).delete()
            deleted_count += count
    
    if deleted_count == 0:
    
    
    # Fake the auth and admin migrations since the tables already exist
    try:
        # The auth_user table exists, so we need to fake these
        call_command('migrate', 'auth', '--fake', verbosity=0)
        call_command('migrate', 'admin', '--fake', verbosity=0)
    except Exception as e:
    
    try:
        call_command('migrate', 'accounts', verbosity=1)
    except Exception as e:
        return False
    
    try:
        call_command('migrate', verbosity=1)
    except Exception as e:
        return False
    
    return True

if __name__ == '__main__':
    try:
        
        success = reset_and_migrate()
        
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
