"""ACTIVITY Admin Module"""

from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from ..models import (
    User, ProgramOutcome, Course, CoursePO, 
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    ContactRequest, LearningOutcome, StudentLOAchievement, ActivityLog,
    AssessmentLO, LOPO
)


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    """Admin interface for Activity Logs"""
    
    def action_display(self, obj):
        """Display action type with color"""
        colors = {
            'user_created': '#10b981',
            'user_updated': '#3b82f6',
            'user_deleted': '#ef4444',
            'course_created': '#10b981',
            'course_updated': '#3b82f6',
            'course_deleted': '#ef4444',
            'enrollment_created': '#8b5cf6',
            'enrollment_updated': '#3b82f6',
            'assessment_created': '#f59e0b',
            'assessment_updated': '#3b82f6',
            'grade_assigned': '#10b981',
            'grade_updated': '#3b82f6',
            'login': '#6366f1',
        }
        color = colors.get(obj.action_type, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 12px; '
            'border-radius: 8px; font-size: 11px; font-weight: 500;">{}</span>',
            color, obj.get_action_type_display()
        )
    action_display.short_description = 'Action'
    
    def user_info(self, obj):
        """Display user info"""
        if obj.user:
            return format_html(
                '<strong>{}</strong><br><span style="color: #6b7280; font-size: 11px;">{}</span>',
                obj.user.get_full_name() or obj.user.username,
                obj.user.get_role_display()
            )
        return '-'
    user_info.short_description = 'User'
    
    def institution_info(self, obj):
        """Display institution info"""
        if obj.institution:
            return format_html(
                '<strong>{}</strong>',
                obj.institution.get_full_name() or obj.institution.username
            )
        return '-'
    institution_info.short_description = 'Institution'
    
    list_display = ['action_display', 'description', 'user_info', 'institution_info', 
                    'department', 'created_at']
    list_filter = ['action_type', 'institution', 'department', 'created_at']
    search_fields = ['description', 'user__username', 'user__email', 
                     'institution__username', 'institution__email']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    fieldsets = (
        ('Action', {
            'fields': ('action_type', 'description')
        }),
        ('Context', {
            'fields': ('user', 'institution', 'department')
        }),
        ('Related Object', {
            'fields': ('related_object_type', 'related_object_id', 'metadata')
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )
