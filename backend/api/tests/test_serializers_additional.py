"""
Additional Serializer Tests - Pytest Version

Tests for serializers that were not fully covered in test_serializers.py
"""

import pytest
from decimal import Decimal

from api.models import User, Department, ProgramOutcome, Course, LearningOutcome
from api.serializers import (
    DepartmentSerializer, ProgramOutcomeSerializer, LearningOutcomeSerializer,
    CourseSerializer, EnrollmentSerializer, ContactRequestCreateSerializer,
    AssessmentLOSerializer, LOPOSerializer
)


# =============================================================================
# DEPARTMENT SERIALIZER TESTS
# =============================================================================

@pytest.mark.serializer
@pytest.mark.unit
class TestDepartmentSerializer:
    """Test DepartmentSerializer"""
    
    def test_department_serializer_serialization(self, department):
        """Test department serialization"""
        serializer = DepartmentSerializer(department)
        data = serializer.data
        
        assert data['name'] == 'Computer Science'
        assert 'code' in data
        assert 'description' in data
    
    def test_department_serializer_validation(self, db):
        """Test department serializer validation"""
        serializer = DepartmentSerializer(data={
            'name': 'Mathematics',
            'code': 'MATH',
            'description': 'Mathematics Department'
        })
        assert serializer.is_valid()
        
        dept = serializer.save()
        assert dept.name == 'Mathematics'
        assert dept.code == 'MATH'


# =============================================================================
# PROGRAM OUTCOME SERIALIZER TESTS
# =============================================================================

@pytest.mark.serializer
@pytest.mark.unit
class TestProgramOutcomeSerializer:
    """Test ProgramOutcomeSerializer"""
    
    def test_program_outcome_serializer_serialization(self, program_outcome_1):
        """Test PO serialization"""
        serializer = ProgramOutcomeSerializer(program_outcome_1)
        data = serializer.data
        
        assert data['code'] == 'PO1'
        assert data['title'] == 'Engineering Knowledge'
        assert 'target_percentage' in data
    
    def test_program_outcome_serializer_validation(self, db):
        """Test PO serializer validation"""
        serializer = ProgramOutcomeSerializer(data={
            'code': 'PO_TEST',
            'title': 'Test PO',
            'description': 'Test description',
            'department': 'Computer Science',
            'target_percentage': '75.00'
        })
        assert serializer.is_valid()
        
        po = serializer.save()
        assert po.code == 'PO_TEST'
        assert po.target_percentage == Decimal('75.00')


# =============================================================================
# LEARNING OUTCOME SERIALIZER TESTS
# =============================================================================

@pytest.mark.serializer
@pytest.mark.unit
class TestLearningOutcomeSerializer:
    """Test LearningOutcomeSerializer"""
    
    def test_learning_outcome_serializer_serialization(self, learning_outcome_1):
        """Test LO serialization"""
        serializer = LearningOutcomeSerializer(learning_outcome_1)
        data = serializer.data
        
        assert data['code'] == 'LO1'
        assert 'title' in data
        assert 'target_percentage' in data
        assert 'course' in data
    
    def test_learning_outcome_serializer_validation(self, course):
        """Test LO serializer validation"""
        serializer = LearningOutcomeSerializer(data={
            'course': course.id,
            'code': 'LO_TEST',
            'title': 'Test LO',
            'description': 'Test description',
            'target_percentage': '80.00'
        })
        assert serializer.is_valid()
        
        lo = serializer.save()
        assert lo.code == 'LO_TEST'
        assert lo.course == course


# =============================================================================
# COURSE SERIALIZER TESTS
# =============================================================================

@pytest.mark.serializer
@pytest.mark.unit
class TestCourseSerializer:
    """Test CourseSerializer"""
    
    def test_course_serializer_serialization(self, course):
        """Test course serialization"""
        serializer = CourseSerializer(course)
        data = serializer.data
        
        assert 'CSE301' in data['code']
        assert data['name'] == 'Data Structures and Algorithms'
        assert data['credits'] == 4
        assert 'teacher' in data
    
    def test_course_serializer_validation(self, teacher_user):
        """Test course serializer validation"""
        serializer = CourseSerializer(data={
            'code': 'CSE_TEST',
            'name': 'Test Course',
            'description': 'Test description',
            'department': 'Computer Science',
            'credits': 3,
            'semester': Course.Semester.FALL,
            'academic_year': '2024-2025',
            'teacher': teacher_user.id
        })
        assert serializer.is_valid()
        
        course = serializer.save()
        assert course.code == 'CSE_TEST'
        assert course.teacher == teacher_user


# =============================================================================
# ENROLLMENT SERIALIZER TESTS
# =============================================================================

@pytest.mark.serializer
@pytest.mark.unit
class TestEnrollmentSerializer:
    """Test EnrollmentSerializer"""
    
    def test_enrollment_serializer_serialization(self, enrollment):
        """Test enrollment serialization"""
        serializer = EnrollmentSerializer(enrollment)
        data = serializer.data
        
        assert 'student' in data
        assert 'course' in data
        assert 'is_active' in data
    
    def test_enrollment_serializer_validation(self, student_user, course):
        """Test enrollment serializer validation"""
        serializer = EnrollmentSerializer(data={
            'student': student_user.id,
            'course': course.id,
            'is_active': True
        })
        assert serializer.is_valid()
        
        enrollment = serializer.save()
        assert enrollment.student == student_user
        assert enrollment.course == course


# =============================================================================
# CONTACT REQUEST SERIALIZER TESTS
# =============================================================================

@pytest.mark.serializer
@pytest.mark.unit
class TestContactRequestCreateSerializer:
    """Test ContactRequestCreateSerializer"""
    
    def test_contact_request_serializer_validation(self, db):
        """Test contact request serializer validation"""
        serializer = ContactRequestCreateSerializer(data={
            'institution_name': 'Test University',
            'institution_type': 'university',
            'contact_name': 'John Doe',
            'contact_email': 'john@testuniversity.edu',
            'contact_phone': '+1234567890',
            'request_type': 'demo',
            'message': 'I would like to request a demo'
        })
        assert serializer.is_valid()
        
        request = serializer.save()
        assert request.institution_name == 'Test University'
        assert request.contact_email == 'john@testuniversity.edu'
        assert request.status == 'pending'  # Default status


# =============================================================================
# ASSESSMENTLO SERIALIZER TESTS
# =============================================================================

@pytest.mark.serializer
@pytest.mark.unit
class TestAssessmentLOSerializer:
    """Test AssessmentLOSerializer"""
    
    def test_assessment_lo_serializer_serialization(self, db, assessment, learning_outcome_1):
        """Test AssessmentLO serialization"""
        from api.models import AssessmentLO
        
        assessment_lo = AssessmentLO.objects.create(
            assessment=assessment,
            learning_outcome=learning_outcome_1,
            weight=Decimal('1.5')
        )
        
        serializer = AssessmentLOSerializer(assessment_lo)
        data = serializer.data
        
        assert 'assessment' in data
        assert 'learning_outcome' in data
        assert data['weight'] == '1.50'
    
    def test_assessment_lo_serializer_validation(self, assessment, learning_outcome_1):
        """Test AssessmentLO serializer validation"""
        serializer = AssessmentLOSerializer(data={
            'assessment': assessment.id,
            'learning_outcome': learning_outcome_1.id,
            'weight': '2.0'
        })
        assert serializer.is_valid()
        
        assessment_lo = serializer.save()
        assert assessment_lo.assessment == assessment
        assert assessment_lo.learning_outcome == learning_outcome_1
        assert assessment_lo.weight == Decimal('2.0')


# =============================================================================
# LOPO SERIALIZER TESTS
# =============================================================================

@pytest.mark.serializer
@pytest.mark.unit
class TestLOPOSerializer:
    """Test LOPOSerializer"""
    
    def test_lopo_serializer_serialization(self, db, learning_outcome_1, program_outcome_1):
        """Test LOPO serialization"""
        from api.models import LOPO
        
        lopo = LOPO.objects.create(
            learning_outcome=learning_outcome_1,
            program_outcome=program_outcome_1,
            weight=Decimal('1.5')
        )
        
        serializer = LOPOSerializer(lopo)
        data = serializer.data
        
        assert 'learning_outcome' in data
        assert 'program_outcome' in data
        assert data['weight'] == '1.50'
    
    def test_lopo_serializer_validation(self, learning_outcome_1, program_outcome_1):
        """Test LOPO serializer validation"""
        serializer = LOPOSerializer(data={
            'learning_outcome': learning_outcome_1.id,
            'program_outcome': program_outcome_1.id,
            'weight': '2.5'
        })
        assert serializer.is_valid()
        
        lopo = serializer.save()
        assert lopo.learning_outcome == learning_outcome_1
        assert lopo.program_outcome == program_outcome_1
        assert lopo.weight == Decimal('2.5')


