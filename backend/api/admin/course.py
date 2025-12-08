"""COURSE Admin Module"""

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

class CoursePOInline(admin.TabularInline):
    """Inline for Course-PO mappings"""
    model = CoursePO
    extra = 1
    fields = ['program_outcome', 'weight']
    autocomplete_fields = ['program_outcome']


class EnrollmentInline(admin.TabularInline):
    """Inline for enrollments"""
    model = Enrollment
    extra = 0
    fields = ['student', 'is_active', 'final_grade', 'enrolled_at']
    readonly_fields = ['enrolled_at']
    autocomplete_fields = ['student']


# =============================================================================
# COURSE ADMIN
# =============================================================================

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """
    Course Admin with semester badges and inlines
    """
    
    def semester_display(self, obj):
        """Display semester with colored badge"""
        colors = {
            1: '#f59e0b',  # Fall - Orange
            2: '#3b82f6',  # Spring - Blue
            3: '#10b981'   # Summer - Green
        }
        color = colors.get(obj.semester, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_semester_display()
        )
    semester_display.short_description = 'Semester'
    
    def credits_badge(self, obj):
        """Display credits with badge"""
        return format_html(
            '<span style="background-color: #6366f1; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{} Credits</span>',
            obj.credits
        )
    credits_badge.short_description = 'Credits'
    
    def enrolled_count(self, obj):
        """Display number of enrolled students"""
        count = obj.enrollments.filter(is_active=True).count()
        return format_html(
            '<span style="background-color: #8b5cf6; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px;">{} Students</span>',
            count
        )
    enrolled_count.short_description = 'Enrolled'
    
    list_display = ['code', 'name', 'department', 'teacher', 'semester_display', 
                    'credits_badge', 'academic_year', 'enrolled_count']
    list_filter = ['department', 'semester', 'academic_year', 'teacher']
    search_fields = ['code', 'name', 'description']
    autocomplete_fields = ['teacher']
    date_hierarchy = 'created_at'
    
    inlines = [CoursePOInline, EnrollmentInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'department', 'teacher')
        }),
        ('Description', {
            'fields': ('description',)
        }),
        ('Academic Details', {
            'fields': ('credits', 'semester', 'academic_year')
        }),
    )


# =============================================================================
# COURSE-PO MAPPING ADMIN
# =============================================================================

@admin.register(CoursePO)
class CoursePOAdmin(admin.ModelAdmin):
    """
    Course-PO Mapping Admin
    """
    
    def weight_badge(self, obj):
        """Display weight with badge"""
        return format_html(
            '<span style="background-color: #14b8a6; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">×{}</span>',
            obj.weight
        )
    weight_badge.short_description = 'Weight'
    
    list_display = ['course', 'program_outcome', 'weight_badge', 'created_at']
    list_filter = ['course__department', 'program_outcome']
    search_fields = ['course__code', 'course__name', 'program_outcome__code']
    autocomplete_fields = ['course', 'program_outcome']
    date_hierarchy = 'created_at'


# =============================================================================
# ENROLLMENT ADMIN
# =============================================================================

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    """
    Enrollment Admin with grade display
    """
    
    def status_badge(self, obj):
        """Display enrollment status"""
        if obj.is_active:
            return format_html(
                '<span style="background-color: #10b981; color: white; padding: 3px 10px; '
                'border-radius: 12px; font-size: 11px;">✓ Active</span>'
            )
        return format_html(
            '<span style="background-color: #6b7280; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px;">✗ Inactive</span>'
        )
    status_badge.short_description = 'Status'
    
    def grade_display(self, obj):
        """Display final grade with color coding"""
        if obj.final_grade is None:
            return format_html(
                '<span style="background-color: #9ca3af; color: white; padding: 3px 10px; '
                'border-radius: 12px; font-size: 11px;">Not Graded</span>'
            )
        
        # Color based on grade
        if obj.final_grade >= 90:
            color = '#10b981'  # Green
        elif obj.final_grade >= 70:
            color = '#3b82f6'  # Blue
        elif obj.final_grade >= 50:
            color = '#f59e0b'  # Orange
        else:
            color = '#ef4444'  # Red
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}%</span>',
            color, obj.final_grade
        )
    grade_display.short_description = 'Final Grade'
    
    list_display = ['student', 'course', 'status_badge', 'grade_display', 'enrolled_at']
    list_filter = ['is_active', 'course__department', 'enrolled_at']
    search_fields = ['student__username', 'student__student_id', 'course__code', 'course__name']
    autocomplete_fields = ['student', 'course']
    date_hierarchy = 'enrolled_at'
