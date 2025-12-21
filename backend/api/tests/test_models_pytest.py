"""
MODELS Test Module - Pytest Version

This module demonstrates pytest-style tests using fixtures.
The original test_models.py still works with pytest-django.
"""

import pytest
from django.core.exceptions import ValidationError
from decimal import Decimal

from api.models import (
    User, ProgramOutcome, Course, Assessment, StudentGrade,
    StudentPOAchievement, LearningOutcome, StudentLOAchievement
)


# =============================================================================
# MODEL TESTS - Pytest Style
# =============================================================================

@pytest.mark.model
@pytest.mark.unit
class TestUserModel:
    """Test User model"""
    
    def test_user_creation(self, student_user):
        """Test user creation"""
        assert 'test_student' in student_user.username
        assert student_user.role == User.Role.STUDENT
        assert student_user.check_password('testpass123')
    
    def test_student_requires_student_id(self, db):
        """Test that student role requires student_id"""
        with pytest.raises(ValidationError):
            user = User(
                username='invalid_student',
                email='invalid@test.com',
                role=User.Role.STUDENT
            )
            user.full_clean()
    
    def test_user_str(self, student_user):
        """Test user string representation"""
        user_str = str(student_user)
        assert 'test_student' in user_str
        assert '(Student)' in user_str
    
    def test_user_get_full_name(self, student_user):
        """Test user full name"""
        assert student_user.get_full_name() == 'Test Student'


@pytest.mark.model
@pytest.mark.unit
class TestProgramOutcomeModel:
    """Test ProgramOutcome model"""
    
    def test_po_creation(self, program_outcome_1):
        """Test PO creation"""
        assert program_outcome_1.code == 'PO1'
        assert program_outcome_1.title == 'Engineering Knowledge'
        assert program_outcome_1.target_percentage == Decimal('70.00')
    
    def test_po_str(self, program_outcome_1):
        """Test PO string representation"""
        assert str(program_outcome_1) == 'PO1: Engineering Knowledge'
    
    def test_po_unique_code(self, db, program_outcome_1):
        """Test PO code uniqueness"""
        with pytest.raises(Exception):
            ProgramOutcome.objects.create(
                code='PO1',  # Duplicate
                title='Duplicate PO',
                description='Test',
                department='Computer Science'
            )


@pytest.mark.model
@pytest.mark.unit
class TestLearningOutcomeModel:
    """Test LearningOutcome model"""
    
    def test_lo_creation(self, learning_outcome_1, course):
        """Test LO creation"""
        assert learning_outcome_1.code == 'LO1'
        assert learning_outcome_1.course == course
        assert learning_outcome_1.target_percentage == Decimal('75.00')
    
    def test_lo_str(self, learning_outcome_1):
        """Test LO string representation"""
        lo_str = str(learning_outcome_1)
        assert 'CSE301' in lo_str
        assert 'LO1' in lo_str
        assert 'Understand Data Structures' in lo_str
    
    def test_lo_unique_per_course(self, db, course, learning_outcome_1):
        """Test LO code uniqueness per course"""
        with pytest.raises(Exception):
            LearningOutcome.objects.create(
                course=course,
                code='LO1',  # Duplicate in same course
                title='Duplicate LO',
                description='Test',
                target_percentage=Decimal('70.00')
            )


@pytest.mark.model
@pytest.mark.unit
class TestCourseModel:
    """Test Course model"""
    
    def test_course_creation(self, course, teacher_user):
        """Test course creation"""
        assert 'CSE301' in course.code
        assert course.teacher == teacher_user
        assert course.credits == 4
    
    def test_course_str(self, course):
        """Test course string representation"""
        course_str = str(course)
        assert 'CSE301' in course_str
        assert '2024-2025' in course_str


@pytest.mark.model
@pytest.mark.unit
class TestAssessmentModel:
    """Test Assessment model"""
    
    def test_assessment_creation(self, assessment):
        """Test assessment creation"""
        assert assessment.title == 'Midterm Exam'
        assert assessment.assessment_type == Assessment.AssessmentType.MIDTERM
        assert assessment.weight == Decimal('30.00')
    
    def test_assessment_feedback_ranges(self, assessment):
        """Test assessment feedback ranges"""
        assessment.feedback_ranges = [
            {'min_score': 90, 'max_score': 100, 'feedback': 'Excellent'},
            {'min_score': 70, 'max_score': 89, 'feedback': 'Good'},
            {'min_score': 0, 'max_score': 69, 'feedback': 'Needs Improvement'}
        ]
        assessment.save()
        
        # Test feedback for different scores
        assert assessment.get_feedback_for_score(95) == 'Excellent'
        assert assessment.get_feedback_for_score(75) == 'Good'
        assert assessment.get_feedback_for_score(50) == 'Needs Improvement'


@pytest.mark.model
@pytest.mark.unit
class TestStudentGradeModel:
    """Test StudentGrade model"""
    
    def test_grade_creation(self, student_grade, student_user, assessment):
        """Test grade creation"""
        assert student_grade.student == student_user
        assert student_grade.assessment == assessment
        assert student_grade.score == Decimal('85.00')
    
    def test_grade_percentage(self, student_grade):
        """Test grade percentage calculation"""
        expected_percentage = (Decimal('85.00') / Decimal('100.00')) * 100
        assert student_grade.percentage == expected_percentage
    
    def test_grade_weighted_contribution(self, student_grade, assessment):
        """Test weighted contribution calculation"""
        percentage = student_grade.percentage
        weight = assessment.weight
        expected = (percentage * weight) / 100
        assert student_grade.weighted_contribution == expected
    
    def test_grade_validation_max_score(self, db, student_user, assessment):
        """Test grade cannot exceed max score"""
        with pytest.raises(ValidationError):
            invalid_grade = StudentGrade(
                student=student_user,
                assessment=assessment,
                score=Decimal('150.00')  # Exceeds max_score of 100
            )
            invalid_grade.clean()


@pytest.mark.model
@pytest.mark.unit
class TestStudentPOAchievementModel:
    """Test StudentPOAchievement model"""
    
    def test_po_achievement_creation(self, po_achievement, student_user, program_outcome_1):
        """Test PO achievement creation"""
        assert po_achievement.student == student_user
        assert po_achievement.program_outcome == program_outcome_1
        assert po_achievement.current_percentage == Decimal('75.00')
    
    def test_is_target_met(self, po_achievement):
        """Test target achievement check"""
        # PO1 target is 70%, achievement is 75%
        assert po_achievement.is_target_met is True
        
        # Test below target
        po_achievement.current_percentage = Decimal('65.00')
        assert po_achievement.is_target_met is False
    
    def test_gap_to_target(self, po_achievement):
        """Test gap to target calculation"""
        gap = po_achievement.gap_to_target
        expected = Decimal('70.00') - Decimal('75.00')  # -5%
        assert gap == expected
    
    def test_completion_rate(self, po_achievement):
        """Test completion rate calculation"""
        rate = po_achievement.completion_rate
        expected = (4 / 5) * 100  # 80%
        assert rate == expected


@pytest.mark.model
@pytest.mark.unit
class TestStudentLOAchievementModel:
    """Test StudentLOAchievement model"""
    
    def test_lo_achievement_creation(self, lo_achievement, student_user, learning_outcome_1):
        """Test LO achievement creation"""
        assert lo_achievement.student == student_user
        assert lo_achievement.learning_outcome == learning_outcome_1
        assert lo_achievement.current_percentage == Decimal('80.00')
    
    def test_is_target_met(self, lo_achievement):
        """Test target achievement check"""
        # LO1 target is 75%, achievement is 80%
        assert lo_achievement.is_target_met is True


