"""
AcuRate - Custom Permission Classes

SECURITY: Centralized permission checking for consistent authorization
"""

from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class IsInstitutionAdmin(permissions.BasePermission):
    """
    Permission for Institution admins and staff.
    Allows access to Institution admins, staff, and superusers.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return (
            hasattr(request.user, 'role') and
            (
                request.user.role == User.Role.INSTITUTION or
                request.user.is_staff or
                request.user.is_superuser
            )
        )


class IsTeacher(permissions.BasePermission):
    """
    Permission for Teachers.
    Allows access to Teachers, staff, and superusers.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return (
            hasattr(request.user, 'role') and
            (
                request.user.role == User.Role.TEACHER or
                request.user.is_staff or
                request.user.is_superuser
            )
        )


class IsStudent(permissions.BasePermission):
    """
    Permission for Students.
    Allows access to Students, staff, and superusers.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return (
            hasattr(request.user, 'role') and
            (
                request.user.role == User.Role.STUDENT or
                request.user.is_staff or
                request.user.is_superuser
            )
        )


class IsSuperAdmin(permissions.BasePermission):
    """
    Permission for Super Admins only.
    Only allows access to superusers.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_superuser
        )


class IsInstitutionOrTeacher(permissions.BasePermission):
    """
    Permission for Institution admins or Teachers.
    Allows access to both Institution admins and Teachers, plus staff and superusers.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return (
            hasattr(request.user, 'role') and
            (
                request.user.role == User.Role.INSTITUTION or
                request.user.role == User.Role.TEACHER or
                request.user.is_staff or
                request.user.is_superuser
            )
        )


class IsTeacherOrInstitution(permissions.BasePermission):
    """
    Alias for IsInstitutionOrTeacher (same permission).
    """
    
    def has_permission(self, request, view):
        return IsInstitutionOrTeacher().has_permission(request, view)
