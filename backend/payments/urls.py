# payments/urls.py
from django.urls import path
from .views import transaction_list_view

urlpatterns = [
    path('transactions/', transaction_list_view, name='transaction-list'),
]
