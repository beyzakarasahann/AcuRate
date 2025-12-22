"""
Utility Functions Tests - Pytest Version

Tests for utility functions in api/utils.py
"""

import pytest
from api.utils import (
    sanitize_metadata, sanitize_description, log_activity,
    get_institution_for_user
)
from api.models import ActivityLog, User


# =============================================================================
# SANITIZE METADATA TESTS
# =============================================================================

@pytest.mark.unit
class TestSanitizeMetadata:
    """Test sanitize_metadata function"""
    
    def test_sanitize_metadata_removes_password(self):
        """Test that password keys are redacted"""
        metadata = {
            'password': 'secret123',
            'username': 'testuser',
            'email': 'test@test.com'
        }
        sanitized = sanitize_metadata(metadata)
        
        assert sanitized['password'] == '***REDACTED***'
        assert sanitized['username'] == 'testuser'
        assert sanitized['email'] == 'test@test.com'
    
    def test_sanitize_metadata_removes_token(self):
        """Test that token keys are redacted"""
        metadata = {
            'access_token': 'abc123',
            'refresh_token': 'xyz789',
            'data': 'some_data'
        }
        sanitized = sanitize_metadata(metadata)
        
        assert sanitized['access_token'] == '***REDACTED***'
        assert sanitized['refresh_token'] == '***REDACTED***'
        assert sanitized['data'] == 'some_data'
    
    def test_sanitize_metadata_nested_dict(self):
        """Test sanitization of nested dictionaries"""
        metadata = {
            'user': {
                'username': 'test',
                'password': 'secret',
                'email': 'test@test.com'
            },
            'token': 'abc123'
        }
        sanitized = sanitize_metadata(metadata)
        
        assert sanitized['user']['password'] == '***REDACTED***'
        assert sanitized['user']['username'] == 'test'
        assert sanitized['token'] == '***REDACTED***'
    
    def test_sanitize_metadata_empty_dict(self):
        """Test sanitization of empty dict"""
        sanitized = sanitize_metadata({})
        assert sanitized == {}
    
    def test_sanitize_metadata_none(self):
        """Test sanitization of None"""
        sanitized = sanitize_metadata(None)
        assert sanitized == {}


# =============================================================================
# SANITIZE DESCRIPTION TESTS
# =============================================================================

@pytest.mark.unit
class TestSanitizeDescription:
    """Test sanitize_description function"""
    
    def test_sanitize_description_removes_password(self):
        """Test that passwords in description are redacted"""
        description = "User logged in with password: secret123"
        sanitized = sanitize_description(description)
        
        assert 'password: ***' in sanitized
        assert 'secret123' not in sanitized
    
    def test_sanitize_description_removes_token(self):
        """Test that tokens in description are redacted"""
        description = "Token: abc123xyz used for authentication"
        sanitized = sanitize_description(description)
        
        assert 'token: ***' in sanitized.lower()
        assert 'abc123xyz' not in sanitized
    
    def test_sanitize_description_normal_text(self):
        """Test that normal text is not modified"""
        description = "User created a new course"
        sanitized = sanitize_description(description)
        
        assert sanitized == description
    
    def test_sanitize_description_empty_string(self):
        """Test sanitization of empty string"""
        sanitized = sanitize_description('')
        assert sanitized == ''
    
    def test_sanitize_description_none(self):
        """Test sanitization of None"""
        sanitized = sanitize_description(None)
        assert sanitized == ''


# =============================================================================
# LOG ACTIVITY TESTS
# =============================================================================

@pytest.mark.unit
class TestLogActivity:
    """Test log_activity function"""
    
    def test_log_activity_creates_log(self, db, student_user, institution_user):
        """Test that log_activity creates an activity log"""
        log_activity(
            action_type=ActivityLog.ActionType.USER_CREATED,
            user=student_user,
            institution=institution_user,
            department='Computer Science',
            description='Test user created',
            related_object_type='User',
            related_object_id=student_user.id
        )
        
        log = ActivityLog.objects.first()
        assert log is not None
        assert log.action_type == ActivityLog.ActionType.USER_CREATED
        assert log.user == student_user
        assert log.description == 'Test user created'
    
    def test_log_activity_sanitizes_metadata(self, db, student_user):
        """Test that log_activity sanitizes sensitive metadata"""
        log_activity(
            action_type=ActivityLog.ActionType.LOGIN,
            user=student_user,
            description='User logged in',
            metadata={'password': 'secret123', 'username': 'test'}
        )
        
        log = ActivityLog.objects.first()
        assert log.metadata['password'] == '***REDACTED***'
        assert log.metadata['username'] == 'test'
    
    def test_log_activity_sanitizes_description(self, db, student_user):
        """Test that log_activity sanitizes description"""
        log_activity(
            action_type=ActivityLog.ActionType.LOGIN,
            user=student_user,
            description='User logged in with password: secret123'
        )
        
        log = ActivityLog.objects.first()
        assert 'password: ***' in log.description
        assert 'secret123' not in log.description
    
    def test_log_activity_without_user(self, db):
        """Test log_activity without user"""
        log_activity(
            action_type=ActivityLog.ActionType.LOGIN,
            description='System action'
        )
        
        log = ActivityLog.objects.first()
        assert log is not None
        assert log.user is None
        assert log.description == 'System action'


# =============================================================================
# GET INSTITUTION FOR USER TESTS
# =============================================================================

@pytest.mark.unit
class TestGetInstitutionForUser:
    """Test get_institution_for_user function"""
    
    def test_get_institution_for_institution_user(self, institution_user):
        """Test that institution user returns itself"""
        result = get_institution_for_user(institution_user)
        assert result == institution_user
    
    def test_get_institution_for_student_user(self, db, student_user, institution_user):
        """Test getting institution for student user"""
        # Set student's created_by to institution
        student_user.created_by = institution_user
        student_user.save()
        
        result = get_institution_for_user(student_user)
        assert result == institution_user
    
    def test_get_institution_for_teacher_user(self, db, teacher_user, institution_user):
        """Test getting institution for teacher user"""
        # Set teacher's created_by to institution
        teacher_user.created_by = institution_user
        teacher_user.save()
        
        result = get_institution_for_user(teacher_user)
        assert result == institution_user
    
    def test_get_institution_for_user_none(self):
        """Test get_institution_for_user with None"""
        result = get_institution_for_user(None)
        assert result is None
    
    def test_get_institution_for_user_no_created_by(self, db, student_user):
        """Test get_institution_for_user when user has no created_by"""
        result = get_institution_for_user(student_user)
        # Should return None if no institution found
        assert result is None or isinstance(result, User)



