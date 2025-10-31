"""
AcuRate - Django Admin Panel Customization

Professional, colorful admin interface with badges, inline editing,
and enhanced user experience for all models.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, ProgramOutcome, Course, CoursePO, 
    Enrollment, Assessment, StudentGrade, StudentPOAchievement
)


# =============================================================================
# ADMIN SITE CUSTOMIZATION
# =============================================================================

admin.site.site_header = "AcuRate Admin Panel"
admin.site.site_title = "AcuRate Admin"
admin.site.index_title = "Welcome to AcuRate Administration"


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


class StudentGradeInline(admin.TabularInline):
    """Inline for student grades"""
    model = StudentGrade
    extra = 0
    fields = ['student', 'score', 'feedback', 'graded_at']
    readonly_fields = ['graded_at']
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
    filter_horizontal = ['related_pos']
    date_hierarchy = 'due_date'
    
    inlines = [StudentGradeInline]
    
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
        ('Program Outcomes', {
            'fields': ('related_pos',),
            'description': 'Select program outcomes this assessment evaluates'
        }),
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
# AUTOCOMPLETE CONFIGURATION
# =============================================================================

# Enable autocomplete for better performance with large datasets
User.search_fields = ['username', 'email', 'student_id']
ProgramOutcome.search_fields = ['code', 'title']
Course.search_fields = ['code', 'name']
