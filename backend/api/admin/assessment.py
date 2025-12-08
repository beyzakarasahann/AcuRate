"""ASSESSMENT Admin Module"""

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
# INLINE MODELS
# =============================================================================

class StudentGradeInline(admin.TabularInline):
    """Inline for student grades"""
    model = StudentGrade
    extra = 0
    fields = ['student', 'score', 'feedback', 'graded_at']
    readonly_fields = ['graded_at']
    autocomplete_fields = ['student']


class AssessmentLOInline(admin.TabularInline):
    """Inline for Assessment-LO mappings"""
    model = AssessmentLO
    extra = 1
    fields = ['learning_outcome', 'weight']
    autocomplete_fields = ['learning_outcome']


# =============================================================================
# ASSESSMENT ADMIN
# =============================================================================

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    """
    Assessment Admin with type badges and grade inlines
    """
    
    def type_badge(self, obj):
        """Display assessment type with colored badge"""
        colors = {
            'MIDTERM': '#ef4444',      # Red
            'FINAL': '#dc2626',        # Dark Red
            'QUIZ': '#3b82f6',         # Blue
            'HOMEWORK': '#10b981',     # Green
            'PROJECT': '#8b5cf6',      # Purple
            'LAB': '#14b8a6',          # Teal
            'PRESENTATION': '#f59e0b', # Orange
            'OTHER': '#6b7280'         # Gray
        }
        color = colors.get(obj.assessment_type, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_assessment_type_display()
        )
    type_badge.short_description = 'Type'
    
    def weight_display(self, obj):
        """Display weight percentage"""
        return format_html(
            '<span style="background-color: #6366f1; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}%</span>',
            obj.weight
        )
    weight_display.short_description = 'Weight'
    
    def max_score_display(self, obj):
        """Display max score"""
        return format_html(
            '<span style="background-color: #14b8a6; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px;">Max: {}</span>',
            obj.max_score
        )
    max_score_display.short_description = 'Max Score'
    
    list_display = ['title', 'course', 'type_badge', 'weight_display', 
                    'max_score_display', 'due_date', 'is_active']
    list_filter = ['assessment_type', 'is_active', 'course__department', 'due_date']
    search_fields = ['title', 'course__code', 'course__name', 'description']
    list_editable = ['is_active']
    autocomplete_fields = ['course']
    # NOTE: related_pos removed - POs are accessed through LO → PO path (via AssessmentLO and LOPO)
    date_hierarchy = 'due_date'
    
    inlines = [StudentGradeInline, AssessmentLOInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('course', 'title', 'assessment_type')
        }),
        ('Description', {
            'fields': ('description',)
        }),
        ('Grading Details', {
            'fields': ('weight', 'max_score')
        }),
        # Learning Outcomes are managed via AssessmentLO inline (through model)
        # Program Outcomes are accessed through LO → PO path (via LOPO)
        ('Schedule & Status', {
            'fields': ('due_date', 'is_active')
        }),
    )


# =============================================================================
# STUDENT GRADE ADMIN
# =============================================================================

@admin.register(StudentGrade)
class StudentGradeAdmin(admin.ModelAdmin):
    """
    Student Grade Admin with percentage and score display
    """
    
    def score_display(self, obj):
        """Display score with max score"""
        return format_html(
            '<span style="background-color: #6366f1; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{} / {}</span>',
            obj.score, obj.assessment.max_score
        )
    score_display.short_description = 'Score'
    
    def percentage_display(self, obj):
        """Display percentage with color coding"""
        percentage = obj.percentage
        
        # Color based on percentage
        if percentage >= 90:
            color = '#10b981'  # Green
            icon = '🏆'
        elif percentage >= 70:
            color = '#3b82f6'  # Blue
            icon = '✓'
        elif percentage >= 50:
            color = '#f59e0b'  # Orange
            icon = '⚠'
        else:
            color = '#ef4444'  # Red
            icon = '✗'
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{} {:.1f}%</span>',
            color, icon, percentage
        )
    percentage_display.short_description = 'Percentage'
    
    def contribution_display(self, obj):
        """Display weighted contribution"""
        return format_html(
            '<span style="background-color: #8b5cf6; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px;">+{:.2f}%</span>',
            obj.weighted_contribution
        )
    contribution_display.short_description = 'Contribution'
    
    list_display = ['student', 'assessment', 'score_display', 'percentage_display', 
                    'contribution_display', 'graded_at']
    list_filter = ['assessment__course__department', 'assessment__assessment_type', 'graded_at']
    search_fields = ['student__username', 'student__student_id', 
                     'assessment__title', 'assessment__course__code']
    autocomplete_fields = ['student', 'assessment']
    date_hierarchy = 'graded_at'
    
    fieldsets = (
        ('Student & Assessment', {
            'fields': ('student', 'assessment')
        }),
        ('Grade', {
            'fields': ('score',),
            'description': f'Maximum score is determined by the assessment'
        }),
        ('Feedback', {
            'fields': ('feedback',),
            'classes': ('collapse',)
        }),
    )
