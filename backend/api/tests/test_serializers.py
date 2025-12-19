"""SERIALIZERS Test Module"""

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

from .test_base import BaseTestCase

# =============================================================================
# SERIALIZER VALIDATION TESTS
# =============================================================================

class SerializerValidationTest(TestCase):
    """Test serializer validations"""
    
    def setUp(self):
        self.teacher = User.objects.create_user(
            username='teacher',
            email='teacher@test.com',
            password='testpass123',
            role=User.Role.TEACHER
        )
        self.course = Course.objects.create(
            code='CSE301',
            name='Test Course',
            department='Computer Science',
            credits=3,
            semester=Course.Semester.FALL,
            academic_year='2024-2025',
            teacher=self.teacher
        )
    
    # -------------------------------------------------------------------------
    # UserCreateSerializer tests
    # -------------------------------------------------------------------------
    
    def test_user_create_serializer_password_mismatch(self):
        """Test password confirmation validation"""
        from ..serializers import UserCreateSerializer
        
        serializer = UserCreateSerializer(data={
            'username': 'newuser',
            'email': 'new@test.com',
            'password': 'password123',
            'password_confirm': 'different123',
            'role': User.Role.STUDENT,
            'student_id': '2024001'
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
    
    def test_user_create_serializer_prevents_teacher_registration(self):
        """Test that public registration cannot create teachers"""
        from ..serializers import UserCreateSerializer
        import uuid
        unique_email = f'teacher_{uuid.uuid4().hex[:6]}@test.com'
        
        serializer = UserCreateSerializer(data={
            'username': f'newteacher_{uuid.uuid4().hex[:6]}',
            'email': unique_email,
            'password': 'password123',
            'password_confirm': 'password123',
            'role': User.Role.TEACHER
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('role', serializer.errors)

    # -------------------------------------------------------------------------
    # AssessmentSerializer feedback_ranges interval tests
    # -------------------------------------------------------------------------
    
    def test_assessment_serializer_feedback_ranges_valid_intervals(self):
        """feedback_ranges aralıkları çakışmadan tanımlanabilmeli"""
        from ..serializers import AssessmentSerializer
        
        data = {
            'course': self.course.id,
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
        self.assertTrue(serializer.is_valid(), serializer.errors)
    
    def test_assessment_serializer_feedback_ranges_overlapping_intervals(self):
        """feedback_ranges aralıkları çakışıyorsa hata dönmeli"""
        from ..serializers import AssessmentSerializer
        
        data = {
            'course': self.course.id,
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
        self.assertFalse(serializer.is_valid())
        self.assertIn('feedback_ranges', serializer.errors)
