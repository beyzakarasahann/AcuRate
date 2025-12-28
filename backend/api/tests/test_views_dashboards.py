"""
Dashboard Views Tests - Pytest Version

Tests for dashboard views in api/views/dashboards.py
"""

import pytest
from decimal import Decimal
from rest_framework import status

from api.models import Enrollment, StudentGrade, StudentPOAchievement, Assessment


# =============================================================================
# STUDENT DASHBOARD TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.integration
class TestStudentDashboard:
    """Test student_dashboard view"""
    
    def test_student_dashboard_success(self, authenticated_student_client, student_user, enrollment, assessment):
        """Test successful student dashboard retrieval"""
        # Create a grade for the student
        StudentGrade.objects.create(
            student=student_user,
            assessment=assessment,
            score=Decimal('85.00')
        )
        
        response = authenticated_student_client.get('/api/dashboard/student/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'enrollments' in response.data
        assert 'po_achievements' in response.data
        assert 'recent_grades' in response.data
        assert 'stats' in response.data
    
    def test_student_dashboard_wrong_role(self, authenticated_teacher_client):
        """Test that non-students cannot access student dashboard"""
        response = authenticated_teacher_client.get('/api/dashboard/student/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'error' in response.data
    
    def test_student_dashboard_unauthenticated(self, api_client):
        """Test student dashboard without authentication"""
        response = api_client.get('/api/dashboard/student/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_student_dashboard_includes_enrollments(self, authenticated_student_client, student_user, enrollment):
        """Test that dashboard includes student enrollments"""
        response = authenticated_student_client.get('/api/dashboard/student/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['enrollments']) >= 1
        assert response.data['enrollments'][0]['course']['code'] in enrollment.course.code
    
    def test_student_dashboard_includes_po_achievements(self, authenticated_student_client, student_user, po_achievement):
        """Test that dashboard includes PO achievements"""
        response = authenticated_student_client.get('/api/dashboard/student/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['po_achievements']) >= 1


# =============================================================================
# TEACHER DASHBOARD TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.integration
class TestTeacherDashboard:
    """Test teacher_dashboard view"""
    
    def test_teacher_dashboard_success(self, authenticated_teacher_client, teacher_user, course):
        """Test successful teacher dashboard retrieval"""
        response = authenticated_teacher_client.get('/api/dashboard/teacher/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'courses' in response.data
        assert 'stats' in response.data
    
    def test_teacher_dashboard_wrong_role(self, authenticated_student_client):
        """Test that non-teachers cannot access teacher dashboard"""
        response = authenticated_student_client.get('/api/dashboard/teacher/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_teacher_dashboard_includes_courses(self, authenticated_teacher_client, teacher_user, course):
        """Test that dashboard includes teacher's courses"""
        response = authenticated_teacher_client.get('/api/dashboard/teacher/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['courses']) >= 1
        assert any(c['code'] in course.code for c in response.data['courses'])


# =============================================================================
# INSTITUTION DASHBOARD TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.integration
class TestInstitutionDashboard:
    """Test institution_dashboard view"""
    
    def test_institution_dashboard_success(self, authenticated_institution_client, institution_user):
        """Test successful institution dashboard retrieval"""
        response = authenticated_institution_client.get('/api/dashboard/institution/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'stats' in response.data
        assert 'departments' in response.data or 'department_stats' in response.data
    
    def test_institution_dashboard_wrong_role(self, authenticated_student_client):
        """Test that non-institutions cannot access institution dashboard"""
        response = authenticated_student_client.get('/api/dashboard/institution/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_institution_dashboard_unauthenticated(self, api_client):
        """Test institution dashboard without authentication"""
        response = api_client.get('/api/dashboard/institution/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED









