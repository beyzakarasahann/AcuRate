"""USER Admin Module"""

from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from ..models import (
    User, ProgramOutcome, Course, CoursePO, 
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    ContactRequest, LearningOutcome, StudentLOAchievement, ActivityLog,
    AssessmentLO, LOPO
)


# =============================================================================
# USER ADMIN
# =============================================================================

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Enhanced User Admin with role badges and better organization
    """
    
    def role_badge(self, obj):
        """Display role with colored badge"""
        colors = {
            'STUDENT': '#3b82f6',    # Blue
            'TEACHER': '#10b981',    # Green
            'INSTITUTION': '#8b5cf6' # Purple
        }
        color = colors.get(obj.role, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_role_display()
        )
    role_badge.short_description = 'Role'
    
    list_display = ['username', 'email', 'role_badge', 'department', 'student_id', 'is_active', 'date_joined']
    list_filter = ['role', 'department', 'is_active', 'year_of_study']
    search_fields = ['username', 'email', 'student_id', 'first_name', 'last_name']
    list_editable = ['is_active']
    
    fieldsets = (
        ('Authentication', {
            'fields': ('username', 'password')
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'profile_picture')
        }),
        ('Role & Profile', {
            'fields': ('role', 'department'),
            'description': 'User role and department information'
        }),
        ('Student Information', {
            'fields': ('student_id', 'year_of_study'),
            'classes': ('collapse',),
            'description': 'Only applicable for students'
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'department'),
        }),
    )
