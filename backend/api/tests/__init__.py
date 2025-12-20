"""
AcuRate - Test Suite Package

This package contains all tests organized by category.
All tests use pytest format with fixtures from conftest.py.

⚠️ DEPRECATED FILES (will be removed):
- test_models.py → Use test_models_pytest.py
- test_api.py → Use test_api_pytest.py
- test_serializers.py → Use test_serializers_pytest.py
- test_permissions.py → Use test_permissions_pytest.py
- test_integration.py → Use test_integration_pytest.py
- test_base.py → Use conftest.py fixtures

✅ ACTIVE TEST FILES (pytest format):
- test_models_pytest.py - Model tests
- test_models_additional.py - Additional model tests
- test_api_pytest.py - API endpoint tests
- test_serializers_pytest.py - Serializer tests
- test_serializers_additional.py - Additional serializer tests
- test_permissions_pytest.py - Permission tests
- test_integration_pytest.py - Integration tests
- test_views_*.py - View tests
- test_critical_security.py - Security tests
- test_utils.py - Utility function tests
"""

# Note: We no longer import Django TestCase classes
# All tests should use pytest format with fixtures from conftest.py

__all__ = [
    # All tests are now in pytest format
    # Import specific test classes if needed, but pytest auto-discovers them
]


