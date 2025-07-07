from django.urls import path
from .views import TableListCreateView

urlpatterns = [
    path('tables/', TableListCreateView.as_view(), name='table-list-create'),
] 