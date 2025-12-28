"""
Test Assertion Helpers

Reusable assertion helpers for common test patterns.
"""

from rest_framework import status
import pytest


def assert_response_success(response, expected_status=status.HTTP_200_OK):
    """Assert that response is successful"""
    assert response.status_code == expected_status, \
        f"Expected {expected_status}, got {response.status_code}. Response: {response.data}"
    if hasattr(response, 'data') and isinstance(response.data, dict):
        if 'success' in response.data:
            assert response.data['success'] is True, \
                f"Response indicates failure: {response.data}"


def assert_response_error(response, expected_status=status.HTTP_400_BAD_REQUEST):
    """Assert that response is an error"""
    assert response.status_code == expected_status, \
        f"Expected {expected_status}, got {response.status_code}. Response: {response.data}"
    if hasattr(response, 'data') and isinstance(response.data, dict):
        if 'success' in response.data:
            assert response.data['success'] is False, \
                f"Response indicates success but should be error: {response.data}"


def assert_unauthorized(response):
    """Assert that response is 401 Unauthorized"""
    assert response.status_code == status.HTTP_401_UNAUTHORIZED, \
        f"Expected 401 Unauthorized, got {response.status_code}. Response: {response.data}"


def assert_forbidden(response):
    """Assert that response is 403 Forbidden"""
    assert response.status_code == status.HTTP_403_FORBIDDEN, \
        f"Expected 403 Forbidden, got {response.status_code}. Response: {response.data}"


def assert_not_found(response):
    """Assert that response is 404 Not Found"""
    assert response.status_code == status.HTTP_404_NOT_FOUND, \
        f"Expected 404 Not Found, got {response.status_code}. Response: {response.data}"


def assert_validation_error(response, field=None):
    """Assert that response contains validation errors"""
    assert response.status_code == status.HTTP_400_BAD_REQUEST, \
        f"Expected 400 Bad Request, got {response.status_code}. Response: {response.data}"
    
    if hasattr(response, 'data'):
        assert 'errors' in response.data or 'error' in response.data, \
            f"Response should contain errors: {response.data}"
        
        if field:
            assert field in response.data.get('errors', {}), \
                f"Expected error for field '{field}', got: {response.data}"


def assert_has_field(response, field_name):
    """Assert that response data contains a specific field"""
    assert hasattr(response, 'data'), "Response has no data attribute"
    assert isinstance(response.data, dict), "Response data is not a dict"
    assert field_name in response.data, \
        f"Response data missing field '{field_name}'. Available fields: {list(response.data.keys())}"


def assert_list_response(response, min_items=0):
    """Assert that response is a list with minimum items"""
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.data, list), \
        f"Expected list, got {type(response.data)}"
    assert len(response.data) >= min_items, \
        f"Expected at least {min_items} items, got {len(response.data)}"


def assert_no_500_error(response):
    """Assert that response is not a 500 Internal Server Error"""
    assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR, \
        f"Got 500 Internal Server Error: {response.data}"









