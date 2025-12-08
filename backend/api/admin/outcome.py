"""OUTCOME Admin Module"""

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
# PROGRAM OUTCOME ADMIN
# =============================================================================

@admin.register(ProgramOutcome)
class ProgramOutcomeAdmin(admin.ModelAdmin):
    """
    Program Outcome Admin with target percentage badges
    """
    
    def target_badge(self, obj):
        """Display target percentage with badge"""
        return format_html(
            '<span style="background-color: #10b981; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">Target: {}%</span>',
            obj.target_percentage
        )
    target_badge.short_description = 'Target'
    
    def status_badge(self, obj):
        """Display active status with badge"""
        if obj.is_active:
            return format_html(
                '<span style="background-color: #10b981; color: white; padding: 3px 10px; '
                'border-radius: 12px; font-size: 11px;">✓ Active</span>'
            )
        return format_html(
            '<span style="background-color: #ef4444; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px;">✗ Inactive</span>'
        )
    status_badge.short_description = 'Status'
    
    list_display = ['code', 'title', 'department', 'target_badge', 'status_badge', 'is_active', 'created_at']
    list_filter = ['department', 'is_active']
    search_fields = ['code', 'title', 'description']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'title', 'department')
        }),
        ('Description', {
            'fields': ('description',)
        }),
        ('Target & Status', {
            'fields': ('target_percentage', 'is_active')
        }),
    )


# =============================================================================
# LEARNING OUTCOME ADMIN
# =============================================================================

class LOPOInline(admin.TabularInline):
    """Inline for LO-PO mappings"""
    model = LOPO
    extra = 1
    fields = ['program_outcome', 'weight']
    autocomplete_fields = ['program_outcome']


@admin.register(LearningOutcome)
class LearningOutcomeAdmin(admin.ModelAdmin):
    """
    Learning Outcome Admin with course and target badges
    """
    
    def target_badge(self, obj):
        """Display target percentage with badge"""
        return format_html(
            '<span style="background-color: #10b981; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">Target: {}%</span>',
            obj.target_percentage
        )
    target_badge.short_description = 'Target'
    
    def status_badge(self, obj):
        """Display active status with badge"""
        if obj.is_active:
            return format_html(
                '<span style="background-color: #10b981; color: white; padding: 3px 10px; '
                'border-radius: 12px; font-size: 11px;">✓ Active</span>'
            )
        return format_html(
            '<span style="background-color: #ef4444; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px;">✗ Inactive</span>'
        )
    status_badge.short_description = 'Status'
    
    def course_display(self, obj):
        """Display course with badge"""
        return format_html(
            '<span style="background-color: #6366f1; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            obj.course.code
        )
    course_display.short_description = 'Course'
    
    list_display = ['code', 'title', 'course_display', 'target_badge', 'status_badge', 'is_active', 'created_at']
    list_filter = ['course__department', 'is_active', 'course']
    search_fields = ['code', 'title', 'description', 'course__code', 'course__name']
    autocomplete_fields = ['course']
    date_hierarchy = 'created_at'
    inlines = [LOPOInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('course', 'code', 'title')
        }),
        ('Description', {
            'fields': ('description',)
        }),
        ('Target & Status', {
            'fields': ('target_percentage', 'is_active')
        }),
    )
