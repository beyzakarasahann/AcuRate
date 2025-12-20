"""
API Test Module - DEPRECATED

⚠️ DEPRECATED: This file uses Django TestCase format.
✅ Use test_api_pytest.py instead (pytest format with fixtures).

This file is kept for backward compatibility but will be removed in future versions.
All tests have been migrated to pytest format in test_api_pytest.py.
"""

# DEPRECATED: Use test_api_pytest.py instead
from django.test import TestCase
from decimal import Decimal
from rest_framework.test import APIClient
from rest_framework import status

from ..models import (
    User, ProgramOutcome, Course, Assessment, StudentGrade
)

from .test_base import BaseTestCase

# =============================================================================
# API ENDPOINT TESTS
# =============================================================================

class AuthenticationAPITest(TestCase):
    """Test authentication endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role=User.Role.STUDENT
        )
    
    def test_login_success(self):
        """Test successful login"""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_get_current_user(self):
        """Test getting current user"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Response should contain user data
        username = response.data.get('username', '')
        self.assertIn('testuser', username)


class ProgramOutcomeAPITest(BaseTestCase):
    """Test Program Outcome API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
    
    def test_list_pos_unauthenticated(self):
        """Test listing POs without authentication"""
        response = self.client.get('/api/program-outcomes/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_pos_authenticated(self):
        """Test listing POs with authentication"""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/program-outcomes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_create_po_as_institution(self):
        """Test creating PO as institution"""
        import uuid
        unique_code = f'PO3_{uuid.uuid4().hex[:6]}'
        self.client.force_authenticate(user=self.institution)
        response = self.client.post('/api/program-outcomes/', {
            'code': unique_code,
            'title': 'Design Solutions',
            'description': 'Design solutions for complex problems',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], unique_code)
    
    def test_create_po_as_student_forbidden(self):
        """Test that students cannot create POs"""
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/program-outcomes/', {
            'code': 'PO3',
            'title': 'Design Solutions',
            'description': 'Test',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_po_as_institution(self):
        """Test updating PO as institution"""
        self.client.force_authenticate(user=self.institution)
        response = self.client.patch(f'/api/program-outcomes/{self.po1.id}/', {
            'title': 'Updated Title'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')
    
    def test_delete_po_as_institution(self):
        """Test deleting PO as institution"""
        self.client.force_authenticate(user=self.institution)
        response = self.client.delete(f'/api/program-outcomes/{self.po1.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ProgramOutcome.objects.filter(id=self.po1.id).exists())


class LearningOutcomeAPITest(BaseTestCase):
    """Test Learning Outcome API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
    
    def test_create_lo_as_teacher(self):
        """Test creating LO as teacher"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/learning-outcomes/', {
            'course': self.course.id,
            'code': 'LO2',
            'title': 'Implement Algorithms',
            'description': 'Students will implement various algorithms',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 'LO2')
    
    def test_create_lo_as_student_forbidden(self):
        """Test that students cannot create LOs"""
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/learning-outcomes/', {
            'course': self.course.id,
            'code': 'LO2',
            'title': 'Test LO',
            'description': 'Test',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_list_los_by_course(self):
        """Test listing LOs filtered by course"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(f'/api/learning-outcomes/?course={self.course.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)


class CourseAPITest(BaseTestCase):
    """Test Course API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
    
    def test_list_courses(self):
        """Test listing courses"""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_create_course_as_teacher(self):
        """Test creating course as teacher"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/courses/', {
            'code': 'CSE302',
            'name': 'Database Systems',
            'description': 'Introduction to databases',
            'department': 'Computer Science',
            'credits': 3,
            'semester': Course.Semester.FALL,
            'academic_year': '2024-2025',
            'teacher': self.teacher.id
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 'CSE302')


class StudentGradeAPITest(BaseTestCase):
    """Test Student Grade API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.grade = StudentGrade.objects.create(
            student=self.student,
            assessment=self.assessment,
            score=Decimal('85.00')
        )
    
    def test_create_grade_as_teacher(self):
        """Test creating grade as teacher"""
        self.client.force_authenticate(user=self.teacher)
        new_assessment = Assessment.objects.create(
            course=self.course,
            title='Quiz 1',
            assessment_type=Assessment.AssessmentType.QUIZ,
            weight=Decimal('10.00'),
            max_score=Decimal('100.00'),
            is_active=True
        )
        
        response = self.client.post('/api/grades/', {
            'student': self.student.id,
            'assessment': new_assessment.id,
            'score': '90.00',
            'feedback': 'Excellent work!'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data['score']), 90.00)
    
    def test_list_grades_as_student(self):
        """Test student can view their own grades"""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/grades/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Student should only see their own grades
        if isinstance(response.data, list):
            for grade_data in response.data:
                self.assertEqual(grade_data['student'], self.student.id)
