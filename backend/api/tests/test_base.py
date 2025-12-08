"""
AcuRate - Base Test Case

Base test case with common setup for all test modules.
"""

from django.test import TestCase
from django.utils import timezone
from decimal import Decimal

from ..models import (
    User, Department, ProgramOutcome, Course, CoursePO,
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    LearningOutcome, StudentLOAchievement
)


# =============================================================================
# TEST BASE CLASSES
# =============================================================================

class BaseTestCase(TestCase):
    """Base test case with common setup"""
    
    def setUp(self):
        """Set up test data"""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        
        # Create test users with unique usernames
        self.student = User.objects.create_user(
            username=f'test_student_{unique_id}',
            email=f'student_{unique_id}@test.com',
            password='testpass123',
            role=User.Role.STUDENT,
            student_id=f'2024{unique_id[:3]}',
            department='Computer Science',
            year_of_study=2,
            first_name='Test',
            last_name='Student'
        )
        
        self.teacher = User.objects.create_user(
            username=f'test_teacher_{unique_id}',
            email=f'teacher_{unique_id}@test.com',
            password='testpass123',
            role=User.Role.TEACHER,
            department='Computer Science',
            first_name='Test',
            last_name='Teacher'
        )
        
        self.institution = User.objects.create_user(
            username=f'test_institution_{unique_id}',
            email=f'institution_{unique_id}@test.com',
            password='testpass123',
            role=User.Role.INSTITUTION,
            department='Computer Science',
            first_name='Test',
            last_name='Institution'
        )
        
        # Create department (get or create to avoid duplicates)
        self.department, _ = Department.objects.get_or_create(
            name='Computer Science',
            defaults={
                'code': 'CS',
                'description': 'Computer Science Department'
            }
        )
        
        # Create Program Outcomes (get or create to avoid duplicates)
        self.po1, _ = ProgramOutcome.objects.get_or_create(
            code='PO1',
            defaults={
                'title': 'Engineering Knowledge',
                'description': 'Apply knowledge of mathematics, science, and engineering',
                'department': 'Computer Science',
                'target_percentage': Decimal('70.00')
            }
        )
        
        self.po2, _ = ProgramOutcome.objects.get_or_create(
            code='PO2',
            defaults={
                'title': 'Problem Analysis',
                'description': 'Identify, formulate, and analyze complex engineering problems',
                'department': 'Computer Science',
                'target_percentage': Decimal('75.00')
            }
        )
        
        # Create course (use unique code per test)
        course_code = f'CSE301_{unique_id[:4]}'
        self.course, _ = Course.objects.get_or_create(
            code=course_code,
            academic_year='2024-2025',
            defaults={
                'name': 'Data Structures and Algorithms',
                'description': 'Study of fundamental data structures',
                'department': 'Computer Science',
                'credits': 4,
                'semester': Course.Semester.FALL,
                'teacher': self.teacher
            }
        )
        
        # Create Course-PO mapping
        self.course_po = CoursePO.objects.create(
            course=self.course,
            program_outcome=self.po1,
            weight=Decimal('1.5')
        )
        
        # Create enrollment
        self.enrollment = Enrollment.objects.create(
            student=self.student,
            course=self.course,
            is_active=True
        )
        
        # Create assessment
        self.assessment = Assessment.objects.create(
            course=self.course,
            title='Midterm Exam',
            assessment_type=Assessment.AssessmentType.MIDTERM,
            weight=Decimal('30.00'),
            max_score=Decimal('100.00'),
            due_date=timezone.now(),
            is_active=True
        )
        # Create Learning Outcome
        self.lo1, _ = LearningOutcome.objects.get_or_create(
            course=self.course,
            code='LO1',
            defaults={
                'title': 'Understand Data Structures',
                'description': 'Students will understand arrays, lists, and dictionaries',
                'target_percentage': Decimal('75.00')
            }
        )
