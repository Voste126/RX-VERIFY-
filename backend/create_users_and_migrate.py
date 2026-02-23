#!/usr/bin/env python
"""
Create users table directly via SQL and complete migrations.
"""
import os
import sys
import django

sys.path.insert(0, '/home/steve/projects/RX-VERIFY-/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection
from django.db.migrations.recorder import MigrationRecorder
from django.core.management import call_command

def create_users_table_and_migrate():
    """Create users table via SQL and complete migrations."""
    
    
    sql = """
    CREATE TABLE IF NOT EXISTS "users" (
        "password" varchar(128) NOT NULL, 
        "last_login" timestamp with time zone NULL, 
        "is_superuser" boolean NOT NULL, 
        "username" varchar(150) NOT NULL UNIQUE, 
        "first_name" varchar(150) NOT NULL, 
        "last_name" varchar(150) NOT NULL, 
        "email" varchar(254) NOT NULL, 
        "is_staff" boolean NOT NULL, 
        "is_active" boolean NOT NULL, 
        "date_joined" timestamp with time zone NOT NULL, 
        "id" uuid NOT NULL PRIMARY KEY, 
        "role" varchar(20) NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "users_groups" (
        "id" bigserial NOT NULL PRIMARY KEY, 
        "user_id" uuid NOT NULL, 
        "group_id" integer NOT NULL,
        UNIQUE ("user_id", "group_id")
    );
    
    CREATE TABLE IF NOT EXISTS "users_user_permissions" (
        "id" bigserial NOT NULL PRIMARY KEY,
        "user_id" uuid NOT NULL, 
        "permission_id" integer NOT NULL,
        UNIQUE ("user_id", "permission_id")
    );
    
    CREATE INDEX IF NOT EXISTS "users_username_e8658fc8_like" ON "users" ("username" varchar_pattern_ops);
    
    DO $$ BEGIN
        ALTER TABLE "users_groups" ADD CONSTRAINT "users_groups_user_id_f500bee5_fk_users_id" 
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    
    DO $$ BEGIN
        ALTER TABLE "users_groups" ADD CONSTRAINT "users_groups_group_id_2f3517aa_fk_auth_group_id" 
        FOREIGN KEY ("group_id") REFERENCES "auth_group" ("id") DEFERRABLE INITIALLY DEFERRED;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    
    CREATE INDEX IF NOT EXISTS "users_groups_user_id_f500bee5" ON "users_groups" ("user_id");
    CREATE INDEX IF NOT EXISTS "users_groups_group_id_2f3517aa" ON "users_groups" ("group_id");
    
    DO $$ BEGIN
        ALTER TABLE "users_user_permissions" ADD CONSTRAINT "users_user_permissions_user_id_92473840_fk_users_id" 
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    
    DO $$ BEGIN
        ALTER TABLE "users_user_permissions" ADD CONSTRAINT "users_user_permissio_permission_id_6d08dcd2_fk_auth_perm" 
        FOREIGN KEY ("permission_id") REFERENCES "auth_permission" ("id") DEFERRABLE INITIALLY DEFERRED;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    
    CREATE INDEX IF NOT EXISTS "users_user_permissions_user_id_92473840" ON "users_user_permissions" ("user_id");
    CREATE INDEX IF NOT EXISTS "users_user_permissions_permission_id_6d08dcd2" ON "users_user_permissions" ("permission_id");
    """
    
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql)
    except Exception as e:
    
    if not MigrationRecorder.Migration.objects.filter(app='accounts', name='0001_initial').exists():
        MigrationRecorder.Migration.objects.create(app='accounts', name='0001_initial')
    else:
    
    try:
        call_command('migrate', verbosity=2)
        return True
    except Exception as e:
        return False

if __name__ == '__main__':
    try:
        
        success = create_users_table_and_migrate()
        
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
