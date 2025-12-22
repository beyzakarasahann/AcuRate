"""
Analytics Views Tests - Pytest Version

Tests for analytics views in api/views/analytics.py
"""

import pytest
from decimal import Decimal
from rest_framework import status

from api.models import Enrollment, StudentGrade


# =============================================================================
# COURSE ANALYTICS OVERVIEW TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.integration
class TestCourseAnalyticsOverview:
    """Test course_analytics_overview view"""
    
    def test_course_analytics_overview_success(self, authenticated_student_client, student_user, enrollment):
        """Test successful course analytics overview"""
        # Set final grade for enrollment
        enrollment.final_grade = Decimal('85.00')
        enrollment.save()
        
        response = authenticated_student_client.get('/api/course-analytics/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'courses' in response.data
        assert isinstance(response.data['courses'], list)
    
    def test_course_analytics_overview_wrong_role(self, authenticated_teacher_client):
        """Test that non-students cannot access course analytics"""
        response = authenticated_teacher_client.get('/api/course-analytics/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'error' in response.data
    
    def test_course_analytics_overview_unauthenticated(self, api_client):
        """Test course analytics without authentication"""
        response = api_client.get('/api/course-analytics/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_course_analytics_overview_includes_course_data(self, authenticated_student_client, student_user, enrollment, course):
        """Test that analytics includes course data"""
        enrollment.final_grade = Decimal('85.00')
        enrollment.save()
        
        response = authenticated_student_client.get('/api/course-analytics/')
        
        assert response.status_code == status.HTTP_200_OK
        if len(response.data['courses']) > 0:
            course_data = response.data['courses'][0]
            assert 'course_id' in course_data
            assert 'course_code' in course_data
            assert 'course_name' in course_data
            assert 'class_average' in course_data


# =============================================================================
# COURSE ANALYTICS DETAIL TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.integration
class TestCourseAnalyticsDetail:
    """Test course_analytics_detail view"""
    
    def test_course_analytics_detail_success(self, authenticated_student_client, student_user, course, enrollment):
        """Test successful course analytics detail"""
        enrollment.final_grade = Decimal('85.00')
        enrollment.save()
        
        response = authenticated_student_client.get(f'/api/course-analytics/{course.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'course' in response.data
    
    def test_course_analytics_detail_wrong_role(self, authenticated_teacher_client, course):
        """Test that non-students cannot access course analytics detail"""
        response = authenticated_teacher_client.get(f'/api/course-analytics/{course.id}/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_course_analytics_detail_not_enrolled(self, authenticated_student_client, db, course):
        """Test course analytics for course student is not enrolled in"""
        from api.models import User
        other_student = User.objects.create_user(
            username='other_student',
            email='other@test.com',
            password='testpass123',
            role=User.Role.STUDENT,
            student_id='2024999'
        )
        
        api_client = authenticated_student_client
        api_client.force_authenticate(user=other_student)
        
        response = api_client.get(f'/api/course-analytics/{course.id}/')
        
        # Should return 403 or 404
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]



