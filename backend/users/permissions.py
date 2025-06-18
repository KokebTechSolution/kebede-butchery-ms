from rest_framework.permissions import BasePermission

class IsWaiter(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'waiter'
class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'manager'
class IsBartender(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'bartender'
class IsMeatCounter(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'meat'
class IsCashier(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'cashier'
class IsOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'owner'
class IsAuthenticated(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated