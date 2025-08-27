"""
Custom CORS Middleware - Bulletproof CORS solution
This middleware ensures CORS headers are always sent correctly
"""

class CustomCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Debug logging
        print(f"[CORS DEBUG] Request: {request.method} {request.path}")
        print(f"[CORS DEBUG] Origin: {request.META.get('HTTP_ORIGIN', 'No Origin')}")
        
        # Handle preflight OPTIONS requests
        if request.method == 'OPTIONS':
            print("[CORS DEBUG] Handling OPTIONS preflight request")
            response = self.create_cors_response()
            return response

        # Process the request
        response = self.get_response(request)

        # Add CORS headers to all responses
        self.add_cors_headers(response, request)
        
        # Debug logging for response
        print(f"[CORS DEBUG] Response status: {response.status_code}")
        print(f"[CORS DEBUG] CORS Origin header: {response.get('Access-Control-Allow-Origin', 'NOT SET')}")
        
        return response

    def create_cors_response(self):
        """Create a response for preflight OPTIONS requests"""
        from django.http import HttpResponse
        response = HttpResponse()
        self.add_cors_headers(response, None)
        return response

    def add_cors_headers(self, response, request):
        """Add CORS headers to the response"""
        # Get the origin from the request
        origin = request.META.get('HTTP_ORIGIN', '') if request else ''
        
        # Allow specific origins
        allowed_origins = [
            'https://kebede-butchery-ms-1.onrender.com',  # Production frontend
            'http://localhost:3000',  # Development frontend
        ]
        
        # Set the origin if it's allowed
        if origin in allowed_origins:
            response['Access-Control-Allow-Origin'] = origin
        else:
            # Default to production frontend
            response['Access-Control-Allow-Origin'] = 'https://kebede-butchery-ms-1.onrender.com'
        
        # Allow credentials (cookies, authorization headers)
        response['Access-Control-Allow-Credentials'] = 'true'
        
        # Allow common headers
        response['Access-Control-Allow-Headers'] = (
            'accept, accept-encoding, authorization, content-type, '
            'dnt, origin, user-agent, x-csrftoken, x-requested-with'
        )
        
        # Allow common methods
        response['Access-Control-Allow-Methods'] = (
            'DELETE, GET, OPTIONS, PATCH, POST, PUT'
        )
        
        # Expose headers that the frontend might need
        response['Access-Control-Expose-Headers'] = 'Content-Type, X-CSRFToken'
        
        # Cache preflight for 1 hour
        response['Access-Control-Max-Age'] = '3600'
