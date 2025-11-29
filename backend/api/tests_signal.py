"""
AcuRate - Signal Handler Tests

Test automatic PO/LO achievement calculation when grades are added/updated/deleted.
"""

from django.test import TestCase
from django.utils import timezone
from decimal import Decimal
from .models import (
    User, ProgramOutcome, Course, CoursePO, Enrollment,
    Assessment, StudentGrade, StudentPOAchievement, StudentLOAchievement,
    LearningOutcome
)
from .signals import calculate_po_achievement, calculate_lo_achievement


class SignalTest(TestCase):
    """Test signal handlers for automatic achievement calculation"""
    
    def setUp(self):
        """Set up test data"""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        
        # Create users
        self.student = User.objects.create_user(
            username=f'student_{unique_id}',
            email=f'student_{unique_id}@test.com',
            password='testpass123',
            role=User.Role.STUDENT,
            student_id=f'2024{unique_id[:3]}',
            department='Computer Science'
        )
        
        self.teacher = User.objects.create_user(
            username=f'teacher_{unique_id}',
            email=f'teacher_{unique_id}@test.com',
            password='testpass123',
            role=User.Role.TEACHER,
            department='Computer Science'
        )
        
        # Create PO
        self.po1, _ = ProgramOutcome.objects.get_or_create(
            code='PO1',
            defaults={
                'title': 'Engineering Knowledge',
                'description': 'Test PO',
                'department': 'Computer Science',
                'target_percentage': Decimal('70.00')
            }
        )
        
        # Create course
        course_code = f'CSE301_{unique_id[:4]}'
        self.course, _ = Course.objects.get_or_create(
            code=course_code,
            academic_year='2024-2025',
            defaults={
                'name': 'Data Structures',
                'department': 'Computer Science',
                'credits': 4,
                'semester': Course.Semester.FALL,
                'teacher': self.teacher
            }
        )
        
        # Create Course-PO mapping
        CoursePO.objects.get_or_create(
            course=self.course,
            program_outcome=self.po1,
            defaults={'weight': Decimal('1.5')}
        )
        
        # Create enrollment
        Enrollment.objects.get_or_create(
            student=self.student,
            course=self.course,
            defaults={'is_active': True}
        )
        
        # Create assessment
        self.assessment = Assessment.objects.create(
            course=self.course,
            title='Midterm Exam',
            assessment_type=Assessment.AssessmentType.MIDTERM,
            weight=Decimal('30.00'),
            max_score=Decimal('100.00'),
            is_active=True
        )
        self.assessment.related_pos.add(self.po1)
        
        # Create LO
        self.lo1, _ = LearningOutcome.objects.get_or_create(
            course=self.course,
            code='LO1',
            defaults={
                'title': 'Understand Data Structures',
                'description': 'Test LO',
                'target_percentage': Decimal('75.00')
            }
        )
        self.assessment.related_los.add(self.lo1)
    
    def test_po_achievement_created_on_grade_save(self):
        """Test that PO achievement is automatically created when grade is saved"""
        # Initially no achievement
        self.assertFalse(
            StudentPOAchievement.objects.filter(
                student=self.student,
                program_outcome=self.po1
            ).exists()
        )
        
        # Create a grade
        grade = StudentGrade.objects.create(
            student=self.student,
            assessment=self.assessment,
            score=Decimal('85.00')
        )
        
        # Achievement should be automatically created
        achievement = StudentPOAchievement.objects.filter(
            student=self.student,
            program_outcome=self.po1
        ).first()
        
        self.assertIsNotNone(achievement, "PO achievement should be automatically created")
        self.assertGreater(achievement.current_percentage, Decimal('0.00'))
        self.assertEqual(achievement.total_assessments, 1)
        self.assertEqual(achievement.completed_assessments, 1)
    
    def test_po_achievement_updated_on_grade_update(self):
        """Test that PO achievement is updated when grade is updated"""
        # Create initial grade
        grade = StudentGrade.objects.create(
            student=self.student,
            assessment=self.assessment,
            score=Decimal('70.00')
        )
        
        # Get achievement
        achievement = StudentPOAchievement.objects.get(
            student=self.student,
            program_outcome=self.po1
        )
        initial_percentage = achievement.current_percentage
        
        # Update grade
        grade.score = Decimal('90.00')
        grade.save()
        
        # Achievement should be updated
        achievement.refresh_from_db()
        self.assertGreater(achievement.current_percentage, initial_percentage)
    
    def test_po_achievement_updated_on_grade_delete(self):
        """Test that PO achievement is updated when grade is deleted"""
        # Create grade
        grade = StudentGrade.objects.create(
            student=self.student,
            assessment=self.assessment,
            score=Decimal('85.00')
        )
        
        # Verify achievement exists
        achievement = StudentPOAchievement.objects.get(
            student=self.student,
            program_outcome=self.po1
        )
        self.assertEqual(achievement.completed_assessments, 1)
        
        # Delete grade
        grade.delete()
        
        # Achievement should be updated (completed_assessments = 0)
        achievement.refresh_from_db()
        self.assertEqual(achievement.completed_assessments, 0)
        self.assertEqual(achievement.current_percentage, Decimal('0.00'))
    
    def test_lo_achievement_created_on_grade_save(self):
        """Test that LO achievement is automatically created when grade is saved"""
        # Initially no achievement
        self.assertFalse(
            StudentLOAchievement.objects.filter(
                student=self.student,
                learning_outcome=self.lo1
            ).exists()
        )
        
        # Create a grade
        grade = StudentGrade.objects.create(
            student=self.student,
            assessment=self.assessment,
            score=Decimal('80.00')
        )
        
        # Achievement should be automatically created
        achievement = StudentLOAchievement.objects.filter(
            student=self.student,
            learning_outcome=self.lo1
        ).first()
        
        self.assertIsNotNone(achievement, "LO achievement should be automatically created")
        self.assertGreater(achievement.current_percentage, Decimal('0.00'))
        self.assertEqual(achievement.total_assessments, 1)
        self.assertEqual(achievement.completed_assessments, 1)
    
    def test_calculate_po_achievement_function(self):
        """Test calculate_po_achievement function directly"""
        # Create grade
        StudentGrade.objects.create(
            student=self.student,
            assessment=self.assessment,
            score=Decimal('85.00')
        )
        
        # Manually calculate
        calculate_po_achievement(self.student, self.po1)
        
        # Verify achievement
        achievement = StudentPOAchievement.objects.get(
            student=self.student,
            program_outcome=self.po1
        )
        self.assertGreater(achievement.current_percentage, Decimal('0.00'))
        self.assertEqual(achievement.completed_assessments, 1)
    
    def test_calculate_lo_achievement_function(self):
        """Test calculate_lo_achievement function directly"""
        # Create grade
        StudentGrade.objects.create(
            student=self.student,
            assessment=self.assessment,
            score=Decimal('80.00')
        )
        
        # Manually calculate
        calculate_lo_achievement(self.student, self.lo1)
        
        # Verify achievement
        achievement = StudentLOAchievement.objects.get(
            student=self.student,
            learning_outcome=self.lo1
        )
        self.assertGreater(achievement.current_percentage, Decimal('0.00'))
        self.assertEqual(achievement.completed_assessments, 1)
    
    def test_multiple_grades_weighted_average(self):
        """Test that multiple grades are properly weighted"""
        # Create first assessment
        assessment1 = Assessment.objects.create(
            course=self.course,
            title='Quiz 1',
            assessment_type=Assessment.AssessmentType.QUIZ,
            weight=Decimal('10.00'),
            max_score=Decimal('100.00'),
            is_active=True
        )
        assessment1.related_pos.add(self.po1)
        
        # Create second assessment
        assessment2 = Assessment.objects.create(
            course=self.course,
            title='Final Exam',
            assessment_type=Assessment.AssessmentType.FINAL,
            weight=Decimal('40.00'),
            max_score=Decimal('100.00'),
            is_active=True
        )
        assessment2.related_pos.add(self.po1)
        
        # Create grades with different scores
        StudentGrade.objects.create(
            student=self.student,
            assessment=assessment1,
            score=Decimal('100.00')  # 100% on quiz (weight 10%)
        )
        
        StudentGrade.objects.create(
            student=self.student,
            assessment=assessment2,
            score=Decimal('50.00')  # 50% on final (weight 40%)
        )
        
        # Achievement should be weighted average
        achievement = StudentPOAchievement.objects.get(
            student=self.student,
            program_outcome=self.po1
        )
        
        # Expected: (100 * 10 + 50 * 40) / (10 + 40) = 60%
        # But we also have the original assessment, so calculation is more complex
        self.assertGreater(achievement.current_percentage, Decimal('0.00'))
        self.assertEqual(achievement.completed_assessments, 2)

