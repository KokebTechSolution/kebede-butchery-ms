from django.urls import path
from .views import OwnerDashboardView, BranchPerformanceView, StaffPerformanceView

urlpatterns = [
    path('dashboard/', OwnerDashboardView.as_view(), name='owner-dashboard'),
    path('branch-performance/', BranchPerformanceView.as_view(), name='branch-performance'),
    path('staff-performance/', StaffPerformanceView.as_view(), name='staff-performance'),
] 