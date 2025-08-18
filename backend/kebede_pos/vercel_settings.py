"""
Vercel-specific settings for Kebede Butchery MS
"""
from . import deployment_settings
from .settings import *  # noqa

# Security
DEBUG = False
ALLOWED_HOSTS = deployment_settings.ALLOWED_HOSTS
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# CORS and CSRF for Vercel
CORS_ALLOWED_ORIGINS = deployment_settings.CORS_ALLOWED_ORIGINS
CSRF_TRUSTED_ORIGINS = deployment_settings.CSRF_TRUSTED_ORIGINS

# Cookie settings for Vercel
CSRF_COOKIE_DOMAIN = None  # Allow all Vercel subdomains
SESSION_COOKIE_DOMAIN = None  # Allow all Vercel subdomains

# Additional CORS settings for Vercel
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-environment',
    'x-session-key',
    'X-Session-Key',
    'X-SESSION-KEY',
    'access-control-allow-credentials',
    'access-control-allow-origin',
    'access-control-allow-methods',
    'access-control-allow-headers',
]

CORS_EXPOSE_HEADERS = [
    'access-control-allow-credentials',
    'access-control-allow-origin',
    'access-control-allow-methods',
    'access-control-allow-headers',
    'x-environment',
    'x-session-key',
    'X-Session-Key',
    'X-SESSION-KEY',
]

# Database
import dj_database_url
import os

if os.environ.get('DATABASE_URL'):
    DATABASES = {
        'default': dj_database_url.config(default=os.environ.get('DATABASE_URL'))
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'kebede_butchery'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }

# Static files
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'

# Media files
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'

# Session settings for Vercel
SESSION_ENGINE = 'django.contrib.sessions.backends.db'  # Use database for Vercel
SESSION_COOKIE_SECURE = True  # HTTPS only
SESSION_COOKIE_HTTPONLY = False  # Allow JavaScript access
SESSION_COOKIE_SAMESITE = 'Lax'  # Cross-site requests
SESSION_COOKIE_DOMAIN = None  # Allow all domains
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_COOKIE_PATH = '/'
SESSION_SAVE_EVERY_REQUEST = False
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# CSRF settings for Vercel
CSRF_COOKIE_SECURE = True  # HTTPS only
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript access
CSRF_COOKIE_SAMESITE = 'Lax'  # Cross-site requests
CSRF_COOKIE_AGE = 31449600  # 1 year
CSRF_USE_SESSIONS = True

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/django_error.log'),
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Security middleware
if 'django.middleware.security.SecurityMiddleware' not in MIDDLEWARE:
    MIDDLEWARE.insert(0, 'django.middleware.security.SecurityMiddleware')
