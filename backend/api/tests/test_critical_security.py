"""
Critical Security and Functionality Tests - Pytest Version

Tests for critical security and functionality requirements:
1. Login/auth çalışıyor mu?
2. Yetkisiz erişim engelleniyor mu?
3. Kritik endpoint 500 atmıyor mu?
4. Boş input hata veriyor mu?
"""

import pytest
from rest_framework import status
from decimal import Decimal

from api.models import User, ProgramOutcome, Course, Assessment, StudentGrade


# =============================================================================
# 1. LOGIN/AUTH ÇALIŞIYOR MU?
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestAuthFunctionality:
    """Test that authentication works correctly"""
    
    def test_login_returns_tokens(self, api_client, db):
        """Test that login returns valid JWT tokens"""
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
        assert 'tokens' in response.data
        assert 'access' in response.data['tokens']
        assert 'refresh' in response.data['tokens']
        # Verify tokens are not empty
        assert len(response.data['tokens']['access']) > 0
        assert len(response.data['tokens']['refresh']) > 0
    
    def test_token_authentication_works(self, api_client, db):
        """Test that JWT token authentication works"""
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role=User.Role.STUDENT
        )
        
        # Login to get token
        login_response = api_client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        token = login_response.data['tokens']['access']
        
        # Use token to access protected endpoint
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = api_client.get('/api/auth/me/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == 'testuser'
    
    def test_logout_invalidates_session(self, authenticated_student_client, student_user):
        """Test that logout works"""
        response = authenticated_student_client.post('/api/auth/logout/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True


# =============================================================================
# 2. YETKİSİZ ERİŞİM ENGELLENİYOR MU?
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestUnauthorizedAccess:
    """Test that unauthorized access is blocked"""
    
    def test_unauthenticated_cannot_access_protected_endpoints(self, api_client):
        """Test that unauthenticated users cannot access protected endpoints"""
        protected_endpoints = [
            ('GET', '/api/auth/me/'),
            ('GET', '/api/dashboard/student/'),
            ('GET', '/api/dashboard/teacher/'),
            ('GET', '/api/dashboard/institution/'),
            ('GET', '/api/program-outcomes/'),
            ('GET', '/api/courses/'),
            ('GET', '/api/grades/'),
            ('POST', '/api/program-outcomes/'),
            ('POST', '/api/courses/'),
        ]
        
        for method, endpoint in protected_endpoints:
            if method == 'GET':
                response = api_client.get(endpoint)
            elif method == 'POST':
                response = api_client.post(endpoint, {})
            
            assert response.status_code == status.HTTP_401_UNAUTHORIZED, \
                f"Endpoint {endpoint} should require authentication"
    
    def test_student_cannot_create_po(self, authenticated_student_client):
        """Test that students cannot create Program Outcomes"""
        response = authenticated_student_client.post('/api/program-outcomes/', {
            'code': 'PO_TEST',
            'title': 'Test PO',
            'description': 'Test',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_student_cannot_create_lo(self, authenticated_student_client, course):
        """Test that students cannot create Learning Outcomes"""
        response = authenticated_student_client.post('/api/learning-outcomes/', {
            'course': course.id,
            'code': 'LO_TEST',
            'title': 'Test LO',
            'description': 'Test',
            'target_percentage': '70.00'
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_student_cannot_access_teacher_dashboard(self, authenticated_student_client):
        """Test that students cannot access teacher dashboard"""
        response = authenticated_student_client.get('/api/dashboard/teacher/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_student_cannot_access_institution_dashboard(self, authenticated_student_client):
        """Test that students cannot access institution dashboard"""
        response = authenticated_student_client.get('/api/dashboard/institution/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_teacher_cannot_access_student_dashboard(self, authenticated_teacher_client):
        """Test that teachers cannot access student dashboard"""
        response = authenticated_teacher_client.get('/api/dashboard/student/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_student_cannot_view_other_student_grades(self, authenticated_student_client, db):
        """Test that students cannot view other students' grades"""
        from api.models import Assessment, Course, Enrollment
        
        # Create another student
        other_student = User.objects.create_user(
            username='other_student',
            email='other@test.com',
            password='testpass123',
            role=User.Role.STUDENT,
            student_id='2024999'
        )
        
        # Create course and assessment
        teacher = User.objects.create_user(
            username='teacher',
            email='teacher@test.com',
            password='testpass123',
            role=User.Role.TEACHER
        )
        
        course = Course.objects.create(
            code='TEST101',
            name='Test Course',
            department='Computer Science',
            credits=3,
            semester=Course.Semester.FALL,
            academic_year='2024-2025',
            teacher=teacher
        )
        
        assessment = Assessment.objects.create(
            course=course,
            title='Test Assessment',
            assessment_type=Assessment.AssessmentType.QUIZ,
            weight=Decimal('10.00'),
            max_score=Decimal('100.00'),
            is_active=True
        )
        
        # Create grade for other student
        other_grade = StudentGrade.objects.create(
            student=other_student,
            assessment=assessment,
            score=Decimal('90.00')
        )
        
        # Try to access other student's grade
        response = authenticated_student_client.get(f'/api/grades/{other_grade.id}/')
        
        # Should return 404 or 403
        assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN]


# =============================================================================
# 3. KRİTİK ENDPOINT 500 ATMIYOR MU?
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestNo500Errors:
    """Test that critical endpoints don't return 500 errors"""
    
    def test_login_with_malformed_data_no_500(self, api_client, db):
        """Test that login doesn't crash with malformed data"""
        # Test with various malformed inputs
        # Note: Cannot send None values in POST data, so we use empty strings or omit
        malformed_inputs = [
            {},  # Empty dict
            {'username': '', 'password': ''},  # Empty strings
            {'username': 'a' * 1000, 'password': 'b' * 1000},  # Very long strings
        ]
        
        for data in malformed_inputs:
            response = api_client.post('/api/auth/login/', data)
            
            # Should return 400 or 429 (rate limit), not 500
            assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR, \
                f"Login should not return 500 with data: {data}"
            assert response.status_code in [
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_429_TOO_MANY_REQUESTS,  # Rate limiting
                status.HTTP_200_OK  # Some might succeed
            ]
    
    def test_create_po_with_invalid_data_no_500(self, authenticated_institution_client):
        """Test that creating PO doesn't crash with invalid data"""
        invalid_inputs = [
            {},  # Empty
            {'code': None, 'title': None},
            {'code': '', 'title': ''},
            {'code': 'PO1', 'title': 'a' * 10000},  # Very long title
            {'code': 'PO1', 'target_percentage': 'invalid'},  # Invalid number
            {'code': 'PO1', 'target_percentage': -100},  # Negative
        ]
        
        for data in invalid_inputs:
            response = authenticated_institution_client.post('/api/program-outcomes/', data)
            
            # Should return 400, not 500
            assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR, \
                f"Create PO should not return 500 with data: {data}"
            assert response.status_code in [
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_201_CREATED  # Some might succeed
            ]
    
    def test_dashboard_endpoints_no_500(self, authenticated_student_client, authenticated_teacher_client, authenticated_institution_client):
        """Test that dashboard endpoints don't crash"""
        # Student dashboard
        response = authenticated_student_client.get('/api/dashboard/student/')
        assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR
        
        # Teacher dashboard
        response = authenticated_teacher_client.get('/api/dashboard/teacher/')
        assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR
        
        # Institution dashboard
        response = authenticated_institution_client.get('/api/dashboard/institution/')
        assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR
    
    def test_get_endpoints_with_invalid_id_no_500(self, authenticated_institution_client):
        """Test that GET endpoints don't crash with invalid IDs"""
        invalid_ids = [999999, -1, 0, 'invalid', None]
        
        endpoints = [
            '/api/program-outcomes/{}/',
            '/api/courses/{}/',
            '/api/learning-outcomes/{}/',
        ]
        
        for endpoint_template in endpoints:
            for invalid_id in invalid_ids:
                endpoint = endpoint_template.format(invalid_id)
                response = authenticated_institution_client.get(endpoint)
                
                # Should return 404 or 400, not 500
                assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR, \
                    f"GET {endpoint} should not return 500 with ID: {invalid_id}"
                assert response.status_code in [
                    status.HTTP_404_NOT_FOUND,
                    status.HTTP_400_BAD_REQUEST
                ]


# =============================================================================
# 4. BOŞ INPUT HATA VERİYOR MU?
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestEmptyInputValidation:
    """Test that empty input returns proper errors"""
    
    def test_login_empty_input(self, api_client, db):
        """Test that login rejects empty input"""
        # Note: Cannot send None values in POST data, so we use empty strings
        empty_inputs = [
            {},
            {'username': ''},
            {'password': ''},
            {'username': '', 'password': ''},
        ]
        
        for data in empty_inputs:
            response = api_client.post('/api/auth/login/', data)
            
            # Rate limiting might return 429, but should not return 500
            assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR, \
                f"Login should not return 500 with empty input: {data}"
            assert response.status_code in [
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_429_TOO_MANY_REQUESTS  # Rate limiting
            ], f"Login should reject empty input: {data}, got {response.status_code}"
            if response.status_code == status.HTTP_400_BAD_REQUEST:
                assert 'error' in response.data or 'errors' in response.data
    
    def test_register_empty_input(self, api_client):
        """Test that register rejects empty input"""
        response = api_client.post('/api/auth/register/', {})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
    
    def test_create_po_empty_input(self, authenticated_institution_client):
        """Test that creating PO rejects empty input"""
        response = authenticated_institution_client.post('/api/program-outcomes/', {})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data or 'code' in str(response.data)
    
    def test_create_lo_empty_input(self, authenticated_teacher_client):
        """Test that creating LO rejects empty input"""
        response = authenticated_teacher_client.post('/api/learning-outcomes/', {})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
    
    def test_create_course_empty_input(self, authenticated_teacher_client):
        """Test that creating course rejects empty input"""
        response = authenticated_teacher_client.post('/api/courses/', {})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
    
    def test_create_grade_empty_input(self, authenticated_teacher_client):
        """Test that creating grade rejects empty input"""
        response = authenticated_teacher_client.post('/api/grades/', {})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
    
    def test_create_contact_request_empty_input(self, api_client):
        """Test that contact request rejects empty input"""
        response = api_client.post('/api/contact/', {})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
    
    def test_create_student_empty_input(self, authenticated_institution_client):
        """Test that creating student rejects empty input"""
        response = authenticated_institution_client.post('/api/students/', {})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
    
    def test_create_teacher_empty_input(self, authenticated_institution_client):
        """Test that creating teacher rejects empty input"""
        response = authenticated_institution_client.post('/api/teachers/', {})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
    
    def test_partial_empty_input(self, authenticated_institution_client):
        """Test that partial empty input is rejected"""
        # Missing required fields
        response = authenticated_institution_client.post('/api/program-outcomes/', {
            'code': 'PO1',
            # Missing title, description, etc.
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data


# =============================================================================
# COMBINED CRITICAL TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.integration
class TestCriticalEndpointsRobustness:
    """Test critical endpoints are robust against various edge cases"""
    
    def test_login_edge_cases(self, api_client, db):
        """Test login with various edge cases"""
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role=User.Role.STUDENT
        )
        
        edge_cases = [
            # SQL injection attempts
            {'username': "admin'--", 'password': 'test'},
            {'username': "'; DROP TABLE users;--", 'password': 'test'},
            # XSS attempts
            {'username': '<script>alert(1)</script>', 'password': 'test'},
            # Very long strings
            {'username': 'a' * 1000, 'password': 'b' * 1000},
            # Special characters
            {'username': '!@#$%^&*()', 'password': 'test'},
        ]
        
        for case in edge_cases:
            response = api_client.post('/api/auth/login/', case)
            # Should not crash (500), should return 400 or 401
            assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR
            assert response.status_code in [
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_401_UNAUTHORIZED
            ]
    
    def test_protected_endpoints_without_auth(self, api_client):
        """Test all protected endpoints require authentication"""
        protected_endpoints = [
            ('GET', '/api/auth/me/'),
            ('GET', '/api/dashboard/student/'),
            ('GET', '/api/dashboard/teacher/'),
            ('GET', '/api/dashboard/institution/'),
            ('GET', '/api/course-analytics/'),
            ('GET', '/api/program-outcomes/'),
            ('GET', '/api/courses/'),
            ('GET', '/api/grades/'),
        ]
        
        for method, endpoint in protected_endpoints:
            if method == 'GET':
                response = api_client.get(endpoint)
            else:
                response = api_client.post(endpoint, {})
            
            assert response.status_code == status.HTTP_401_UNAUTHORIZED, \
                f"{method} {endpoint} should require authentication"

