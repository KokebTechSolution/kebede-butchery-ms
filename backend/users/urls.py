# users/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, SessionLoginView, CurrentUserView, get_csrf, test_logout, DebugAuthView, TestSessionView, TestLoginView, CORSTestView, HealthCheckView, CSRFDebugView
from .views import WaiterUnsettledTablesView
from .views import session_logout

# DRF router for CRUD operations

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', SessionLoginView.as_view(), name='session-login'),
    path('test-login/', TestLoginView.as_view(), name='test-login'),
    path('cors-test/', CORSTestView.as_view(), name='cors-test'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('csrf-debug/', CSRFDebugView.as_view(), name='csrf-debug'),
    path('logout/', session_logout, name='session-logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('debug-auth/', DebugAuthView.as_view(), name='debug-auth'),
    path('test-session/', TestSessionView.as_view(), name='test-session'),
    path("csrf/", get_csrf),
    path('test-logout/', test_logout),
    path('', include(router.urls)),
    path('waiters/unsettled-tables/', WaiterUnsettledTablesView.as_view(), name='waiter-unsettled-tables'),
]
