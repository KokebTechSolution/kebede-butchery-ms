from django.urls import path
from .views import OwnerDashboardView, BranchPerformanceView, StaffPerformanceView, BranchesListView

urlpatterns = [
    path('dashboard/', OwnerDashboardView.as_view(), name='owner-dashboard'),
    path('branch-performance/', BranchPerformanceView.as_view(), name='branch-performance'),
    path('staff-performance/', StaffPerformanceView.as_view(), name='staff-performance'),
    path('branches/', BranchesListView.as_view(), name='branches-list'),
] 