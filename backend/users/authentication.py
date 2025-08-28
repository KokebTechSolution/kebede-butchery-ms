"""
Safe authentication backend that handles database schema mismatches
"""
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db import connection
from django.contrib.auth.hashers import check_password

User = get_user_model()

class SafeModelBackend(ModelBackend):
    """
    Custom authentication backend that uses raw SQL to avoid ORM column issues
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
            
        try:
            # Try normal ORM authentication first
            try:
                user = User._default_manager.get_by_natural_key(username)
                if user.check_password(password) and self.user_can_authenticate(user):
                    return user
            except Exception as orm_error:
                print(f"[AUTH DEBUG] ORM authentication failed: {orm_error}")
                
                # Fallback to raw SQL authentication
                with connection.cursor() as cursor:
                    # Get user data with raw SQL
                    cursor.execute("""
                        SELECT id, username, password, first_name, last_name, 
                               email, is_staff, is_active, is_superuser, date_joined
                        FROM users_user 
                        WHERE username = %s
                    """, [username])
                    
                    row = cursor.fetchone()
                    if row:
                        user_id, db_username, db_password, first_name, last_name, email, is_staff, is_active, is_superuser, date_joined = row
                        
                        # Check password
                        if check_password(password, db_password) and is_active:
                            # Create a minimal user object
                            user = User(
                                id=user_id,
                                username=db_username,
                                password=db_password,
                                first_name=first_name,
                                last_name=last_name,
                                email=email,
                                is_staff=is_staff,
                                is_active=is_active,
                                is_superuser=is_superuser,
                                date_joined=date_joined
                            )
                            
                            # Try to add optional fields if they exist
                            try:
                                cursor.execute("""
                                    SELECT role, branch_id 
                                    FROM users_user 
                                    WHERE id = %s
                                """, [user_id])
                                optional_row = cursor.fetchone()
                                if optional_row:
                                    user.role = optional_row[0]
                                    user.branch_id = optional_row[1]
                            except Exception:
                                # Optional fields don't exist, set defaults
                                user.role = 'user'
                                user.branch_id = None
                            
                            print(f"[AUTH DEBUG] Raw SQL authentication successful for: {username}")
                            return user
                
        except Exception as e:
            print(f"[AUTH DEBUG] Authentication completely failed: {e}")
            return None
        
        return None
