"""
API Test Module - Pytest Version

This module demonstrates pytest-style API tests using fixtures.
The original test_api.py still works with pytest-django.
"""

import pytest
import uuid
from decimal import Decimal
from rest_framework import status

from api.models import User, ProgramOutcome, Course, Assessment, StudentGrade


# =============================================================================
# API ENDPOINT TESTS - Pytest Style
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestAuthenticationAPI:
    """Test authentication endpoints"""
    
    def test_login_success(self, api_client, db):
        """Test successful login"""
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role=User.Role.STUDENT
        )
        
        response = api_client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'tokens' in response.data
        assert 'access' in response.data['tokens']
        assert 'refresh' in response.data['tokens']
    
    def test_login_invalid_credentials(self, api_client, db):
        """Test login with invalid credentials"""
        User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role=User.Role.STUDENT
        )
        
        response = api_client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
    
    def test_get_current_user(self, authenticated_student_client, student_user):
        """Test getting current user"""
        response = authenticated_student_client.get('/api/auth/me/')
        
        assert response.status_code == status.HTTP_200_OK
        username = response.data.get('username', '')
        assert 'test_student' in username


@pytest.mark.api
@pytest.mark.integration
class TestProgramOutcomeAPI:
    """Test Program Outcome API endpoints"""
    
    def test_list_pos_unauthenticated(self, api_client):
        """Test listing POs without authentication"""
        response = api_client.get('/api/program-outcomes/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_list_pos_authenticated(self, authenticated_student_client):
        """Test listing POs with authentication"""
        response = authenticated_student_client.get('/api/program-outcomes/')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
    
    def test_create_po_as_institution(self, authenticated_institution_client, db):
        """Test creating PO as institution"""
        unique_code = f'PO3_{uuid.uuid4().hex[:6]}'
        response = authenticated_institution_client.post('/api/program-outcomes/', {
            'code': unique_code,
            'title': 'Design Solutions',
            'description': 'Design solutions for complex problems',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['code'] == unique_code
    
    def test_create_po_as_student_forbidden(self, authenticated_student_client):
        """Test that students cannot create POs"""
        response = authenticated_student_client.post('/api/program-outcomes/', {
            'code': 'PO3',
            'title': 'Design Solutions',
            'description': 'Test',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_update_po_as_institution(self, authenticated_institution_client, program_outcome_1):
        """Test updating PO as institution"""
        response = authenticated_institution_client.patch(
            f'/api/program-outcomes/{program_outcome_1.id}/',
            {'title': 'Updated Title'}
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Updated Title'
    
    def test_delete_po_as_institution(self, authenticated_institution_client, program_outcome_1, db):
        """Test deleting PO as institution"""
        po_id = program_outcome_1.id
        response = authenticated_institution_client.delete(f'/api/program-outcomes/{po_id}/')
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not ProgramOutcome.objects.filter(id=po_id).exists()


@pytest.mark.api
@pytest.mark.integration
class TestLearningOutcomeAPI:
    """Test Learning Outcome API endpoints"""
    
    def test_create_lo_as_teacher(self, authenticated_teacher_client, course):
        """Test creating LO as teacher"""
        response = authenticated_teacher_client.post('/api/learning-outcomes/', {
            'course': course.id,
            'code': 'LO2',
            'title': 'Implement Algorithms',
            'description': 'Students will implement various algorithms',
            'target_percentage': '70.00'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['code'] == 'LO2'
    
    def test_create_lo_as_student_forbidden(self, authenticated_student_client, course):
        """Test that students cannot create LOs"""
        response = authenticated_student_client.post('/api/learning-outcomes/', {
            'course': course.id,
            'code': 'LO2',
            'title': 'Test LO',
            'description': 'Test',
            'target_percentage': '70.00'
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_list_los_by_course(self, authenticated_teacher_client, course):
        """Test listing LOs filtered by course"""
        response = authenticated_teacher_client.get(f'/api/learning-outcomes/?course={course.id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)


@pytest.mark.api
@pytest.mark.integration
class TestCourseAPI:
    """Test Course API endpoints"""
    
    def test_list_courses(self, authenticated_student_client):
        """Test listing courses"""
        response = authenticated_student_client.get('/api/courses/')
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
    
    def test_create_course_as_teacher(self, authenticated_teacher_client, teacher_user):
        """Test creating course as teacher"""
        response = authenticated_teacher_client.post('/api/courses/', {
            'code': 'CSE302',
            'name': 'Database Systems',
            'description': 'Introduction to databases',
            'department': 'Computer Science',
            'credits': 3,
            'semester': Course.Semester.FALL,
            'academic_year': '2024-2025',
            'teacher': teacher_user.id
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['code'] == 'CSE302'


@pytest.mark.api
@pytest.mark.integration
class TestStudentGradeAPI:
    """Test Student Grade API endpoints"""
    
    def test_create_grade_as_teacher(
        self, authenticated_teacher_client, student_user, course, db
    ):
        """Test creating grade as teacher"""
        new_assessment = Assessment.objects.create(
            course=course,
            title='Quiz 1',
            assessment_type=Assessment.AssessmentType.QUIZ,
            weight=Decimal('10.00'),
            max_score=Decimal('100.00'),
            is_active=True
        )
        
        response = authenticated_teacher_client.post('/api/grades/', {
            'student': student_user.id,
            'assessment': new_assessment.id,
            'score': '90.00',
            'feedback': 'Excellent work!'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert float(response.data['score']) == 90.00
    
    def test_list_grades_as_student(self, authenticated_student_client, student_user, student_grade):
        """Test student can view their own grades"""
        response = authenticated_student_client.get('/api/grades/')
        
        assert response.status_code == status.HTTP_200_OK
        # Student should only see their own grades
        if isinstance(response.data, list):
            for grade_data in response.data:
                assert grade_data['student'] == student_user.id









