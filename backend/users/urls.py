from django.urls import path
from .views import CustomTokenObtainPairView, UserListView

urlpatterns = [
    path('users/', UserListView.as_view(), name='user-list'),  # Lists all users
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),  # JWT login
]
