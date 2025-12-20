"""
Pytest configuration and fixtures for AcuRate tests.

This module provides shared fixtures for all tests.
"""

import pytest
import uuid
from decimal import Decimal
from django.utils import timezone
from rest_framework.test import APIClient

from api.models import (
    User, Department, ProgramOutcome, Course, CoursePO,
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    LearningOutcome, StudentLOAchievement
)


# =============================================================================
# PYTEST FIXTURES
# =============================================================================

@pytest.fixture
def api_client():
    """APIClient fixture for making API requests"""
    return APIClient()


@pytest.fixture
def unique_id():
    """Generate a unique ID for test data"""
    return str(uuid.uuid4())[:8]


@pytest.fixture
def department(db, unique_id):
    """Create a test department"""
    department, _ = Department.objects.get_or_create(
        name='Computer Science',
        defaults={
            'code': 'CS',
            'description': 'Computer Science Department'
        }
    )
    return department


@pytest.fixture
def student_user(db, unique_id, department):
    """Create a test student user"""
    return User.objects.create_user(
        username=f'test_student_{unique_id}',
        email=f'student_{unique_id}@test.com',
        password='testpass123',
        role=User.Role.STUDENT,
        student_id=f'2024{unique_id[:3]}',
        department='Computer Science',
        year_of_study=2,
        first_name='Test',
        last_name='Student'
    )


@pytest.fixture
def teacher_user(db, unique_id, department):
    """Create a test teacher user"""
    return User.objects.create_user(
        username=f'test_teacher_{unique_id}',
        email=f'teacher_{unique_id}@test.com',
        password='testpass123',
        role=User.Role.TEACHER,
        department='Computer Science',
        first_name='Test',
        last_name='Teacher'
    )


@pytest.fixture
def institution_user(db, unique_id, department):
    """Create a test institution user"""
    return User.objects.create_user(
        username=f'test_institution_{unique_id}',
        email=f'institution_{unique_id}@test.com',
        password='testpass123',
        role=User.Role.INSTITUTION,
        department='Computer Science',
        first_name='Test',
        last_name='Institution'
    )


@pytest.fixture
def program_outcome_1(db, department):
    """Create first test Program Outcome"""
    po, _ = ProgramOutcome.objects.get_or_create(
        code='PO1',
        defaults={
            'title': 'Engineering Knowledge',
            'description': 'Apply knowledge of mathematics, science, and engineering',
            'department': 'Computer Science',
            'target_percentage': Decimal('70.00')
        }
    )
    return po


@pytest.fixture
def program_outcome_2(db, department):
    """Create second test Program Outcome"""
    po, _ = ProgramOutcome.objects.get_or_create(
        code='PO2',
        defaults={
            'title': 'Problem Analysis',
            'description': 'Identify, formulate, and analyze complex engineering problems',
            'department': 'Computer Science',
            'target_percentage': Decimal('75.00')
        }
    )
    return po


@pytest.fixture
def course(db, unique_id, teacher_user, program_outcome_1):
    """Create a test course"""
    course_code = f'CSE301_{unique_id[:4]}'
    course, _ = Course.objects.get_or_create(
        code=course_code,
        academic_year='2024-2025',
        defaults={
            'name': 'Data Structures and Algorithms',
            'description': 'Study of fundamental data structures',
            'department': 'Computer Science',
            'credits': 4,
            'semester': Course.Semester.FALL,
            'teacher': teacher_user
        }
    )
    # Create Course-PO mapping
    CoursePO.objects.get_or_create(
        course=course,
        program_outcome=program_outcome_1,
        defaults={'weight': Decimal('1.5')}
    )
    return course


@pytest.fixture
def enrollment(db, student_user, course):
    """Create a test enrollment"""
    enrollment, _ = Enrollment.objects.get_or_create(
        student=student_user,
        course=course,
        defaults={'is_active': True}
    )
    return enrollment


@pytest.fixture
def assessment(db, course):
    """Create a test assessment"""
    assessment, _ = Assessment.objects.get_or_create(
        course=course,
        title='Midterm Exam',
        defaults={
            'assessment_type': Assessment.AssessmentType.MIDTERM,
            'weight': Decimal('30.00'),
            'max_score': Decimal('100.00'),
            'due_date': timezone.now(),
            'is_active': True
        }
    )
    return assessment


@pytest.fixture
def learning_outcome_1(db, course):
    """Create first test Learning Outcome"""
    lo, _ = LearningOutcome.objects.get_or_create(
        course=course,
        code='LO1',
        defaults={
            'title': 'Understand Data Structures',
            'description': 'Students will understand arrays, lists, and dictionaries',
            'target_percentage': Decimal('75.00')
        }
    )
    return lo


@pytest.fixture
def student_grade(db, student_user, assessment):
    """Create a test student grade"""
    return StudentGrade.objects.create(
        student=student_user,
        assessment=assessment,
        score=Decimal('85.00')
    )


@pytest.fixture
def po_achievement(db, student_user, program_outcome_1):
    """Create a test PO achievement"""
    return StudentPOAchievement.objects.create(
        student=student_user,
        program_outcome=program_outcome_1,
        current_percentage=Decimal('75.00'),
        total_assessments=5,
        completed_assessments=4
    )


@pytest.fixture
def lo_achievement(db, student_user, learning_outcome_1):
    """Create a test LO achievement"""
    return StudentLOAchievement.objects.create(
        student=student_user,
        learning_outcome=learning_outcome_1,
        current_percentage=Decimal('80.00'),
        total_assessments=3,
        completed_assessments=3
    )


# =============================================================================
# COMPOSITE FIXTURES (combining multiple fixtures)
# =============================================================================

@pytest.fixture
def authenticated_student_client(api_client, student_user):
    """APIClient authenticated as student"""
    api_client.force_authenticate(user=student_user)
    return api_client


@pytest.fixture
def authenticated_teacher_client(api_client, teacher_user):
    """APIClient authenticated as teacher"""
    api_client.force_authenticate(user=teacher_user)
    return api_client


@pytest.fixture
def authenticated_institution_client(api_client, institution_user):
    """APIClient authenticated as institution"""
    api_client.force_authenticate(user=institution_user)
    return api_client


@pytest.fixture
def complete_test_data(
    db, student_user, teacher_user, institution_user,
    department, program_outcome_1, program_outcome_2,
    course, enrollment, assessment, learning_outcome_1
):
    """Complete test data setup - returns a dict with all test objects"""
    return {
        'student': student_user,
        'teacher': teacher_user,
        'institution': institution_user,
        'department': department,
        'po1': program_outcome_1,
        'po2': program_outcome_2,
        'course': course,
        'enrollment': enrollment,
        'assessment': assessment,
        'lo1': learning_outcome_1,
    }

