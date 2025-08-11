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
                response.set_cookie(
                    'csrftoken',
                    csrf_token,
                    max_age=31449600,  # 1 year
                    secure=False,  # Allow HTTP for local development
                    samesite='Lax',  # Match Django session settings
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
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken, X-Requested-With, Accept, Origin'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Expose-Headers'] = 'Content-Type, Authorization, X-CSRFToken, Set-Cookie'
        
        # Handle preflight requests
        if request.method == 'OPTIONS':
            response.status_code = 200
            response.content = b''
        
        # Debug logging for network access
        if origin and 'localhost' not in origin and '127.0.0.1' not in origin:
            print(f"[DEBUG] CORS middleware: Network origin detected: {origin}")
            print(f"[DEBUG] CORS middleware: Setting Access-Control-Allow-Origin: {origin}")
            print(f"[DEBUG] CORS middleware: Access-Control-Allow-Credentials: true")
        
        return response

class SessionMiddleware(MiddlewareMixin):
    """
    Custom session middleware to prevent anonymous sessions and ensure proper user authentication
    """
    
    def process_request(self, request):
        # Only create sessions for authenticated users or when explicitly needed
        if not hasattr(request, 'session'):
            return None
        
        # If this is a session creation request (like CSRF), allow it
        if request.path in ['/api/users/csrf/', '/api/users/session-debug/']:
            return None
        
        # For other requests, only create sessions if user is authenticated
        if request.user and request.user.is_authenticated:
            return None
        
        # Don't create anonymous sessions for other requests
        if not request.session.session_key:
            print(f"[DEBUG] SessionMiddleware: Preventing anonymous session for {request.path}")
            return None
        
        return None
    
    def process_response(self, request, response):
        # Only save sessions for authenticated users
        if hasattr(request, 'session') and request.session.session_key:
            if request.user and request.user.is_authenticated:
                request.session.save()
                print(f"[DEBUG] SessionMiddleware: Saved session for user {request.user.username}")
            else:
                # Don't save anonymous sessions
                print(f"[DEBUG] SessionMiddleware: Not saving anonymous session")
        
        return response 