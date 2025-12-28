"""
Test Data Factories

Factory functions for creating test data consistently.
"""

import uuid
from decimal import Decimal
from django.utils import timezone

from api.models import (
    User, Department, ProgramOutcome, Course, CoursePO,
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    LearningOutcome, StudentLOAchievement
)
from .test_constants import (
    TEST_PASSWORD, TEST_DEPARTMENT, TEST_ACADEMIC_YEAR,
    TEST_COURSE_CODE, TEST_COURSE_NAME, TEST_COURSE_CREDITS,
    TEST_ASSESSMENT_TITLE, TEST_ASSESSMENT_WEIGHT, TEST_ASSESSMENT_MAX_SCORE,
    TEST_PO_CODE, TEST_PO_TITLE, TEST_PO_TARGET,
    TEST_LO_CODE, TEST_LO_TITLE, TEST_LO_TARGET,
    TEST_GRADE_SCORE, TEST_STUDENT_ID_PREFIX, TEST_YEAR_OF_STUDY
)


def create_test_user(
    role=User.Role.STUDENT,
    username=None,
    email=None,
    student_id=None,
    department=TEST_DEPARTMENT,
    **kwargs
):
    """Create a test user with default values"""
    unique_id = str(uuid.uuid4())[:8]
    
    if username is None:
        username = f'test_{role.lower()}_{unique_id}'
    
    if email is None:
        email = f'{role.lower()}_{unique_id}@test.com'
    
    user_data = {
        'username': username,
        'email': email,
        'password': TEST_PASSWORD,
        'role': role,
        'department': department,
        'first_name': 'Test',
        'last_name': role.title(),
        **kwargs
    }
    
    if role == User.Role.STUDENT:
        if student_id is None:
            student_id = f'{TEST_STUDENT_ID_PREFIX}{unique_id[:3]}'
        user_data['student_id'] = student_id
        user_data['year_of_study'] = kwargs.get('year_of_study', TEST_YEAR_OF_STUDY)
    
    return User.objects.create_user(**user_data)


def create_test_department(name=TEST_DEPARTMENT, code='CS', **kwargs):
    """Create a test department"""
    return Department.objects.get_or_create(
        name=name,
        defaults={
            'code': code,
            'description': f'{name} Department',
            **kwargs
        }
    )[0]


def create_test_po(
    code=None,
    title=None,
    department=TEST_DEPARTMENT,
    target_percentage=None,
    **kwargs
):
    """Create a test Program Outcome"""
    if code is None:
        code = f'{TEST_PO_CODE}_{uuid.uuid4().hex[:6]}'
    
    return ProgramOutcome.objects.get_or_create(
        code=code,
        defaults={
            'title': title or TEST_PO_TITLE,
            'description': kwargs.get('description', 'Test PO description'),
            'department': department,
            'target_percentage': Decimal(str(target_percentage or TEST_PO_TARGET)),
            **{k: v for k, v in kwargs.items() if k != 'description'}
        }
    )[0]


def create_test_course(
    code=None,
    name=None,
    teacher=None,
    department=TEST_DEPARTMENT,
    academic_year=TEST_ACADEMIC_YEAR,
    **kwargs
):
    """Create a test course"""
    unique_id = str(uuid.uuid4())[:4]
    
    if code is None:
        code = f'{TEST_COURSE_CODE}_{unique_id}'
    
    if teacher is None:
        teacher = create_test_user(role=User.Role.TEACHER, department=department)
    
    return Course.objects.get_or_create(
        code=code,
        academic_year=academic_year,
        defaults={
            'name': name or TEST_COURSE_NAME,
            'description': kwargs.get('description', 'Test course description'),
            'department': department,
            'credits': kwargs.get('credits', TEST_COURSE_CREDITS),
            'semester': kwargs.get('semester', Course.Semester.FALL),
            'teacher': teacher,
            **{k: v for k, v in kwargs.items() if k not in ['description', 'credits', 'semester']}
        }
    )[0]


def create_test_lo(
    course=None,
    code=None,
    title=None,
    target_percentage=None,
    **kwargs
):
    """Create a test Learning Outcome"""
    if course is None:
        course = create_test_course()
    
    if code is None:
        code = f'{TEST_LO_CODE}_{uuid.uuid4().hex[:4]}'
    
    return LearningOutcome.objects.get_or_create(
        course=course,
        code=code,
        defaults={
            'title': title or TEST_LO_TITLE,
            'description': kwargs.get('description', 'Test LO description'),
            'target_percentage': Decimal(str(target_percentage or TEST_LO_TARGET)),
            **{k: v for k, v in kwargs.items() if k != 'description'}
        }
    )[0]


def create_test_assessment(
    course=None,
    title=None,
    assessment_type=Assessment.AssessmentType.MIDTERM,
    weight=None,
    max_score=None,
    **kwargs
):
    """Create a test assessment"""
    if course is None:
        course = create_test_course()
    
    return Assessment.objects.create(
        course=course,
        title=title or TEST_ASSESSMENT_TITLE,
        assessment_type=assessment_type,
        weight=Decimal(str(weight or TEST_ASSESSMENT_WEIGHT)),
        max_score=Decimal(str(max_score or TEST_ASSESSMENT_MAX_SCORE)),
        due_date=kwargs.get('due_date', timezone.now()),
        is_active=kwargs.get('is_active', True),
        **{k: v for k, v in kwargs.items() if k not in ['due_date', 'is_active']}
    )


def create_test_enrollment(
    student=None,
    course=None,
    is_active=True,
    **kwargs
):
    """Create a test enrollment"""
    if student is None:
        student = create_test_user(role=User.Role.STUDENT)
    
    if course is None:
        course = create_test_course()
    
    return Enrollment.objects.get_or_create(
        student=student,
        course=course,
        defaults={
            'is_active': is_active,
            **kwargs
        }
    )[0]


def create_test_grade(
    student=None,
    assessment=None,
    score=None,
    **kwargs
):
    """Create a test student grade"""
    if student is None:
        student = create_test_user(role=User.Role.STUDENT)
    
    if assessment is None:
        assessment = create_test_assessment()
    
    return StudentGrade.objects.create(
        student=student,
        assessment=assessment,
        score=Decimal(str(score or TEST_GRADE_SCORE)),
        **kwargs
    )









