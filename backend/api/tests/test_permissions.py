"""PERMISSIONS Test Module"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
import json

from ..models import (
    User, Department, ProgramOutcome, Course, CoursePO,
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    LearningOutcome, StudentLOAchievement, ContactRequest
)

from .base import BaseTestCase

# =============================================================================
# PERMISSION TESTS
# =============================================================================

class PermissionTest(BaseTestCase):
    """Test role-based permissions"""
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
    
    def test_institution_can_create_po(self):
        """Test institution can create PO"""
        import uuid
        unique_code = f'PO3_{uuid.uuid4().hex[:6]}'
        self.client.force_authenticate(user=self.institution)
        response = self.client.post('/api/program-outcomes/', {
            'code': unique_code,
            'title': 'Test PO',
            'description': 'Test',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_teacher_cannot_create_po(self):
        """Test teacher cannot create PO"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/program-outcomes/', {
            'code': 'PO3',
            'title': 'Test PO',
            'description': 'Test',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_teacher_can_create_lo(self):
        """Test teacher can create LO"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/learning-outcomes/', {
            'course': self.course.id,
            'code': 'LO2',
            'title': 'Test LO',
            'description': 'Test',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_institution_cannot_create_lo(self):
        """Test institution cannot create LO"""
        self.client.force_authenticate(user=self.institution)
        response = self.client.post('/api/learning-outcomes/', {
            'course': self.course.id,
            'code': 'LO2',
            'title': 'Test LO',
            'description': 'Test',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_student_can_view_own_grades(self):
        """Test student can view their own grades"""
        self.client.force_authenticate(user=self.student)
        grade = StudentGrade.objects.create(
            student=self.student,
            assessment=self.assessment,
            score=Decimal('85.00')
        )
        response = self.client.get(f'/api/grades/{grade.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_student_cannot_view_other_grades(self):
        """Test student cannot view other students' grades"""
        other_student = User.objects.create_user(
            username='other_student',
            email='other@test.com',
            password='testpass123',
            role=User.Role.STUDENT,
            student_id='2024002'
        )
        other_grade = StudentGrade.objects.create(
            student=other_student,
            assessment=self.assessment,
            score=Decimal('90.00')
        )
        
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f'/api/grades/{other_grade.id}/')
        # Should either return 404 or 403
        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])
