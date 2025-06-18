from rest_framework.permissions import BasePermission

class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name='manager').exists()

class IsWaiter(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name='waiter').exists()