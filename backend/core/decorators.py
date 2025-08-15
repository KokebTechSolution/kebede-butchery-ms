from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from functools import wraps

def csrf_exempt_for_cors(view_func):
    """
    Custom CSRF decorator that exempts CSRF for cross-origin requests
    """
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        # Check if this is a cross-origin request
        origin = request.headers.get('Origin')
        if origin and origin in [
            'https://kebede-butchery-ms.vercel.app',
            'https://kebede-butchery-h741toz7z-alki45s-projects.vercel.app',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://192.168.1.6:3000',
            'http://10.240.69.22:3000',
            'http://192.168.100.122:3000',
            'http://192.168.1.8:3001',
            'http://10.240.69.22:3001'
        ]:
            # For cross-origin requests, exempt CSRF
            return csrf_exempt(view_func)(request, *args, **kwargs)
        else:
            # For same-origin requests, use normal CSRF
            return view_func(request, *args, **kwargs)
    return wrapped_view

def csrf_exempt_for_cors_class(cls):
    """
    Class decorator to exempt CSRF for cross-origin requests
    """
    if hasattr(cls, 'dispatch'):
        cls.dispatch = csrf_exempt_for_cors(cls.dispatch)
    return cls 