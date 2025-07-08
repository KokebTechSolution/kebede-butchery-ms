from django.shortcuts import render
from rest_framework import generics
from .models import Table
from .serializers import TableSerializer

<<<<<<< HEAD
# inventory/views.py

from rest_framework import viewsets
from .models import Branch
from .serializers import BranchSerializer
from rest_framework.permissions import IsAuthenticated

class BranchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]  # only logged-in users can access

=======
# Create your views here.

class TableListCreateView(generics.ListCreateAPIView):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
>>>>>>> b8091a2069fb7237cfe0af3fe8ea54b747de83f7
