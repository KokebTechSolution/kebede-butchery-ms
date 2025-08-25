"""
WSGI config for kebede_pos project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os
from django.core.wsgi import get_wsgi_application

# Use production settings if deployed
if os.environ.get('RENDER'):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings_production')
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings')

application = get_wsgi_application()
