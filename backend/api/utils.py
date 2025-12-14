"""
Utility functions for AcuRate API
SECURITY: Includes sensitive data sanitization for logging
"""
from .models import ActivityLog, User

# SECURITY: Keys that should never be logged
SENSITIVE_KEYS = {
    'password', 'temp_password', 'token', 'access_token', 'refresh_token',
    'secret', 'api_key', 'apikey', 'secret_key', 'credentials', 'auth',
    'authorization', 'cookie', 'session', 'csrf', 'ssn', 'credit_card'
}


def sanitize_metadata(metadata: dict) -> dict:
    """
    SECURITY: Remove sensitive keys from metadata before logging.
    """
    if not metadata:
        return {}
    
    sanitized = {}
    for key, value in metadata.items():
        key_lower = key.lower()
        # Check if key contains any sensitive word
        if any(sensitive in key_lower for sensitive in SENSITIVE_KEYS):
            sanitized[key] = '***REDACTED***'
        elif isinstance(value, dict):
            sanitized[key] = sanitize_metadata(value)
        else:
            sanitized[key] = value
    
    return sanitized


def sanitize_description(description: str) -> str:
    """
    SECURITY: Remove potential sensitive data from description.
    """
    if not description:
        return ''
    
    import re
    # Remove anything that looks like a password or token
    sanitized = re.sub(r'[Pp]assword[:\s]*\S+', 'password: ***', description)
    sanitized = re.sub(r'[Tt]oken[:\s]*\S+', 'token: ***', sanitized)
    return sanitized


def log_activity(
    action_type: str,
    user=None,
    institution=None,
    department=None,
    description: str = '',
    related_object_type: str = None,
    related_object_id: int = None,
    metadata: dict = None
):
    """
    Helper function to create activity logs.
    SECURITY: Automatically sanitizes sensitive data from description and metadata.
    """
    try:
        # Sanitize before logging
        safe_description = sanitize_description(description)
        safe_metadata = sanitize_metadata(metadata)
        
        ActivityLog.objects.create(
            action_type=action_type,
            user=user,
            institution=institution,
            department=department,
            description=safe_description,
            related_object_type=related_object_type,
            related_object_id=related_object_id,
            metadata=safe_metadata
        )
    except Exception as e:
        # Don't fail the main operation if logging fails
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to create activity log: {e}")


def get_institution_for_user(user: User):
    """
    Get the institution user for a given user based on department or created_by relationship.
    """
    if not user:
        return None
    
    # If user is an institution, return itself
    if user.role == User.Role.INSTITUTION:
        return user
    
    # If user was created by an institution, return that institution
    if hasattr(user, 'created_by') and user.created_by and user.created_by.role == User.Role.INSTITUTION:
        return user.created_by
    
    # Try to find institution by department match
    if user.department:
        institution = User.objects.filter(
            role=User.Role.INSTITUTION,
            department=user.department,
            is_active=True
        ).first()
        if institution:
            return institution
    
    return None






