"""
Health Check Views Tests - Pytest Version

Tests for health check views in api/views/health.py
"""

import pytest
from rest_framework import status


# =============================================================================
# HEALTH CHECK TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestHealthCheck:
    """Test health_check view"""
    
    def test_health_check_success(self, api_client):
        """Test health check endpoint"""
        response = api_client.get('/api/health/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'healthy'
        assert response.data['service'] == 'AcuRate API'
        assert 'timestamp' in response.data
    
    def test_health_check_no_auth_required(self, api_client):
        """Test that health check doesn't require authentication"""
        response = api_client.get('/api/health/')
        
        assert response.status_code == status.HTTP_200_OK


# =============================================================================
# READINESS CHECK TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestReadinessCheck:
    """Test readiness_check view"""
    
    def test_readiness_check_success(self, api_client, db):
        """Test readiness check when all services are ready"""
        response = api_client.get('/api/health/ready/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'ready'
        assert 'checks' in response.data
        assert response.data['checks']['database'] is True
        assert 'timestamp' in response.data
    
    def test_readiness_check_no_auth_required(self, api_client):
        """Test that readiness check doesn't require authentication"""
        response = api_client.get('/api/health/ready/')
        
        # Should work without auth (may be ready or not ready)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE]


# =============================================================================
# LIVENESS CHECK TESTS
# =============================================================================

@pytest.mark.api
@pytest.mark.unit
class TestLivenessCheck:
    """Test liveness_check view"""
    
    def test_liveness_check_success(self, api_client):
        """Test liveness check endpoint"""
        response = api_client.get('/api/health/live/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'alive'
        assert 'timestamp' in response.data
    
    def test_liveness_check_no_auth_required(self, api_client):
        """Test that liveness check doesn't require authentication"""
        response = api_client.get('/api/health/live/')
        
        assert response.status_code == status.HTTP_200_OK


