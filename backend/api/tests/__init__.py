"""
AcuRate - Test Suite Package

This package contains all tests organized by category:
- base: BaseTestCase for common test setup
- models: Model validation tests
- api: API endpoint tests
- permissions: Role-based permission tests
- calculations: Calculation logic tests
- serializers: Serializer validation tests
- integration: End-to-end workflow tests
"""

# Import all test classes to make them discoverable by Django test runner
from .test_base import BaseTestCase
from .test_models import (
    UserModelTest,
    ProgramOutcomeModelTest,
    LearningOutcomeModelTest,
    CourseModelTest,
    AssessmentModelTest,
    StudentGradeModelTest,
    StudentPOAchievementModelTest,
    StudentLOAchievementModelTest,
)
from .test_api import (
    AuthenticationAPITest,
    ProgramOutcomeAPITest,
    LearningOutcomeAPITest,
    CourseAPITest,
    StudentGradeAPITest,
)
from .test_permissions import PermissionTest
from .test_calculations import CalculationTest
from .test_serializers import SerializerValidationTest
from .test_integration import IntegrationTest

__all__ = [
    'BaseTestCase',
    # Model tests
    'UserModelTest',
    'ProgramOutcomeModelTest',
    'LearningOutcomeModelTest',
    'CourseModelTest',
    'AssessmentModelTest',
    'StudentGradeModelTest',
    'StudentPOAchievementModelTest',
    'StudentLOAchievementModelTest',
    # API tests
    'AuthenticationAPITest',
    'ProgramOutcomeAPITest',
    'LearningOutcomeAPITest',
    'CourseAPITest',
    'StudentGradeAPITest',
    # Other tests
    'PermissionTest',
    'CalculationTest',
    'SerializerValidationTest',
    'IntegrationTest',
]


