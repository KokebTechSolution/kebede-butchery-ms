from django.urls import path
from .views import BranchDashboardView, ReportDashboardView, FoodDashboardReportView

urlpatterns = [
    path('branch-dashboard/', BranchDashboardView.as_view()),
    path('dashboard-report/', ReportDashboardView.as_view()),
    path('food-dashboard-report/', FoodDashboardReportView.as_view()),
]