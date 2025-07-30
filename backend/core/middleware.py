from django.middleware.csrf import CsrfViewMiddleware
from django.conf import settings

class CustomCsrfMiddleware(CsrfViewMiddleware):
    """Custom CSRF middleware that disables referer checking for cross-origin requests"""
    
    def process_view(self, request, callback, callback_args, callback_kwargs):
        # Disable referer checking for cross-origin requests
        if hasattr(request, 'META'):
            # Remove referer from META to bypass referer checking
            if 'HTTP_REFERER' in request.META:
                del request.META['HTTP_REFERER']
        
        return super().process_view(request, callback, callback_args, callback_kwargs) 