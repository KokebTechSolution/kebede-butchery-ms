# users/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, SessionLoginView, SessionLogoutView, CurrentUserView, get_csrf
from .views import WaiterUnsettledTablesView

<<<<<<< HEAD
from .views import CustomTokenObtainPairView, UserViewSet, LoginView
from .views import WaiterUnsettledTablesView

# DRF router for CRUD operations
=======
>>>>>>> 93538555aea552d247ce892fe0eaffe5c45d9d56
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', SessionLoginView.as_view(), name='session-login'),
    path('logout/', SessionLogoutView.as_view(), name='session-logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path("csrf/", get_csrf),
    path('', include(router.urls)),
    path('waiters/unsettled-tables/', WaiterUnsettledTablesView.as_view(), name='waiter-unsettled-tables'),
]
