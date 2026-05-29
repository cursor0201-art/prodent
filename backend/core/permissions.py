from rest_framework import permissions

class IsDoctorOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow doctors or admins to access certain views.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        return request.user.role in ['DOCTOR', 'ADMIN', 'SUPER_ADMIN']
