"""
AcuRate - Modular Serializers Package
This package contains all API serializers organized by functionality.
"""

# User serializers
from .user import (
    UserSerializer,
    UserDetailSerializer,
    UserCreateSerializer,
    TeacherCreateSerializer,
    InstitutionCreateSerializer,
    LoginSerializer,
    generate_temp_password,
)

# Department serializers
from .department import (
    DepartmentSerializer,
)

# Outcome serializers
from .outcome import (
    ProgramOutcomeSerializer,
    ProgramOutcomeStatsSerializer,
    LearningOutcomeSerializer,
)

# Course serializers
from .course import (
    CoursePOSerializer,
    CourseSerializer,
    CourseDetailSerializer,
    EnrollmentSerializer,
)

# Assessment serializers
from .assessment import (
    AssessmentSerializer,
    StudentGradeSerializer,
    StudentGradeDetailSerializer,
    AssessmentLOSerializer,
    LOPOSerializer,
)

# Achievement serializers
from .achievement import (
    StudentPOAchievementSerializer,
    StudentPOAchievementDetailSerializer,
    StudentLOAchievementSerializer,
)

# Dashboard serializers
from .dashboard import (
    StudentDashboardSerializer,
    TeacherDashboardSerializer,
)

# Contact serializers
from .contact import (
    ContactRequestSerializer,
    ContactRequestCreateSerializer,
    InstitutionDashboardSerializer,
)

__all__ = [
    # User
    'UserSerializer',
    'UserDetailSerializer',
    'UserCreateSerializer',
    'TeacherCreateSerializer',
    'InstitutionCreateSerializer',
    'LoginSerializer',
    'generate_temp_password',
    # Department
    'DepartmentSerializer',
    # Outcomes
    'ProgramOutcomeSerializer',
    'ProgramOutcomeStatsSerializer',
    'LearningOutcomeSerializer',
    # Courses
    'CoursePOSerializer',
    'CourseSerializer',
    'CourseDetailSerializer',
    'EnrollmentSerializer',
    # Assessments
    'AssessmentSerializer',
    'StudentGradeSerializer',
    'StudentGradeDetailSerializer',
    'AssessmentLOSerializer',
    'LOPOSerializer',
    # Achievements
    'StudentPOAchievementSerializer',
    'StudentPOAchievementDetailSerializer',
    'StudentLOAchievementSerializer',
    # Dashboards
    'StudentDashboardSerializer',
    'TeacherDashboardSerializer',
    'InstitutionDashboardSerializer',
    # Contact
    'ContactRequestSerializer',
    'ContactRequestCreateSerializer',
]
