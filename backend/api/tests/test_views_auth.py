"""
Auth Views Tests - Pytest Version

Tests for authentication views in api/views/auth.py
"""

import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import User, ActivityLog, PasswordResetToken

User = get_user_model()


# =============================================================================
# LOGIN VIEW TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestLoginView:
    """Test login_view"""
    
    def test_login_success(self, api_client, db):
        """Test successful login"""
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role=User.Role.STUDENT
        )
        
        response = api_client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'tokens' in response.data
        assert 'access' in response.data['tokens']
        assert 'refresh' in response.data['tokens']
        assert 'user' in response.data
        assert response.data['user']['username'] == 'testuser'
    
    def test_login_invalid_credentials(self, api_client, db):
        """Test login with invalid credentials"""
        User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role=User.Role.STUDENT
        )
        
        response = api_client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False
        assert 'error' in response.data
    
    def test_login_missing_credentials(self, api_client, db):
        """Test login with missing credentials"""
        response = api_client.post('/api/auth/login/', {})
        
        # Rate limiting might return 429, but should not return 500
        assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_429_TOO_MANY_REQUESTS
        ]
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            assert response.data['success'] is False
    
    def test_login_creates_activity_log(self, api_client, db, institution_user):
        """Test that login creates activity log"""
        student = User.objects.create_user(
            username='student',
            email='student@test.com',
            password='testpass123',
            role=User.Role.STUDENT,
            created_by=institution_user
        )
        
        initial_count = ActivityLog.objects.count()
        
        api_client.post('/api/auth/login/', {
            'username': 'student',
            'password': 'testpass123'
        })
        
        assert ActivityLog.objects.count() == initial_count + 1
        log = ActivityLog.objects.latest('created_at')
        assert log.action_type == ActivityLog.ActionType.LOGIN
        assert log.user == student


# =============================================================================
# LOGOUT VIEW TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestLogoutView:
    """Test logout_view"""
    
    def test_logout_success(self, authenticated_student_client, student_user):
        """Test successful logout"""
        response = authenticated_student_client.post('/api/auth/logout/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'message' in response.data
    
    def test_logout_unauthenticated(self, api_client):
        """Test logout without authentication"""
        response = api_client.post('/api/auth/logout/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# =============================================================================
# REGISTER VIEW TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestRegisterView:
    """Test register_view"""
    
    def test_register_student_success(self, api_client, db):
        """Test successful student registration"""
        response = api_client.post('/api/auth/register/', {
            'username': 'newstudent',
            'email': 'newstudent@test.com',
            'password': 'password123',
            'password_confirm': 'password123',
            'role': 'STUDENT',
            'student_id': '2024001',
            'first_name': 'New',
            'last_name': 'Student'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        assert User.objects.filter(username='newstudent').exists()
        
        user = User.objects.get(username='newstudent')
        assert user.role == User.Role.STUDENT
        assert user.student_id == '2024001'
    
    def test_register_password_mismatch(self, api_client, db):
        """Test registration with password mismatch"""
        response = api_client.post('/api/auth/register/', {
            'username': 'newstudent',
            'email': 'newstudent@test.com',
            'password': 'password123',
            'password_confirm': 'different123',
            'role': 'STUDENT',
            'student_id': '2024001'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False
        assert 'errors' in response.data
    
    def test_register_duplicate_username(self, api_client, db):
        """Test registration with duplicate username"""
        User.objects.create_user(
            username='existing',
            email='existing@test.com',
            password='testpass123',
            role=User.Role.STUDENT,
            student_id='2024000'
        )
        
        response = api_client.post('/api/auth/register/', {
            'username': 'existing',
            'email': 'new@test.com',
            'password': 'password123',
            'password_confirm': 'password123',
            'role': 'STUDENT',
            'student_id': '2024001'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
    
    def test_register_cannot_create_teacher(self, api_client, db):
        """Test that public registration cannot create teachers"""
        response = api_client.post('/api/auth/register/', {
            'username': 'newteacher',
            'email': 'newteacher@test.com',
            'password': 'password123',
            'password_confirm': 'password123',
            'role': 'TEACHER'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data


# =============================================================================
# CURRENT USER VIEW TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestCurrentUserView:
    """Test current_user_view"""
    
    def test_get_current_user(self, authenticated_student_client, student_user):
        """Test getting current user"""
        response = authenticated_student_client.get('/api/auth/me/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == student_user.username
        assert response.data['email'] == student_user.email
        assert response.data['role'] == 'STUDENT'
    
    def test_get_current_user_unauthenticated(self, api_client):
        """Test getting current user without authentication"""
        response = api_client.get('/api/auth/me/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# =============================================================================
# FORGOT PASSWORD VIEW TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestForgotPasswordView:
    """Test forgot_password_view"""
    
    def test_forgot_password_by_username(self, api_client, db):
        """Test forgot password with username"""
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role=User.Role.STUDENT
        )
        
        response = api_client.post('/api/auth/forgot-password/', {
            'username': 'testuser'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'message' in response.data
        
        # Check that password reset token was created
        assert PasswordResetToken.objects.filter(user=user).exists()
    
    def test_forgot_password_by_email(self, api_client, db):
        """Test forgot password with email"""
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role=User.Role.STUDENT
        )
        
        response = api_client.post('/api/auth/forgot-password/', {
            'email': 'test@test.com'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert PasswordResetToken.objects.filter(user=user).exists()
    
    def test_forgot_password_user_not_found(self, api_client, db):
        """Test forgot password with non-existent user"""
        response = api_client.post('/api/auth/forgot-password/', {
            'username': 'nonexistent'
        })
        
        # Should return success for security (don't reveal if user exists)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True


# =============================================================================
# CREATE TEACHER VIEW TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestCreateTeacherView:
    """Test create_teacher_view"""
    
    def test_create_teacher_as_institution(self, authenticated_institution_client, db):
        """Test creating teacher as institution"""
        response = authenticated_institution_client.post('/api/teachers/', {
            'username': 'newteacher',
            'email': 'teacher@test.com',
            'password': 'password123',
            'first_name': 'New',
            'last_name': 'Teacher',
            'department': 'Computer Science'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        
        teacher = User.objects.get(username='newteacher')
        assert teacher.role == User.Role.TEACHER
        assert teacher.created_by == authenticated_institution_client.handler._force_user
    
    def test_create_teacher_as_student_forbidden(self, authenticated_student_client):
        """Test that students cannot create teachers"""
        response = authenticated_student_client.post('/api/teachers/', {
            'username': 'newteacher',
            'email': 'teacher@test.com',
            'password': 'password123',
            'first_name': 'New',
            'last_name': 'Teacher'
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


# =============================================================================
# CREATE STUDENT VIEW TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestCreateStudentView:
    """Test create_student_view"""
    
    def test_create_student_as_institution(self, authenticated_institution_client, db):
        """Test creating student as institution"""
        response = authenticated_institution_client.post('/api/students/', {
            'username': 'newstudent',
            'email': 'student@test.com',
            'password': 'password123',
            'first_name': 'New',
            'last_name': 'Student',
            'student_id': '2024001',
            'department': 'Computer Science',
            'year_of_study': 1
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        
        student = User.objects.get(username='newstudent')
        assert student.role == User.Role.STUDENT
        assert student.student_id == '2024001'
    
    def test_create_student_missing_student_id(self, authenticated_institution_client):
        """Test creating student without student_id"""
        response = authenticated_institution_client.post('/api/students/', {
            'username': 'newstudent',
            'email': 'student@test.com',
            'password': 'password123',
            'first_name': 'New',
            'last_name': 'Student',
            'department': 'Computer Science'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data

