from django.middleware.csrf import get_token
from django.utils.deprecation import MiddlewareMixin
from core.session_manager import SessionManager

class CSRFMiddleware(MiddlewareMixin):
    """
    Custom middleware to ensure CSRF cookies are set for all requests
    """
    def process_response(self, request, response):
        # Only set CSRF cookie if it's not already set
        if 'csrftoken' not in request.COOKIES:
            csrf_token = get_token(request)
            if csrf_token:
                response.set_cookie(
                    'csrftoken',
                    csrf_token,
                    max_age=31449600,  # 1 year
                    secure=False,  # Allow HTTP for local development
                    samesite='None',  # Allow cross-site for network access
                    httponly=False,
                    path='/',
                    domain=None
                )
                print(f"[DEBUG] CSRF cookie set by middleware: {csrf_token[:10]}...")
        
        return response

class SessionMiddleware(MiddlewareMixin):
    """
    Custom middleware to handle session authentication
    """
    def process_request(self, request):
        # Try to validate session and set user
        user = SessionManager.validate_session(request)
        if user:
            request.user = user
            # Refresh session expiry
            SessionManager.refresh_session(request)
        
        return None 