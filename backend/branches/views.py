from django.shortcuts import render

# inventory/views.py

from rest_framework import viewsets
from .models import Branch
from .serializers import BranchSerializer
from rest_framework.permissions import IsAuthenticated

class BranchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]  # only logged-in users can access

