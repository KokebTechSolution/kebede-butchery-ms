from django.urls import path
from . import views

urlpatterns = [
  
    path('items/', views.ItemListView.as_view(), name='item-list'),
]
