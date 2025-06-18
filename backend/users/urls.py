from django.urls import path
from .views import LoginView  # Adjust imports as needed

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    # Add other auth routes here
]
