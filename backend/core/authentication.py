from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class SessionAuthenticationBackend(ModelBackend):
    """
    Custom authentication backend that handles session authentication
    for cross-origin requests
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        # First try the standard authentication
        user = super().authenticate(request, username, password, **kwargs)
        if user:
            print(f"[DEBUG] SessionAuthenticationBackend: Standard auth successful for {user.username}")
            return user
        
        # If no user found, try session-based authentication
        if request and hasattr(request, 'session'):
            session_key = request.session.session_key
            print(f"[DEBUG] SessionAuthenticationBackend: Session key: {session_key}")
            if session_key:
                try:
                    # Get the session from database
                    session = Session.objects.get(
                        session_key=session_key,
                        expire_date__gt=timezone.now()
                    )
                    
                    # Get user ID from session
                    user_id = session.get_decoded().get('_auth_user_id')
                    print(f"[DEBUG] SessionAuthenticationBackend: User ID from session: {user_id}")
                    if user_id:
                        try:
                            user = User.objects.get(id=user_id)
                            print(f"[DEBUG] SessionAuthenticationBackend: Session auth successful for {user.username}")
                            return user
                        except User.DoesNotExist:
                            print(f"[DEBUG] SessionAuthenticationBackend: User {user_id} not found in database")
                            return None
                except Session.DoesNotExist:
                    print(f"[DEBUG] SessionAuthenticationBackend: Session {session_key} not found in database")
                    return None
            else:
                print(f"[DEBUG] SessionAuthenticationBackend: No session key in request")
        else:
            print(f"[DEBUG] SessionAuthenticationBackend: No session in request")
        
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None 