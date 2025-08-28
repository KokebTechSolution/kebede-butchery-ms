from rest_framework.permissions import BasePermission

class IsWaiter(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'waiter'
class IsManager(BasePermission):
    def has_permission(self, request, view):
        print(f"[DEBUG] IsManager permission check - User: {request.user.username}, Role: {getattr(request.user, 'role', 'None')}, Authenticated: {request.user.is_authenticated}")
        result = request.user.role == 'manager'
        print(f"[DEBUG] IsManager permission result: {result}")
        return result
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