"""
Additional Model Tests - Pytest Version

Tests for models that were not covered in test_models.py:
- Department
- Enrollment
- ContactRequest
- ActivityLog
- AssessmentLO
- LOPO
"""

import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError

from api.models import (
    Department, Enrollment, ContactRequest, ActivityLog,
    AssessmentLO, LOPO
)


# =============================================================================
# DEPARTMENT MODEL TESTS
# =============================================================================

@pytest.mark.model
@pytest.mark.unit
class TestDepartmentModel:
    """Test Department model"""
    
    def test_department_creation(self, db):
        """Test department creation"""
        dept = Department.objects.create(
            name='Computer Science',
            code='CS',
            description='Computer Science Department'
        )
        assert dept.name == 'Computer Science'
        assert dept.code == 'CS'
        assert dept.description == 'Computer Science Department'
    
    def test_department_str(self, department):
        """Test department string representation"""
        assert str(department) == 'Computer Science'
    
    def test_department_unique_name(self, db, department):
        """Test department name uniqueness"""
        with pytest.raises(Exception):
            Department.objects.create(
                name='Computer Science',  # Duplicate
                code='CS2'
            )
    
    def test_department_ordering(self, db):
        """Test department ordering by name"""
        dept1 = Department.objects.create(name='Zebra Department', code='ZD')
        dept2 = Department.objects.create(name='Alpha Department', code='AD')
        
        departments = list(Department.objects.all())
        # Should be ordered by name
        assert departments[0].name == 'Alpha Department'
        assert departments[-1].name == 'Zebra Department'


# =============================================================================
# ENROLLMENT MODEL TESTS
# =============================================================================

@pytest.mark.model
@pytest.mark.unit
class TestEnrollmentModel:
    """Test Enrollment model"""
    
    def test_enrollment_creation(self, enrollment, student_user, course):
        """Test enrollment creation"""
        assert enrollment.student == student_user
        assert enrollment.course == course
        assert enrollment.is_active is True
    
    def test_enrollment_str(self, enrollment, student_user, course):
        """Test enrollment string representation"""
        enrollment_str = str(enrollment)
        assert student_user.username in enrollment_str or str(student_user.id) in enrollment_str
        assert course.code in enrollment_str
    
    def test_enrollment_unique_student_course(self, db, student_user, course):
        """Test that a student can only enroll once per course"""
        Enrollment.objects.create(
            student=student_user,
            course=course,
            is_active=True
        )
        
        # Try to create duplicate enrollment
        with pytest.raises(Exception):
            Enrollment.objects.create(
                student=student_user,
                course=course,
                is_active=True
            )
    
    def test_enrollment_final_grade(self, enrollment, db):
        """Test enrollment final grade"""
        enrollment.final_grade = Decimal('85.50')
        enrollment.save()
        
        assert enrollment.final_grade == Decimal('85.50')


# =============================================================================
# CONTACT REQUEST MODEL TESTS
# =============================================================================

@pytest.mark.model
@pytest.mark.unit
class TestContactRequestModel:
    """Test ContactRequest model"""
    
    @pytest.fixture
    def contact_request(self, db):
        """Create a test contact request"""
        return ContactRequest.objects.create(
            institution_name='Test University',
            institution_type=ContactRequest.InstitutionType.UNIVERSITY,
            contact_name='John Doe',
            contact_email='john@testuniversity.edu',
            contact_phone='+1234567890',
            request_type=ContactRequest.RequestType.DEMO,
            message='I would like to request a demo',
            status='pending'
        )
    
    def test_contact_request_creation(self, contact_request):
        """Test contact request creation"""
        assert contact_request.institution_name == 'Test University'
        assert contact_request.institution_type == ContactRequest.InstitutionType.UNIVERSITY
        assert contact_request.contact_name == 'John Doe'
        assert contact_request.contact_email == 'john@testuniversity.edu'
        assert contact_request.request_type == ContactRequest.RequestType.DEMO
        assert contact_request.status == 'pending'
    
    def test_contact_request_str(self, contact_request):
        """Test contact request string representation"""
        request_str = str(contact_request)
        assert 'Test University' in request_str
        assert 'John Doe' in request_str
        assert 'Demo' in request_str or 'demo' in request_str
    
    def test_contact_request_status_choices(self, db):
        """Test contact request status choices"""
        request = ContactRequest.objects.create(
            institution_name='Test',
            institution_type=ContactRequest.InstitutionType.UNIVERSITY,
            contact_name='Test',
            contact_email='test@test.com',
            request_type=ContactRequest.RequestType.DEMO,
            status='completed'
        )
        assert request.status == 'completed'
    
    def test_contact_request_ordering(self, db):
        """Test contact request ordering by created_at descending"""
        request1 = ContactRequest.objects.create(
            institution_name='First',
            institution_type=ContactRequest.InstitutionType.UNIVERSITY,
            contact_name='First',
            contact_email='first@test.com',
            request_type=ContactRequest.RequestType.DEMO
        )
        
        request2 = ContactRequest.objects.create(
            institution_name='Second',
            institution_type=ContactRequest.InstitutionType.UNIVERSITY,
            contact_name='Second',
            contact_email='second@test.com',
            request_type=ContactRequest.RequestType.DEMO
        )
        
        requests = list(ContactRequest.objects.all())
        # Should be ordered by -created_at (newest first)
        assert requests[0].institution_name == 'Second'
        assert requests[1].institution_name == 'First'


# =============================================================================
# ACTIVITY LOG MODEL TESTS
# =============================================================================

@pytest.mark.model
@pytest.mark.unit
class TestActivityLogModel:
    """Test ActivityLog model"""
    
    @pytest.fixture
    def activity_log(self, db, student_user, institution_user):
        """Create a test activity log"""
        return ActivityLog.objects.create(
            action_type=ActivityLog.ActionType.USER_CREATED,
            user=student_user,
            institution=institution_user,
            department='Computer Science',
            description='Test user created',
            related_object_type='User',
            related_object_id=student_user.id
        )
    
    def test_activity_log_creation(self, activity_log, student_user):
        """Test activity log creation"""
        assert activity_log.action_type == ActivityLog.ActionType.USER_CREATED
        assert activity_log.user == student_user
        assert activity_log.description == 'Test user created'
        assert activity_log.related_object_type == 'User'
        assert activity_log.related_object_id == student_user.id
    
    def test_activity_log_str(self, activity_log):
        """Test activity log string representation"""
        log_str = str(activity_log)
        assert 'User Created' in log_str or 'user_created' in log_str
        assert 'Test user created' in log_str
    
    def test_activity_log_action_types(self, db, student_user):
        """Test different activity log action types"""
        actions = [
            ActivityLog.ActionType.LOGIN,
            ActivityLog.ActionType.COURSE_CREATED,
            ActivityLog.ActionType.GRADE_ASSIGNED,
        ]
        
        for action in actions:
            log = ActivityLog.objects.create(
                action_type=action,
                user=student_user,
                description=f'Test {action}'
            )
            assert log.action_type == action
    
    def test_activity_log_ordering(self, db, student_user):
        """Test activity log ordering by created_at descending"""
        log1 = ActivityLog.objects.create(
            action_type=ActivityLog.ActionType.LOGIN,
            user=student_user,
            description='First log'
        )
        
        log2 = ActivityLog.objects.create(
            action_type=ActivityLog.ActionType.LOGIN,
            user=student_user,
            description='Second log'
        )
        
        logs = list(ActivityLog.objects.all())
        # Should be ordered by -created_at (newest first)
        assert logs[0].description == 'Second log'
        assert logs[1].description == 'First log'
    
    def test_activity_log_metadata(self, db, student_user):
        """Test activity log metadata JSON field"""
        metadata = {'key': 'value', 'count': 5}
        log = ActivityLog.objects.create(
            action_type=ActivityLog.ActionType.LOGIN,
            user=student_user,
            description='Test with metadata',
            metadata=metadata
        )
        assert log.metadata == metadata
        assert log.metadata['key'] == 'value'


# =============================================================================
# ASSESSMENTLO MODEL TESTS
# =============================================================================

@pytest.mark.model
@pytest.mark.unit
class TestAssessmentLOModel:
    """Test AssessmentLO model"""
    
    @pytest.fixture
    def assessment_lo(self, db, assessment, learning_outcome_1):
        """Create a test AssessmentLO mapping"""
        return AssessmentLO.objects.create(
            assessment=assessment,
            learning_outcome=learning_outcome_1,
            weight=Decimal('1.5')
        )
    
    def test_assessment_lo_creation(self, assessment_lo, assessment, learning_outcome_1):
        """Test AssessmentLO creation"""
        assert assessment_lo.assessment == assessment
        assert assessment_lo.learning_outcome == learning_outcome_1
        assert assessment_lo.weight == Decimal('1.5')
    
    def test_assessment_lo_str(self, assessment_lo):
        """Test AssessmentLO string representation"""
        lo_str = str(assessment_lo)
        assert 'Midterm Exam' in lo_str or assessment_lo.assessment.title in lo_str
        assert 'LO1' in lo_str or assessment_lo.learning_outcome.code in lo_str
        assert 'weight' in lo_str.lower()
    
    def test_assessment_lo_unique_together(self, db, assessment, learning_outcome_1):
        """Test AssessmentLO unique together constraint"""
        AssessmentLO.objects.create(
            assessment=assessment,
            learning_outcome=learning_outcome_1,
            weight=Decimal('1.0')
        )
        
        # Try to create duplicate mapping
        with pytest.raises(Exception):
            AssessmentLO.objects.create(
                assessment=assessment,
                learning_outcome=learning_outcome_1,
                weight=Decimal('2.0')
            )
    
    def test_assessment_lo_weight_validation(self, db, assessment, learning_outcome_1):
        """Test AssessmentLO weight validation"""
        # Valid weight
        valid_lo = AssessmentLO.objects.create(
            assessment=assessment,
            learning_outcome=learning_outcome_1,
            weight=Decimal('5.0')
        )
        assert valid_lo.weight == Decimal('5.0')
        
        # Weight should be between 0.01 and 10.0
        # This is validated at the model level, so we test the constraint
        invalid_lo = AssessmentLO(
            assessment=assessment,
            learning_outcome=learning_outcome_1,
            weight=Decimal('15.0')  # Exceeds max
        )
        with pytest.raises(ValidationError):
            invalid_lo.full_clean()


# =============================================================================
# LOPO MODEL TESTS
# =============================================================================

@pytest.mark.model
@pytest.mark.unit
class TestLOPOModel:
    """Test LOPO model"""
    
    @pytest.fixture
    def lopo(self, db, learning_outcome_1, program_outcome_1):
        """Create a test LOPO mapping"""
        return LOPO.objects.create(
            learning_outcome=learning_outcome_1,
            program_outcome=program_outcome_1,
            weight=Decimal('2.0')
        )
    
    def test_lopo_creation(self, lopo, learning_outcome_1, program_outcome_1):
        """Test LOPO creation"""
        assert lopo.learning_outcome == learning_outcome_1
        assert lopo.program_outcome == program_outcome_1
        assert lopo.weight == Decimal('2.0')
    
    def test_lopo_str(self, lopo):
        """Test LOPO string representation"""
        lopo_str = str(lopo)
        assert 'LO1' in lopo_str or lopo.learning_outcome.code in lopo_str
        assert 'PO1' in lopo_str or lopo.program_outcome.code in lopo_str
        assert 'weight' in lopo_str.lower()
    
    def test_lopo_unique_together(self, db, learning_outcome_1, program_outcome_1):
        """Test LOPO unique together constraint"""
        LOPO.objects.create(
            learning_outcome=learning_outcome_1,
            program_outcome=program_outcome_1,
            weight=Decimal('1.0')
        )
        
        # Try to create duplicate mapping
        with pytest.raises(Exception):
            LOPO.objects.create(
                learning_outcome=learning_outcome_1,
                program_outcome=program_outcome_1,
                weight=Decimal('2.0')
            )
    
    def test_lopo_weight_validation(self, db, learning_outcome_1, program_outcome_1):
        """Test LOPO weight validation"""
        # Valid weight
        valid_lopo = LOPO.objects.create(
            learning_outcome=learning_outcome_1,
            program_outcome=program_outcome_1,
            weight=Decimal('3.0')
        )
        assert valid_lopo.weight == Decimal('3.0')
        
        # Weight should be between 0.01 and 10.0
        invalid_lopo = LOPO(
            learning_outcome=learning_outcome_1,
            program_outcome=program_outcome_1,
            weight=Decimal('0.005')  # Below min
        )
        with pytest.raises(ValidationError):
            invalid_lopo.full_clean()









