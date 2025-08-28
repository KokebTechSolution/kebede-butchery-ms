"""
Custom User Manager to handle database schema mismatches
"""
from django.contrib.auth.models import BaseUserManager
from django.db import connection

class SafeUserManager(BaseUserManager):
    """
    Custom user manager that handles missing database columns gracefully
    """
    
    def get_queryset(self):
        """
        Override queryset to only select fields that exist in the database
        """
        # Check which columns actually exist in the database
        try:
            with connection.cursor() as cursor:
                cursor.execute("PRAGMA table_info(users_user)")
                columns = cursor.fetchall()
                existing_columns = [col[1] for col in columns]
                
                # Only select fields that exist in the database
                qs = super().get_queryset()
                
                # If phone_number column doesn't exist, defer it to avoid errors
                if 'phone_number' not in existing_columns:
                    qs = qs.defer('phone_number')
                    
                return qs
                
        except Exception:
            # If we can't check columns, return normal queryset
            return super().get_queryset()
    
    def get_by_natural_key(self, username):
        """
        Override to handle authentication with missing columns
        """
        try:
            return self.get(**{self.model.USERNAME_FIELD: username})
        except Exception as e:
            # If query fails due to missing columns, try with raw SQL
            try:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT id FROM users_user WHERE username = %s", 
                        [username]
                    )
                    row = cursor.fetchone()
                    if row:
                        return self.model.objects.get(id=row[0])
            except Exception:
                pass
            raise self.model.DoesNotExist(f"User with username '{username}' does not exist")
