"""
AcuRate - Modular Views Package
This package contains all API views organized by functionality.
"""

# Authentication views
from .auth import (
    login_view,
    logout_view,
    register_view,
    forgot_password_view,
    forgot_username_view,
    current_user_view,
    create_teacher_view,
)

# Dashboard views
from .dashboards import (
    student_dashboard,
    teacher_dashboard,
    institution_dashboard,
)

# Super Admin views
from .super_admin import (
    super_admin_dashboard,
    super_admin_institutions,
    super_admin_activity_logs,
    create_institution,
    delete_institution,
    _get_time_ago,
)

# Analytics views
from .analytics import (
    course_analytics_overview,
    course_analytics_detail,
    analytics_departments,
    analytics_po_trends,
    analytics_performance_distribution,
    analytics_course_success,
    analytics_alerts,
    department_curriculum,
)

# Contact views
from .contact import (
    create_contact_request,
)

# Bulk operations views
from .bulk_operations import (
    bulk_import_students,
    bulk_export_grades,
    bulk_import_grades,
)

# File upload views
from .file_upload import (
    upload_profile_picture,
    upload_file,
)

# ViewSets
from .viewsets import (
    UserViewSet,
    DepartmentViewSet,
    ProgramOutcomeViewSet,
    LearningOutcomeViewSet,
    CourseViewSet,
    EnrollmentViewSet,
    AssessmentViewSet,
    StudentGradeViewSet,
    StudentPOAchievementViewSet,
    StudentLOAchievementViewSet,
    ContactRequestViewSet,
    AssessmentLOViewSet,
    LOPOViewSet,
)

__all__ = [
    # Auth
    'login_view',
    'logout_view',
    'register_view',
    'forgot_password_view',
    'forgot_username_view',
    'current_user_view',
    'create_teacher_view',
    # Dashboards
    'student_dashboard',
    'teacher_dashboard',
    'institution_dashboard',
    # Super Admin
    'super_admin_dashboard',
    'super_admin_institutions',
    'super_admin_activity_logs',
    'create_institution',
    'delete_institution',
    '_get_time_ago',
    # Analytics
    'course_analytics_overview',
    'course_analytics_detail',
    'analytics_departments',
    'analytics_po_trends',
    'analytics_performance_distribution',
    'analytics_course_success',
    'analytics_alerts',
    'department_curriculum',
    # Contact
    'create_contact_request',
    # Bulk Operations
    'bulk_import_students',
    'bulk_export_grades',
    'bulk_import_grades',
    # File Upload
    'upload_profile_picture',
    'upload_file',
    # ViewSets
    'UserViewSet',
    'DepartmentViewSet',
    'ProgramOutcomeViewSet',
    'LearningOutcomeViewSet',
    'CourseViewSet',
    'EnrollmentViewSet',
    'AssessmentViewSet',
    'StudentGradeViewSet',
    'StudentPOAchievementViewSet',
    'StudentLOAchievementViewSet',
    'ContactRequestViewSet',
    'AssessmentLOViewSet',
    'LOPOViewSet',
]
