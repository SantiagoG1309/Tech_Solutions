from rest_framework import permissions

class IsAdminOrDirector(permissions.BasePermission):
    """
    Allow access only to admin or director users.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type in ['admin', 'director']

class IsAdminOrDirectorOrReadOnly(permissions.BasePermission):
    """
    Allow read access to all authenticated users, but write access only to admin or director.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.user_type in ['admin', 'director']

class IsTicketOwnerOrStaff(permissions.BasePermission):
    """
    Object-level permission to only allow owners of a ticket or staff to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            if request.user.user_type in ['admin', 'director']:
                return True
            if request.user.user_type == 'employee':
                return obj.assigned_to == request.user
            return obj.created_by == request.user
        
        # Write permissions
        if request.user.user_type in ['admin', 'director']:
            return True
        if request.user.user_type == 'employee':
            return obj.assigned_to == request.user
        
        # Clients can only update their own tickets if they're not closed
        return (obj.created_by == request.user and obj.status != 'closed')

