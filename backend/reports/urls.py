from django.urls import path
from .views import BranchDashboardView

urlpatterns = [
    path('branch-dashboard/', BranchDashboardView.as_view()),
]