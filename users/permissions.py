from rest_framework import permissions


class IsManager(permissions.BasePermission):
    """
    Permission to allow only managers to access a view.
    """
    message = "Only managers can access this resource."
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_manager


class IsEmployee(permissions.BasePermission):
    """
    Permission to allow only employees to access a view.
    """
    message = "Only employees can access this resource."
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_employee


class IsTaskOwner(permissions.BasePermission):
    """
    Permission to allow only the task owner to modify their task.
    """
    message = "You can only modify your own tasks."
    
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsManagerOrTaskOwner(permissions.BasePermission):
    """
    Permission to allow managers or the task owner to access a task.
    """
    def has_object_permission(self, request, view, obj):
        # Check if user is a manager or the task owner
        return (request.user.is_manager or obj.user == request.user) 