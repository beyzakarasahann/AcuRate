"""CONTACT Admin Module"""

from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from ..models import (
    User, ProgramOutcome, Course, CoursePO, 
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    ContactRequest, LearningOutcome, StudentLOAchievement, ActivityLog,
    AssessmentLO, LOPO
)


@admin.register(ContactRequest)
class ContactRequestAdmin(admin.ModelAdmin):
    """
    Contact Request Admin with status badges and filtering
    """
    
    def status_badge(self, obj):
        """Display status with colored badge"""
        colors = {
            'pending': '#f59e0b',        # Orange
            'contacted': '#3b82f6',      # Blue
            'demo_scheduled': '#8b5cf6', # Purple
            'completed': '#10b981',      # Green
            'archived': '#6b7280'         # Gray
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def institution_type_badge(self, obj):
        """Display institution type with badge"""
        return format_html(
            '<span style="background-color: #6366f1; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px;">{}</span>',
            obj.get_institution_type_display()
        )
    institution_type_badge.short_description = 'Type'
    
    def request_type_badge(self, obj):
        """Display request type with badge"""
        return format_html(
            '<span style="background-color: #14b8a6; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px;">{}</span>',
            obj.get_request_type_display()
        )
    request_type_badge.short_description = 'Request'
    
    list_display = ['institution_name', 'institution_type_badge', 'contact_name', 
                    'contact_email', 'request_type_badge', 'status', 'status_badge', 'created_at']
    list_filter = ['status', 'institution_type', 'request_type', 'created_at']
    search_fields = ['institution_name', 'contact_name', 'contact_email', 'contact_phone', 'message']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    list_editable = ['status']
    
    fieldsets = (
        ('Institution Details', {
            'fields': ('institution_name', 'institution_type')
        }),
        ('Contact Person', {
            'fields': ('contact_name', 'contact_email', 'contact_phone')
        }),
        ('Request Details', {
            'fields': ('request_type', 'message')
        }),
        ('Status & Notes', {
            'fields': ('status', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make status editable only for staff"""
        if obj and not request.user.is_staff:
            return ['status', 'notes', 'created_at', 'updated_at']
        return ['created_at', 'updated_at']
