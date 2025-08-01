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
                    samesite='Lax',  # Changed to Lax for localhost compatibility
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
        # Set CORS headers for all responses
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken, X-Requested-With, Accept, Origin'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Expose-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
        
        # Handle preflight requests
        if request.method == 'OPTIONS':
            response.status_code = 200
            response.content = b''
        
        return response

class SessionMiddleware(MiddlewareMixin):
    """
    Custom middleware to handle session authentication
    """
    def process_request(self, request):
        # This middleware can be used for custom session handling if needed
        pass 