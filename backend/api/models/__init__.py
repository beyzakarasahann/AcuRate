"""
AcuRate - Modular Models Package
This package contains all database models organized by functionality.
"""

# User models
from .user import User, PasswordResetToken, PasswordHistory

# Department models
from .department import Department

# Outcome models
from .outcome import ProgramOutcome

# Course models
from .course import Course, CoursePO, Enrollment

# Learning Outcome models
from .learning_outcome import LearningOutcome, LOPO

# Assessment models
from .assessment import Assessment, AssessmentLO, StudentGrade

# Achievement models
from .achievement import StudentPOAchievement, StudentLOAchievement

# Miscellaneous models
from .misc import ContactRequest, ActivityLog

__all__ = [
    # User
    'User',
    'PasswordResetToken',
    'PasswordHistory',
    # Department
    'Department',
    # Outcomes
    'ProgramOutcome',
    # Courses
    'Course',
    'CoursePO',
    'Enrollment',
    # Learning Outcomes
    'LearningOutcome',
    'LOPO',
    # Assessments
    'Assessment',
    'AssessmentLO',
    'StudentGrade',
    # Achievements
    'StudentPOAchievement',
    'StudentLOAchievement',
    # Miscellaneous
    'ContactRequest',
    'ActivityLog',
]


