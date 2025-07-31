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
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        print(f"[DEBUG] POST request received - User: {request.user.username}, Role: {request.user.role}")
        print(f"[DEBUG] User authenticated: {request.user.is_authenticated}")
        print(f"[DEBUG] Request data: {request.data}")
        return super().post(request, *args, **kwargs)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Table.objects.none()
        
        # Filter by user's branch
        if hasattr(user, 'branch') and user.branch:
            if user.role == 'waiter':
                # Waiters can see tables they created in their branch
                queryset = Table.objects.filter(created_by=user, branch=user.branch)
                print(f"[DEBUG] Filtering tables for waiter: {user.username} in branch: {user.branch.name}")
            elif user.role in ['manager', 'cashier', 'meat', 'bartender']:
                # Other roles can see all tables in their branch
                queryset = Table.objects.filter(branch=user.branch)
                print(f"[DEBUG] Filtering tables for {user.role}: {user.username} in branch: {user.branch.name}")
            else:
                # Other roles see only their own tables
                queryset = Table.objects.filter(created_by=user)
                print(f"[DEBUG] Filtering tables for {user.role}: {user.username}")
        elif user.is_superuser:
            # Superuser can see all tables
            queryset = Table.objects.all()
            print(f"[DEBUG] Superuser - showing all tables")
        else:
            # For users without branch, show only their own tables
            queryset = Table.objects.filter(created_by=user)
            print(f"[DEBUG] User without branch - showing only own tables")
        
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        print(f"[DEBUG] Table creation attempt - User: {user.username}, Role: {user.role}, Authenticated: {user.is_authenticated}")
        print(f"[DEBUG] User has role attribute: {hasattr(user, 'role')}")
        print(f"[DEBUG] User branch: {getattr(user, 'branch', None)}")
        
        if user.is_authenticated and hasattr(user, 'role') and user.role == 'waiter':
            branch = getattr(user, 'branch', None)
            if not branch:
                print(f"[DEBUG] Permission denied - no branch assigned")
                raise PermissionDenied('Waiter does not have a branch assigned.')
            print(f"[DEBUG] Creating table for waiter: {user.username} in branch: {branch.name}")
            serializer.save(created_by=user, branch=branch)
        else:
            print(f"[DEBUG] Permission denied - user role: {user.role}, expected: waiter")
            raise PermissionDenied('Only waiters can create tables.')

