"""
Permission Tests - Pytest Version

Tests for role-based permissions using pytest.
"""

import pytest
import uuid
from decimal import Decimal
from rest_framework import status

from api.models import User, Enrollment, Assessment, StudentGrade


# =============================================================================
# PERMISSION TESTS - Pytest Style
# =============================================================================

@pytest.mark.permission
@pytest.mark.unit
class TestRoleBasedPermissions:
    """Test role-based permissions"""
    
    def test_institution_can_create_po(self, authenticated_institution_client, db):
        """Test institution can create PO"""
        unique_code = f'PO3_{uuid.uuid4().hex[:6]}'
        response = authenticated_institution_client.post('/api/program-outcomes/', {
            'code': unique_code,
            'title': 'Test PO',
            'description': 'Test',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_teacher_cannot_create_po(self, authenticated_teacher_client):
        """Test teacher cannot create PO"""
        response = authenticated_teacher_client.post('/api/program-outcomes/', {
            'code': 'PO3',
            'title': 'Test PO',
            'description': 'Test',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_teacher_can_create_lo(self, authenticated_teacher_client, course):
        """Test teacher can create LO"""
        response = authenticated_teacher_client.post('/api/learning-outcomes/', {
            'course': course.id,
            'code': 'LO2',
            'title': 'Test LO',
            'description': 'Test',
            'target_percentage': '70.00'
        })
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_institution_cannot_create_lo(self, authenticated_institution_client, course):
        """Test institution cannot create LO"""
        response = authenticated_institution_client.post('/api/learning-outcomes/', {
            'course': course.id,
            'code': 'LO2',
            'title': 'Test LO',
            'description': 'Test',
            'target_percentage': '70.00'
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_student_can_view_own_grades(self, authenticated_student_client, student_user, assessment, db):
        """Test student can view their own grades"""
        # Ensure enrollment exists
        Enrollment.objects.get_or_create(
            student=student_user,
            course=assessment.course,
            defaults={'final_grade': None, 'is_active': True}
        )
        
        grade = StudentGrade.objects.create(
            student=student_user,
            assessment=assessment,
            score=Decimal('85.00')
        )
        
        response = authenticated_student_client.get('/api/grades/')
        assert response.status_code == status.HTTP_200_OK
        # Verify student can see their own grade
        if isinstance(response.data, list) and len(response.data) > 0:
            assert response.data[0]['student'] == student_user.id
    
    def test_student_cannot_view_other_grades(self, authenticated_student_client, student_user, assessment, db):
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
            assessment=assessment,
            score=Decimal('90.00')
        )
        
        response = authenticated_student_client.get(f'/api/grades/{other_grade.id}/')
        # Should either return 404 or 403
        assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN]



