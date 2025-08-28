# users/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, SessionLoginView, CurrentUserView, get_csrf, test_logout, simple_login
from .views import WaiterUnsettledTablesView
from .views import session_logout, emergency_login_test, create_user_emergency

# DRF router for CRUD operations

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', SessionLoginView.as_view(), name='session-login'),
    path('simple-login/', simple_login, name='simple-login'),
    path('logout/', session_logout, name='session-logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path("csrf/", get_csrf),
    path('test-logout/', test_logout),
    path('emergency-test/', emergency_login_test, name='emergency-test'),
    path('create-emergency/', create_user_emergency, name='create-emergency'),
    path('', include(router.urls)),
    path('waiters/unsettled-tables/', WaiterUnsettledTablesView.as_view(), name='waiter-unsettled-tables'),
]
