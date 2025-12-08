"""ACHIEVEMENT Admin Module"""

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
# STUDENT PO ACHIEVEMENT ADMIN
# =============================================================================

@admin.register(StudentPOAchievement)
class StudentPOAchievementAdmin(admin.ModelAdmin):
    """
    Student PO Achievement Admin with progress tracking
    """
    
    def current_percentage_display(self, obj):
        """Display current percentage with color coding"""
        percentage = obj.current_percentage
        
        if percentage >= obj.program_outcome.target_percentage:
            color = '#10b981'  # Green
            icon = '🏆'
        elif percentage >= obj.program_outcome.target_percentage - 10:
            color = '#3b82f6'  # Blue
            icon = '↗'
        elif percentage >= 50:
            color = '#f59e0b'  # Orange
            icon = '⚠'
        else:
            color = '#ef4444'  # Red
            icon = '↓'
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{} {:.1f}%</span>',
            color, icon, percentage
        )
    current_percentage_display.short_description = 'Current'
    
    def target_status(self, obj):
        """Display target achievement status"""
        if obj.is_target_met:
            return format_html(
                '<span style="background-color: #10b981; color: white; padding: 3px 10px; '
                'border-radius: 12px; font-size: 11px; font-weight: bold;">✓ Target Met</span>'
            )
        return format_html(
            '<span style="background-color: #ef4444; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">✗ Below Target (-{:.1f}%)</span>',
            abs(obj.gap_to_target)
        )
    target_status.short_description = 'Target Status'
    
    def completion_display(self, obj):
        """Display completion rate"""
        return format_html(
            '<span style="background-color: #6366f1; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px;">{} / {} ({:.0f}%)</span>',
            obj.completed_assessments, obj.total_assessments, obj.completion_rate
        )
    completion_display.short_description = 'Completion'
    
    list_display = ['student', 'program_outcome', 'current_percentage_display', 
                    'target_status', 'completion_display', 'last_calculated']
    list_filter = ['program_outcome', 'student__department', 'last_calculated']
    search_fields = ['student__username', 'student__student_id', 'program_outcome__code']
    autocomplete_fields = ['student', 'program_outcome']
    date_hierarchy = 'last_calculated'
    readonly_fields = ['last_calculated']
    
    fieldsets = (
        ('Student & PO', {
            'fields': ('student', 'program_outcome')
        }),
        ('Achievement', {
            'fields': ('current_percentage',)
        }),
        ('Progress', {
            'fields': ('total_assessments', 'completed_assessments', 'last_calculated')
        }),
    )


# =============================================================================
# STUDENT LO ACHIEVEMENT ADMIN
# =============================================================================

@admin.register(StudentLOAchievement)
class StudentLOAchievementAdmin(admin.ModelAdmin):
    """
    Student LO Achievement Admin with progress tracking and badges
    """
    
    def current_percentage_display(self, obj):
        """Display current percentage with color coding"""
        percentage = obj.current_percentage
        
        if percentage >= obj.learning_outcome.target_percentage:
            color = '#10b981'  # Green
            icon = '🏆'
        elif percentage >= obj.learning_outcome.target_percentage - 10:
            color = '#3b82f6'  # Blue
            icon = '↗'
        elif percentage >= 50:
            color = '#f59e0b'  # Orange
            icon = '⚠'
        else:
            color = '#ef4444'  # Red
            icon = '↓'
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{} {:.1f}%</span>',
            color, icon, percentage
        )
    current_percentage_display.short_description = 'Current'
    
    def target_status(self, obj):
        """Display target achievement status"""
        if obj.is_target_met:
            return format_html(
                '<span style="background-color: #10b981; color: white; padding: 3px 10px; '
                'border-radius: 12px; font-size: 11px; font-weight: bold;">✓ Target Met</span>'
            )
        return format_html(
            '<span style="background-color: #ef4444; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">✗ Below Target (-{:.1f}%)</span>',
            abs(obj.gap_to_target)
        )
    target_status.short_description = 'Target Status'
    
    def completion_display(self, obj):
        """Display completion rate"""
        return format_html(
            '<span style="background-color: #6366f1; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px;">{} / {} ({:.0f}%)</span>',
            obj.completed_assessments, obj.total_assessments, obj.completion_rate
        )
    completion_display.short_description = 'Completion'
    
    def lo_info(self, obj):
        """Display LO info"""
        return format_html(
            '<span style="background-color: #8b5cf6; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px;">{} - {}</span>',
            obj.learning_outcome.course.code, obj.learning_outcome.code
        )
    lo_info.short_description = 'Learning Outcome'
    
    list_display = ['student', 'lo_info', 'current_percentage_display', 
                    'target_status', 'completion_display', 'last_calculated']
    list_filter = ['learning_outcome__course', 'student__department', 'last_calculated']
    search_fields = ['student__username', 'student__student_id', 
                     'learning_outcome__code', 'learning_outcome__course__code']
    autocomplete_fields = ['student', 'learning_outcome']
    date_hierarchy = 'last_calculated'
    readonly_fields = ['last_calculated']
    
    fieldsets = (
        ('Student & LO', {
            'fields': ('student', 'learning_outcome')
        }),
        ('Achievement', {
            'fields': ('current_percentage',)
        }),
        ('Progress', {
            'fields': ('total_assessments', 'completed_assessments', 'last_calculated')
        }),
    )
