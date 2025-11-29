"""
AcuRate - Comprehensive Test Suite

This module contains all tests for the AcuRate system:
- Model tests
- API endpoint tests
- Permission tests
- Calculation tests
- Serializer validation tests
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
import json

from .models import (
    User, Department, ProgramOutcome, Course, CoursePO,
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    LearningOutcome, StudentLOAchievement, ContactRequest
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
        self.assessment.related_pos.add(self.po1)
        
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
        self.assessment.related_los.add(self.lo1)


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


# =============================================================================
# API ENDPOINT TESTS
# =============================================================================

class AuthenticationAPITest(TestCase):
    """Test authentication endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role=User.Role.STUDENT
        )
    
    def test_login_success(self):
        """Test successful login"""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_get_current_user(self):
        """Test getting current user"""
        self.client.force_authenticate(user=self.user)
        # Try both possible endpoints
        response = self.client.get('/api/auth/me/')
        if response.status_code != status.HTTP_200_OK:
            response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Response might be nested in 'user' or 'data' key
        username = response.data.get('username') or response.data.get('user', {}).get('username') or response.data.get('data', {}).get('username', '')
        self.assertIn('testuser', username)


class ProgramOutcomeAPITest(BaseTestCase):
    """Test Program Outcome API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
    
    def test_list_pos_unauthenticated(self):
        """Test listing POs without authentication"""
        response = self.client.get('/api/program-outcomes/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_pos_authenticated(self):
        """Test listing POs with authentication"""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/program-outcomes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_create_po_as_institution(self):
        """Test creating PO as institution"""
        import uuid
        unique_code = f'PO3_{uuid.uuid4().hex[:6]}'
        self.client.force_authenticate(user=self.institution)
        response = self.client.post('/api/program-outcomes/', {
            'code': unique_code,
            'title': 'Design Solutions',
            'description': 'Design solutions for complex problems',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], unique_code)
    
    def test_create_po_as_student_forbidden(self):
        """Test that students cannot create POs"""
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/program-outcomes/', {
            'code': 'PO3',
            'title': 'Design Solutions',
            'description': 'Test',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_po_as_institution(self):
        """Test updating PO as institution"""
        self.client.force_authenticate(user=self.institution)
        response = self.client.patch(f'/api/program-outcomes/{self.po1.id}/', {
            'title': 'Updated Title'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')
    
    def test_delete_po_as_institution(self):
        """Test deleting PO as institution"""
        self.client.force_authenticate(user=self.institution)
        response = self.client.delete(f'/api/program-outcomes/{self.po1.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ProgramOutcome.objects.filter(id=self.po1.id).exists())


class LearningOutcomeAPITest(BaseTestCase):
    """Test Learning Outcome API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
    
    def test_create_lo_as_teacher(self):
        """Test creating LO as teacher"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/learning-outcomes/', {
            'course': self.course.id,
            'code': 'LO2',
            'title': 'Implement Algorithms',
            'description': 'Students will implement various algorithms',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 'LO2')
    
    def test_create_lo_as_student_forbidden(self):
        """Test that students cannot create LOs"""
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/learning-outcomes/', {
            'course': self.course.id,
            'code': 'LO2',
            'title': 'Test LO',
            'description': 'Test',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_list_los_by_course(self):
        """Test listing LOs filtered by course"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(f'/api/learning-outcomes/?course={self.course.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)


class CourseAPITest(BaseTestCase):
    """Test Course API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
    
    def test_list_courses(self):
        """Test listing courses"""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_create_course_as_teacher(self):
        """Test creating course as teacher"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/courses/', {
            'code': 'CSE302',
            'name': 'Database Systems',
            'description': 'Introduction to databases',
            'department': 'Computer Science',
            'credits': 3,
            'semester': Course.Semester.FALL,
            'academic_year': '2024-2025',
            'teacher': self.teacher.id
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 'CSE302')


class StudentGradeAPITest(BaseTestCase):
    """Test Student Grade API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.grade = StudentGrade.objects.create(
            student=self.student,
            assessment=self.assessment,
            score=Decimal('85.00')
        )
    
    def test_create_grade_as_teacher(self):
        """Test creating grade as teacher"""
        self.client.force_authenticate(user=self.teacher)
        new_assessment = Assessment.objects.create(
            course=self.course,
            title='Quiz 1',
            assessment_type=Assessment.AssessmentType.QUIZ,
            weight=Decimal('10.00'),
            max_score=Decimal('100.00'),
            is_active=True
        )
        
        response = self.client.post('/api/grades/', {
            'student': self.student.id,
            'assessment': new_assessment.id,
            'score': '90.00',
            'feedback': 'Excellent work!'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data['score']), 90.00)
    
    def test_list_grades_as_student(self):
        """Test student can view their own grades"""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/grades/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Student should only see their own grades
        for grade_data in response.data:
            self.assertEqual(grade_data['student'], self.student.id)


# =============================================================================
# PERMISSION TESTS
# =============================================================================

class PermissionTest(BaseTestCase):
    """Test role-based permissions"""
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
    
    def test_institution_can_create_po(self):
        """Test institution can create PO"""
        import uuid
        unique_code = f'PO3_{uuid.uuid4().hex[:6]}'
        self.client.force_authenticate(user=self.institution)
        response = self.client.post('/api/program-outcomes/', {
            'code': unique_code,
            'title': 'Test PO',
            'description': 'Test',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_teacher_cannot_create_po(self):
        """Test teacher cannot create PO"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/program-outcomes/', {
            'code': 'PO3',
            'title': 'Test PO',
            'description': 'Test',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_teacher_can_create_lo(self):
        """Test teacher can create LO"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/learning-outcomes/', {
            'course': self.course.id,
            'code': 'LO2',
            'title': 'Test LO',
            'description': 'Test',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_institution_cannot_create_lo(self):
        """Test institution cannot create LO"""
        self.client.force_authenticate(user=self.institution)
        response = self.client.post('/api/learning-outcomes/', {
            'course': self.course.id,
            'code': 'LO2',
            'title': 'Test LO',
            'description': 'Test',
            'target_percentage': '70.00'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_student_can_view_own_grades(self):
        """Test student can view their own grades"""
        self.client.force_authenticate(user=self.student)
        grade = StudentGrade.objects.create(
            student=self.student,
            assessment=self.assessment,
            score=Decimal('85.00')
        )
        response = self.client.get(f'/api/grades/{grade.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_student_cannot_view_other_grades(self):
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
            assessment=self.assessment,
            score=Decimal('90.00')
        )
        
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f'/api/grades/{other_grade.id}/')
        # Should either return 404 or 403
        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])


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
    
    def test_user_create_serializer_password_mismatch(self):
        """Test password confirmation validation"""
        from .serializers import UserCreateSerializer
        
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
        from .serializers import UserCreateSerializer
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


# =============================================================================
# INTEGRATION TESTS
# =============================================================================

class IntegrationTest(BaseTestCase):
    """Test complete workflows"""
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
    
    def test_complete_workflow_po_creation_to_achievement(self):
        """Test complete workflow: PO creation -> Course mapping -> Assessment -> Grade -> Achievement"""
        import uuid
        unique_code = f'PO3_{uuid.uuid4().hex[:6]}'
        # 1. Institution creates PO
        self.client.force_authenticate(user=self.institution)
        po_response = self.client.post('/api/program-outcomes/', {
            'code': unique_code,
            'title': 'Design Solutions',
            'description': 'Design solutions for complex problems',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        self.assertEqual(po_response.status_code, status.HTTP_201_CREATED)
        po_id = po_response.data['id']
        
        # 2. Teacher creates assessment linked to PO
        self.client.force_authenticate(user=self.teacher)
        assessment_response = self.client.post('/api/assessments/', {
            'course': self.course.id,
            'title': 'Final Exam',
            'assessment_type': Assessment.AssessmentType.FINAL,
            'weight': '40.00',
            'max_score': '100.00',
            'related_pos': [po_id],
            'is_active': True
        })
        self.assertEqual(assessment_response.status_code, status.HTTP_201_CREATED)
        assessment_id = assessment_response.data['id']
        
        # 3. Teacher creates grade
        grade_response = self.client.post('/api/grades/', {
            'student': self.student.id,
            'assessment': assessment_id,
            'score': '85.00',
            'feedback': 'Good work'
        })
        self.assertEqual(grade_response.status_code, status.HTTP_201_CREATED)
        
        # 4. Verify grade was created
        grade = StudentGrade.objects.get(id=grade_response.data['id'])
        self.assertEqual(grade.score, Decimal('85.00'))
        self.assertEqual(grade.student, self.student)
        
        # 5. Verify PO achievement was automatically calculated
        po_achievement = StudentPOAchievement.objects.filter(
            student=self.student,
            program_outcome_id=po_id
        ).first()
        self.assertIsNotNone(po_achievement, "PO achievement should be automatically created")
        self.assertGreater(po_achievement.current_percentage, Decimal('0.00'))
    
    def test_complete_workflow_lo_creation(self):
        """Test complete workflow: LO creation -> Assessment link -> Grade"""
        # 1. Teacher creates LO
        self.client.force_authenticate(user=self.teacher)
        lo_response = self.client.post('/api/learning-outcomes/', {
            'course': self.course.id,
            'code': 'LO2',
            'title': 'Implement Algorithms',
            'description': 'Students will implement algorithms',
            'target_percentage': '70.00'
        })
        self.assertEqual(lo_response.status_code, status.HTTP_201_CREATED)
        lo_id = lo_response.data['id']
        
        # 2. Teacher links LO to assessment
        self.assessment.related_los.add(LearningOutcome.objects.get(id=lo_id))
        
        # 3. Verify LO is linked
        self.assertIn(LearningOutcome.objects.get(id=lo_id), self.assessment.related_los.all())
