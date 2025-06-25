# backend/activity/urls.py
from django.urls import path
from .views import EmployeeActivityView

urlpatterns = [
    path('employee-activity/', EmployeeActivityView.as_view(), name='employee-activity'),
]
