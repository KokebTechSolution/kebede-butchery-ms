"""
ASGI config for kebede_pos project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
import kebede_pos.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kebede_pos.settings_prod')
django.setup()

application = ProtocolTypeRouter({
  "http": get_asgi_application(),
  "websocket": AuthMiddlewareStack(
        URLRouter(
            kebede_pos.routing.websocket_urlpatterns
        )
    ),
})
