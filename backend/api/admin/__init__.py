"""
AcuRate - Django Admin Panel Customization

Professional, colorful admin interface with badges, inline editing,
and enhanced user experience for all models.
"""

from django.contrib import admin
from ..models import User, ProgramOutcome, LearningOutcome, Course

# =============================================================================
# ADMIN SITE CUSTOMIZATION
# =============================================================================

admin.site.site_header = "AcuRate Admin Panel"
admin.site.site_title = "AcuRate Admin"
admin.site.index_title = "Welcome to AcuRate Administration"

# =============================================================================
# IMPORT ALL ADMIN CLASSES
# =============================================================================

# Import all admin classes to register them
from .user import UserAdmin
from .outcome import ProgramOutcomeAdmin, LearningOutcomeAdmin
from .course import CourseAdmin, CoursePOAdmin, EnrollmentAdmin
from .assessment import AssessmentAdmin, StudentGradeAdmin
from .achievement import StudentPOAchievementAdmin, StudentLOAchievementAdmin
from .contact import ContactRequestAdmin
from .activity import ActivityLogAdmin

# =============================================================================
# AUTOCOMPLETE CONFIGURATION
# =============================================================================

# Enable autocomplete for better performance with large datasets
User.search_fields = ['username', 'email', 'student_id']
ProgramOutcome.search_fields = ['code', 'title']
LearningOutcome.search_fields = ['code', 'title', 'course__code']
Course.search_fields = ['code', 'name']

__all__ = [
    'UserAdmin',
    'ProgramOutcomeAdmin',
    'LearningOutcomeAdmin',
    'CourseAdmin',
    'CoursePOAdmin',
    'EnrollmentAdmin',
    'AssessmentAdmin',
    'StudentGradeAdmin',
    'StudentPOAchievementAdmin',
    'StudentLOAchievementAdmin',
    'ContactRequestAdmin',
    'ActivityLogAdmin',
]
