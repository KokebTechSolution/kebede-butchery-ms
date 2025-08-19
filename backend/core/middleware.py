from django.middleware.csrf import get_token
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse

class CSRFMiddleware(MiddlewareMixin):
    """
    Custom middleware to ensure CSRF cookies are set for all requests
    """
    def process_response(self, request, response):
        # Only set CSRF cookie if it's not already set
        if 'csrftoken' not in request.COOKIES:
            csrf_token = get_token(request)
            if csrf_token:
                from django.conf import settings
                response.set_cookie(
                    'csrftoken',
                    csrf_token,
                    max_age=31449600,  # 1 year
                    secure=not settings.DEBUG,  # Secure in production, not in development
                    samesite='None' if not settings.DEBUG else 'Lax',  # None for production, Lax for development
                    httponly=False,
                    path='/',
                    domain=None
                )
                print(f"[DEBUG] CSRF cookie set by middleware: {csrf_token[:10]}...")
        return response

class CORSMiddleware(MiddlewareMixin):
    """
    Custom CORS middleware to ensure proper headers are set
    """
    def process_response(self, request, response):
        # Get origin from request headers
        origin = request.headers.get('Origin')
        
        # Set CORS headers for all responses
        if origin:
            response['Access-Control-Allow-Origin'] = origin
        else:
            response['Access-Control-Allow-Origin'] = '*'
            
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken, X-Requested-With, Accept, Origin, X-Session-Key, x-session-key, X-SESSION-KEY'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Expose-Headers'] = 'Content-Type, Authorization, X-CSRFToken, Set-Cookie, X-Session-Key'
        
        # Handle preflight requests
        if request.method == 'OPTIONS':
            response.status_code = 200
            response.content = b''
        
        # Debug logging for network access
        if origin and 'localhost' not in origin and '127.0.0.1' not in origin:
            print(f"[DEBUG] CORS middleware: Network origin detected: {origin}")
            print(f"[DEBUG] CORS middleware: Setting Access-Control-Allow-Origin: {origin}")
            print(f"[DEBUG] CORS middleware: Access-Control-Allow-Credentials: true")
            print(f"[DEBUG] CORS middleware: Access-Control-Expose-Headers: {response['Access-Control-Expose-Headers']}")
        
        return response

class SessionMiddleware(MiddlewareMixin):
    """
    Custom session middleware to ensure proper user authentication
    """
    
    def process_request(self, request):
        # Allow all session operations - let Django handle it
        return None
    
    def process_response(self, request, response):
        # Only save sessions for authenticated users
        if hasattr(request, 'session') and request.session.session_key:
            if request.user and request.user.is_authenticated:
                request.session.save()
                print(f"[DEBUG] SessionMiddleware: Saved session for user {request.user.username}")
        
        return response 