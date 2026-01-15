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
    
    print("Step 1: Removing all migration records from django_migrations table...")
    
    # Delete all migration records except contenttypes and sessions (they don't have auth dependencies)
    apps_to_reset = ['admin', 'auth', 'accounts']
    deleted_count = 0
    
    for app in apps_to_reset:
        count = MigrationRecorder.Migration.objects.filter(app=app).count()
        if count > 0:
            MigrationRecorder.Migration.objects.filter(app=app).delete()
            print(f"  ✓ Removed {count} migration(s) from '{app}'")
            deleted_count += count
    
    if deleted_count == 0:
        print("  No migrations to remove.")
    
    print(f"\nStep 2: Faking initial migrations for auth system...")
    
    # Fake the auth and admin migrations since the tables already exist
    try:
        # The auth_user table exists, so we need to fake these
        call_command('migrate', 'auth', '--fake', verbosity=0)
        call_command('migrate', 'admin', '--fake', verbosity=0)
        print("  ✓ Faked auth and admin migrations")
    except Exception as e:
        print(f"  ⚠ Warning faking migrations: {e}")
    
    print(f"\nStep 3: Applying accounts migration (create users table)...")
    try:
        call_command('migrate', 'accounts', verbosity=1)
        print("  ✓ Applied accounts migrations")
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False
    
    print(f"\nStep 4: Applying all remaining migrations...")
    try:
        call_command('migrate', verbosity=1)
        print("  ✓ All migrations applied")
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False
    
    return True

if __name__ == '__main__':
    try:
        print("=" * 60)
        print("Django Migration Reset and Reapply Script")
        print("=" * 60)
        print()
        
        success = reset_and_migrate()
        
        if success:
            print("\n" + "=" * 60)
            print("✅ SUCCESS! All migrations applied successfully!")
            print("=" * 60)
            sys.exit(0)
        else:
            print("\n" + "=" * 60)
            print("❌ FAILED! See errors above .")
            print("=" * 60)
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
