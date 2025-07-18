# users/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, SessionLoginView, SessionLogoutView, CurrentUserView, get_csrf

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', SessionLoginView.as_view(), name='session-login'),
    path('logout/', SessionLogoutView.as_view(), name='session-logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path("csrf/", get_csrf),
    path('', include(router.urls)),
]
