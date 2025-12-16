"""CALCULATIONS Test Module"""

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
# CALCULATION TESTS
# =============================================================================

class CalculationTest(BaseTestCase):
    """Test calculation logic"""
    
    def test_grade_percentage_calculation(self):
        """Test grade percentage calculation"""
        grade = StudentGrade.objects.create(
            student=self.student,
            assessment=self.assessment,
            score=Decimal('85.00')
        )
        # Assessment max_score is 100
        expected_percentage = (Decimal('85.00') / Decimal('100.00')) * 100
        self.assertEqual(grade.percentage, expected_percentage)
    
    def test_grade_weighted_contribution(self):
        """Test weighted contribution calculation"""
        grade = StudentGrade.objects.create(
            student=self.student,
            assessment=self.assessment,
            score=Decimal('80.00')
        )
        # Assessment weight is 30%
        # Score 80/100 = 80%
        # Weighted: 80% * 30% = 24%
        percentage = grade.percentage
        weight = self.assessment.weight
        expected = (percentage * weight) / 100
        self.assertEqual(grade.weighted_contribution, expected)
    
    def test_po_achievement_target_check(self):
        """Test PO achievement target check"""
        achievement = StudentPOAchievement.objects.create(
            student=self.student,
            program_outcome=self.po1,  # Target: 70%
            current_percentage=Decimal('75.00')
        )
        self.assertTrue(achievement.is_target_met)
        
        achievement.current_percentage = Decimal('65.00')
        self.assertFalse(achievement.is_target_met)
    
    def test_lo_achievement_target_check(self):
        """Test LO achievement target check"""
        achievement = StudentLOAchievement.objects.create(
            student=self.student,
            learning_outcome=self.lo1,  # Target: 75%
            current_percentage=Decimal('80.00')
        )
        self.assertTrue(achievement.is_target_met)
        
        achievement.current_percentage = Decimal('70.00')
        self.assertFalse(achievement.is_target_met)
