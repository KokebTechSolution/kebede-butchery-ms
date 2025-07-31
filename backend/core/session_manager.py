from django.contrib.sessions.models import Session
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class SessionManager:
    """
    Utility class for managing sessions across cross-origin requests
    """
    
    @staticmethod
    def create_session(request, user):
        """
        Create a new session for a user
        """
        try:
            # Clear any existing session
            if request.session.session_key:
                request.session.flush()
            
            # Create new session
            request.session.create()
            
            # Set user in session
            request.session['_auth_user_id'] = user.id
            request.session['_auth_user_backend'] = 'django.contrib.auth.backends.ModelBackend'
            request.session['_auth_user_hash'] = user.get_session_auth_hash()
            
            # Save session
            request.session.save()
            
            logger.info(f"Session created for user {user.username}: {request.session.session_key}")
            return request.session.session_key
            
        except Exception as e:
            logger.error(f"Error creating session for user {user.username}: {e}")
            return None
    
    @staticmethod
    def validate_session(request):
        """
        Validate if the current session is valid and return the user
        """
        try:
            session_key = request.session.session_key
            if not session_key:
                return None
            
            # Check if session exists in database
            session = Session.objects.get(
                session_key=session_key,
                expire_date__gt=timezone.now()
            )
            
            # Get user ID from session
            session_data = session.get_decoded()
            user_id = session_data.get('_auth_user_id')
            
            if user_id:
                user = User.objects.get(id=user_id)
                return user
            
            return None
            
        except (Session.DoesNotExist, User.DoesNotExist, KeyError) as e:
            logger.warning(f"Session validation failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Error validating session: {e}")
            return None
    
    @staticmethod
    def clear_session(request):
        """
        Clear the current session
        """
        try:
            if request.session.session_key:
                request.session.flush()
                request.session.delete()
            return True
        except Exception as e:
            logger.error(f"Error clearing session: {e}")
            return False
    
    @staticmethod
    def refresh_session(request):
        """
        Refresh the session expiry time
        """
        try:
            if request.session.session_key:
                request.session.set_expiry(86400)  # 24 hours
                request.session.save()
                return True
            return False
        except Exception as e:
            logger.error(f"Error refreshing session: {e}")
            return False 