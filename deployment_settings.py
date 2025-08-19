"""
Deployment-specific settings for Kebede Butchery MS
This file contains environment-specific configuration that can be overridden
"""

import os

# Allowed hosts for production
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '.vercel.app',
    '.vercel.app',
    '.now.sh',
    '.onrender.com',
    '.herokuapp.com',
]

# CORS allowed origins for production
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://localhost:3000',
    'https://127.0.0.1:3000',
]

# Add your Vercel domain here when you have it
if os.environ.get('VERCEL_URL'):
    vercel_domain = f"https://{os.environ.get('VERCEL_URL')}"
    CORS_ALLOWED_ORIGINS.append(vercel_domain)
    ALLOWED_HOSTS.append(os.environ.get('VERCEL_URL'))

# CSRF trusted origins
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://localhost:3000',
    'https://127.0.0.1:3000',
]

# Add your Vercel domain here when you have it
if os.environ.get('VERCEL_URL'):
    vercel_domain = f"https://{os.environ.get('VERCEL_URL')}"
    CSRF_TRUSTED_ORIGINS.append(vercel_domain)

# Extra CSRF origins (if needed)
EXTRA_CSRF_ORIGINS = []

# Database configuration
DATABASE_CONFIG = {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': os.getenv('DB_NAME', 'kebede_butchery'),
    'USER': os.getenv('DB_USER', 'postgres'),
    'PASSWORD': os.getenv('DB_PASSWORD', ''),
    'HOST': os.getenv('DB_HOST', 'localhost'),
    'PORT': os.getenv('DB_PORT', '5432'),
}

# Redis configuration (if using channels)
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')

# AWS S3 configuration (if using S3 for media files)
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME', '')
AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')
AWS_S3_CUSTOM_DOMAIN = os.getenv('AWS_S3_CUSTOM_DOMAIN', '')
AWS_DEFAULT_ACL = None
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}
