from django.shortcuts import render
from rest_framework import generics
from .models import Table
from .serializers import TableSerializer
from rest_framework.exceptions import PermissionDenied

from rest_framework import viewsets
from .models import Branch
from .serializers import BranchSerializer
from rest_framework.permissions import IsAuthenticated

class BranchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]  # only logged-in users can access



class TableListCreateView(generics.ListCreateAPIView):
    serializer_class = TableSerializer


    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and hasattr(user, 'role') and user.role == 'waiter':
            return Table.objects.filter(created_by=user)
        return Table.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated and hasattr(user, 'role') and user.role == 'waiter':
            branch = getattr(user, 'branch', None)
            if not branch:
                raise PermissionDenied('Waiter does not have a branch assigned.')
            serializer.save(created_by=user, branch=branch)
        else:
            raise PermissionDenied('Only waiters can create tables.')

