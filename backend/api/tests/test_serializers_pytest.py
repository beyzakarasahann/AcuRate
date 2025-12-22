"""
Serializer Tests - Pytest Version

Tests for serializer validations using pytest.
"""

import pytest
import uuid

from api.models import User, Course
from api.serializers import UserCreateSerializer, AssessmentSerializer


# =============================================================================
# SERIALIZER VALIDATION TESTS - Pytest Style
# =============================================================================

@pytest.mark.serializer
@pytest.mark.unit
class TestUserCreateSerializer:
    """Test UserCreateSerializer"""
    
    def test_password_mismatch(self, db):
        """Test password confirmation validation"""
        serializer = UserCreateSerializer(data={
            'username': 'newuser',
            'email': 'new@test.com',
            'password': 'password123',
            'password_confirm': 'different123',
            'role': User.Role.STUDENT,
            'student_id': '2024001'
        })
        assert serializer.is_valid() is False
        assert 'password' in serializer.errors
    
    def test_prevents_teacher_registration(self, db):
        """Test that public registration cannot create teachers"""
        unique_email = f'teacher_{uuid.uuid4().hex[:6]}@test.com'
        
        serializer = UserCreateSerializer(data={
            'username': f'newteacher_{uuid.uuid4().hex[:6]}',
            'email': unique_email,
            'password': 'password123',
            'password_confirm': 'password123',
            'role': User.Role.TEACHER
        })
        assert serializer.is_valid() is False
        assert 'role' in serializer.errors


@pytest.mark.serializer
@pytest.mark.unit
class TestAssessmentSerializer:
    """Test AssessmentSerializer feedback_ranges validation"""
    
    def test_feedback_ranges_valid_intervals(self, course):
        """feedback_ranges aralıkları çakışmadan tanımlanabilmeli"""
        data = {
            'course': course.id,
            'title': 'Midterm Exam',
            'assessment_type': 'MIDTERM',
            'weight': '30.00',
            'max_score': '100.00',
            'is_active': True,
            # Geçerli, çakışmayan aralıklar
            'feedback_ranges': [
                {'min_score': 0, 'max_score': 49, 'feedback': 'Yetersiz'},
                {'min_score': 50, 'max_score': 74, 'feedback': 'Geliştirilmeli'},
                {'min_score': 75, 'max_score': 100, 'feedback': 'Başarılı'},
            ],
        }
        
        serializer = AssessmentSerializer(data=data)
        assert serializer.is_valid() is True, serializer.errors
    
    def test_feedback_ranges_overlapping_intervals(self, course):
        """feedback_ranges aralıkları çakışıyorsa hata dönmeli"""
        data = {
            'course': course.id,
            'title': 'Midterm Exam',
            'assessment_type': 'MIDTERM',
            'weight': '30.00',
            'max_score': '100.00',
            'is_active': True,
            # Çakışan aralıklar: 40-70 ile 60-90 kesişiyor
            'feedback_ranges': [
                {'min_score': 0, 'max_score': 39, 'feedback': 'Yetersiz'},
                {'min_score': 40, 'max_score': 70, 'feedback': 'Orta'},
                {'min_score': 60, 'max_score': 90, 'feedback': 'İyi'},
            ],
        }
        
        serializer = AssessmentSerializer(data=data)
        assert serializer.is_valid() is False
        assert 'feedback_ranges' in serializer.errors



