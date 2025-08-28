#!/usr/bin/env python3
"""
Database schema fix for production deployment
This script ensures the users_user table has all required columns
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings_production')
django.setup()

from django.db import connection

def fix_users_table():
    """
    Fix the users_user table to include missing columns
    """
    print("🔧 Checking and fixing users_user table schema...")
    
    with connection.cursor() as cursor:
        # Check current table structure
        try:
            cursor.execute("PRAGMA table_info(users_user)")
            columns = cursor.fetchall()
            column_names = [col[1] for col in columns]
            
            print(f"📋 Current columns: {column_names}")
            
            # Check for missing columns and add them
            required_columns = {
                'phone_number': 'VARCHAR(15) NULL',
                'updated_at': 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
                'branch_id': 'INTEGER NULL REFERENCES branches_branch(id)'
            }
            
            for col_name, col_definition in required_columns.items():
                if col_name not in column_names:
                    print(f"⚠️  Missing column: {col_name}")
                    try:
                        alter_sql = f"ALTER TABLE users_user ADD COLUMN {col_name} {col_definition}"
                        print(f"🔧 Adding column: {alter_sql}")
                        cursor.execute(alter_sql)
                        print(f"✅ Added column: {col_name}")
                    except Exception as e:
                        print(f"❌ Failed to add column {col_name}: {e}")
                else:
                    print(f"✅ Column exists: {col_name}")
            
            # Test if we can now query all columns
            try:
                cursor.execute("SELECT id, username, phone_number, updated_at, branch_id FROM users_user LIMIT 1")
                print("✅ All required columns are now accessible")
                return True
            except Exception as e:
                print(f"❌ Still cannot access all columns: {e}")
                return False
                
        except Exception as e:
            print(f"❌ Error checking table structure: {e}")
            return False

def test_user_model():
    """
    Test if the User model works with the current database
    """
    print("\n🧪 Testing User model...")
    
    try:
        from users.models import User
        
        # Try to query users
        user_count = User.objects.count()
        print(f"✅ User model works - found {user_count} users")
        
        # Try to get first user if any exist
        if user_count > 0:
            first_user = User.objects.first()
            print(f"✅ Successfully retrieved user: {first_user.username}")
            
            # Test serialization
            from users.serializers import UserLoginSerializer
            serializer = UserLoginSerializer(first_user)
            print(f"✅ Serialization works: {serializer.data}")
            
        return True
        
    except Exception as e:
        print(f"❌ User model test failed: {e}")
        return False

def main():
    print("🚀 Database Schema Fix for Production")
    print("=" * 50)
    
    schema_fixed = fix_users_table()
    
    if schema_fixed:
        model_works = test_user_model()
        
        if model_works:
            print("\n🎉 Database schema fix completed successfully!")
            print("✅ All required columns are present")
            print("✅ User model works correctly")
            print("✅ Serialization works correctly")
        else:
            print("\n⚠️  Schema fixed but model still has issues")
    else:
        print("\n❌ Failed to fix database schema")

if __name__ == "__main__":
    main()
