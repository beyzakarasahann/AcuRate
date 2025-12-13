"""MODELS Test Module"""

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
# MODEL TESTS
# =============================================================================

class UserModelTest(BaseTestCase):
    """Test User model"""
    
    def test_user_creation(self):
        """Test user creation"""
        self.assertIn('test_student', self.student.username)
        self.assertEqual(self.student.role, User.Role.STUDENT)
        self.assertTrue(self.student.check_password('testpass123'))
    
    def test_student_requires_student_id(self):
        """Test that student role requires student_id"""
        with self.assertRaises(ValidationError):
            user = User(
                username='invalid_student',
                email='invalid@test.com',
                role=User.Role.STUDENT
            )
            user.full_clean()
    
    def test_user_str(self):
        """Test user string representation"""
        self.assertIn('test_student', str(self.student))
        self.assertIn('(Student)', str(self.student))
    
    def test_user_get_full_name(self):
        """Test user full name"""
        self.assertEqual(self.student.get_full_name(), 'Test Student')


class ProgramOutcomeModelTest(BaseTestCase):
    """Test ProgramOutcome model"""
    
    def test_po_creation(self):
        """Test PO creation"""
        self.assertEqual(self.po1.code, 'PO1')
        self.assertEqual(self.po1.title, 'Engineering Knowledge')
        self.assertEqual(self.po1.target_percentage, Decimal('70.00'))
    
    def test_po_str(self):
        """Test PO string representation"""
        self.assertEqual(str(self.po1), 'PO1: Engineering Knowledge')
    
    def test_po_unique_code(self):
        """Test PO code uniqueness"""
        with self.assertRaises(Exception):
            ProgramOutcome.objects.create(
                code='PO1',  # Duplicate
                title='Duplicate PO',
                description='Test',
                department='Computer Science'
            )


class LearningOutcomeModelTest(BaseTestCase):
    """Test LearningOutcome model"""
    
    def test_lo_creation(self):
        """Test LO creation"""
        self.assertEqual(self.lo1.code, 'LO1')
        self.assertEqual(self.lo1.course, self.course)
        self.assertEqual(self.lo1.target_percentage, Decimal('75.00'))
    
    def test_lo_str(self):
        """Test LO string representation"""
        self.assertIn('CSE301', str(self.lo1))
        self.assertIn('LO1', str(self.lo1))
        self.assertIn('Understand Data Structures', str(self.lo1))
    
    def test_lo_unique_per_course(self):
        """Test LO code uniqueness per course"""
        with self.assertRaises(Exception):
            LearningOutcome.objects.create(
                course=self.course,
                code='LO1',  # Duplicate in same course
                title='Duplicate LO',
                description='Test',
                target_percentage=Decimal('70.00')
            )


class CourseModelTest(BaseTestCase):
    """Test Course model"""
    
    def test_course_creation(self):
        """Test course creation"""
        self.assertIn('CSE301', self.course.code)
        self.assertEqual(self.course.teacher, self.teacher)
        self.assertEqual(self.course.credits, 4)
    
    def test_course_str(self):
        """Test course string representation"""
        self.assertIn('CSE301', str(self.course))
        self.assertIn('2024-2025', str(self.course))


class AssessmentModelTest(BaseTestCase):
    """Test Assessment model"""
    
    def test_assessment_creation(self):
        """Test assessment creation"""
        self.assertEqual(self.assessment.title, 'Midterm Exam')
        self.assertEqual(self.assessment.assessment_type, Assessment.AssessmentType.MIDTERM)
        self.assertEqual(self.assessment.weight, Decimal('30.00'))
    
    def test_assessment_feedback_ranges(self):
        """Test assessment feedback ranges"""
        self.assessment.feedback_ranges = [
            {'min_score': 90, 'max_score': 100, 'feedback': 'Excellent'},
            {'min_score': 70, 'max_score': 89, 'feedback': 'Good'},
            {'min_score': 0, 'max_score': 69, 'feedback': 'Needs Improvement'}
        ]
        self.assessment.save()
        
        # Test feedback for different scores
        self.assertEqual(self.assessment.get_feedback_for_score(95), 'Excellent')
        self.assertEqual(self.assessment.get_feedback_for_score(75), 'Good')
        self.assertEqual(self.assessment.get_feedback_for_score(50), 'Needs Improvement')


class StudentGradeModelTest(BaseTestCase):
    """Test StudentGrade model"""
    
    def setUp(self):
        super().setUp()
        self.grade = StudentGrade.objects.create(
            student=self.student,
            assessment=self.assessment,
            score=Decimal('85.00')
        )
    
    def test_grade_creation(self):
        """Test grade creation"""
        self.assertEqual(self.grade.student, self.student)
        self.assertEqual(self.grade.assessment, self.assessment)
        self.assertEqual(self.grade.score, Decimal('85.00'))
    
    def test_grade_percentage(self):
        """Test grade percentage calculation"""
        expected_percentage = (Decimal('85.00') / Decimal('100.00')) * 100
        self.assertEqual(self.grade.percentage, expected_percentage)
    
    def test_grade_weighted_contribution(self):
        """Test weighted contribution calculation"""
        percentage = self.grade.percentage
        weight = self.assessment.weight
        expected = (percentage * weight) / 100
        self.assertEqual(self.grade.weighted_contribution, expected)
    
    def test_grade_validation_max_score(self):
        """Test grade cannot exceed max score"""
        with self.assertRaises(ValidationError):
            invalid_grade = StudentGrade(
                student=self.student,
                assessment=self.assessment,
                score=Decimal('150.00')  # Exceeds max_score of 100
            )
            invalid_grade.clean()


class StudentPOAchievementModelTest(BaseTestCase):
    """Test StudentPOAchievement model"""
    
    def setUp(self):
        super().setUp()
        self.po_achievement = StudentPOAchievement.objects.create(
            student=self.student,
            program_outcome=self.po1,
            current_percentage=Decimal('75.00'),
            total_assessments=5,
            completed_assessments=4
        )
    
    def test_po_achievement_creation(self):
        """Test PO achievement creation"""
        self.assertEqual(self.po_achievement.student, self.student)
        self.assertEqual(self.po_achievement.program_outcome, self.po1)
        self.assertEqual(self.po_achievement.current_percentage, Decimal('75.00'))
    
    def test_is_target_met(self):
        """Test target achievement check"""
        # PO1 target is 70%, achievement is 75%
        self.assertTrue(self.po_achievement.is_target_met)
        
        # Test below target
        self.po_achievement.current_percentage = Decimal('65.00')
        self.assertFalse(self.po_achievement.is_target_met)
    
    def test_gap_to_target(self):
        """Test gap to target calculation"""
        gap = self.po_achievement.gap_to_target
        expected = Decimal('70.00') - Decimal('75.00')  # -5%
        self.assertEqual(gap, expected)
    
    def test_completion_rate(self):
        """Test completion rate calculation"""
        rate = self.po_achievement.completion_rate
        expected = (4 / 5) * 100  # 80%
        self.assertEqual(rate, expected)


class StudentLOAchievementModelTest(BaseTestCase):
    """Test StudentLOAchievement model"""
    
    def setUp(self):
        super().setUp()
        self.lo_achievement = StudentLOAchievement.objects.create(
            student=self.student,
            learning_outcome=self.lo1,
            current_percentage=Decimal('80.00'),
            total_assessments=3,
            completed_assessments=3
        )
    
    def test_lo_achievement_creation(self):
        """Test LO achievement creation"""
        self.assertEqual(self.lo_achievement.student, self.student)
        self.assertEqual(self.lo_achievement.learning_outcome, self.lo1)
        self.assertEqual(self.lo_achievement.current_percentage, Decimal('80.00'))
    
    def test_is_target_met(self):
        """Test target achievement check"""
        # LO1 target is 75%, achievement is 80%
        self.assertTrue(self.lo_achievement.is_target_met)
