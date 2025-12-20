"""
Contact Views Tests - Pytest Version

Tests for contact views in api/views/contact.py
"""

import pytest
from rest_framework import status

from api.models import ContactRequest


# =============================================================================
# CREATE CONTACT REQUEST TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestCreateContactRequest:
    """Test create_contact_request view"""
    
    def test_create_contact_request_success(self, api_client, db):
        """Test successful contact request creation"""
        response = api_client.post('/api/contact/', {
            'institution_name': 'Test University',
            'institution_type': 'university',
            'contact_name': 'John Doe',
            'contact_email': 'john@testuniversity.edu',
            'contact_phone': '+1234567890',
            'request_type': 'demo',
            'message': 'I would like to request a demo'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        assert 'request_id' in response.data
        assert 'message' in response.data
        
        # Verify contact request was created
        contact_request = ContactRequest.objects.get(id=response.data['request_id'])
        assert contact_request.institution_name == 'Test University'
        assert contact_request.contact_email == 'john@testuniversity.edu'
        assert contact_request.status == 'pending'
    
    def test_create_contact_request_no_auth_required(self, api_client, db):
        """Test that contact request doesn't require authentication"""
        response = api_client.post('/api/contact/', {
            'institution_name': 'Test University',
            'institution_type': 'university',
            'contact_name': 'John Doe',
            'contact_email': 'john@testuniversity.edu',
            'request_type': 'demo'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_create_contact_request_missing_fields(self, api_client):
        """Test contact request with missing required fields"""
        response = api_client.post('/api/contact/', {
            'institution_name': 'Test University',
            # Missing required fields
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False
        assert 'errors' in response.data
    
    def test_create_contact_request_invalid_email(self, api_client):
        """Test contact request with invalid email"""
        response = api_client.post('/api/contact/', {
            'institution_name': 'Test University',
            'institution_type': 'university',
            'contact_name': 'John Doe',
            'contact_email': 'invalid-email',
            'request_type': 'demo'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data


# =============================================================================
# CONTACT REQUEST VIEWSET TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestContactRequestViewSet:
    """Test ContactRequestViewSet"""
    
    @pytest.fixture
    def contact_request(self, db):
        """Create a test contact request"""
        return ContactRequest.objects.create(
            institution_name='Test University',
            institution_type=ContactRequest.InstitutionType.UNIVERSITY,
            contact_name='John Doe',
            contact_email='john@testuniversity.edu',
            request_type=ContactRequest.RequestType.DEMO,
            message='Test message'
        )
    
    def test_list_contact_requests_as_staff(self, api_client, db, contact_request):
        """Test listing contact requests as staff"""
        # Create a staff user
        from api.models import User
        staff_user = User.objects.create_user(
            username='staff',
            email='staff@test.com',
            password='testpass123',
            role=User.Role.INSTITUTION,
            is_staff=True
        )
        
        api_client.force_authenticate(user=staff_user)
        response = api_client.get('/api/contact-requests/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
    
    def test_list_contact_requests_as_non_staff(self, authenticated_student_client):
        """Test that non-staff cannot list contact requests"""
        response = authenticated_student_client.get('/api/contact-requests/')
        
        assert response.status_code == status.HTTP_200_OK
        # Should return empty list for non-staff
        assert len(response.data) == 0
    
    def test_retrieve_contact_request(self, api_client, db, contact_request):
        """Test retrieving a contact request"""
        from api.models import User
        staff_user = User.objects.create_user(
            username='staff',
            email='staff@test.com',
            password='testpass123',
            role=User.Role.INSTITUTION,
            is_staff=True
        )
        
        api_client.force_authenticate(user=staff_user)
        response = api_client.get(f'/api/contact-requests/{contact_request.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['institution_name'] == 'Test University'
    
    def test_update_contact_request_status(self, api_client, db, contact_request):
        """Test updating contact request status"""
        from api.models import User
        staff_user = User.objects.create_user(
            username='staff',
            email='staff@test.com',
            password='testpass123',
            role=User.Role.INSTITUTION,
            is_staff=True
        )
        
        api_client.force_authenticate(user=staff_user)
        response = api_client.patch(f'/api/contact-requests/{contact_request.id}/', {
            'status': 'contacted'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'contacted'
        
        # Verify update
        contact_request.refresh_from_db()
        assert contact_request.status == 'contacted'

