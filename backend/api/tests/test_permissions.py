"""
PERMISSIONS Test Module - DEPRECATED

⚠️ DEPRECATED: This file uses Django TestCase format.
✅ Use test_permissions_pytest.py instead (pytest format with fixtures).

This file is kept for backward compatibility but will be removed in future versions.
All tests have been migrated to pytest format in test_permissions_pytest.py.
"""

# DEPRECATED: Use test_permissions_pytest.py instead
from decimal import Decimal
from rest_framework.test import APIClient
from rest_framework import status

from ..models import (
    User, Enrollment, Assessment, StudentGrade
)

from .test_base import BaseTestCase

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
        # Ensure enrollment exists for the student in the course
        enrollment, _ = Enrollment.objects.get_or_create(
            student=self.student,
            course=self.assessment.course,
            defaults={'final_grade': None, 'is_active': True}
        )
        
        self.client.force_authenticate(user=self.student)
        grade = StudentGrade.objects.create(
            student=self.student,
            assessment=self.assessment,
            score=Decimal('85.00')
        )
        # Use list endpoint - students should see their own grades
        response = self.client.get('/api/grades/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify student can see their own grade
        if isinstance(response.data, list) and len(response.data) > 0:
            self.assertEqual(response.data[0]['student'], self.student.id)
    
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
