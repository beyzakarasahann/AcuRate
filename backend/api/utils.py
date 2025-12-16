"""
AcuRate - Utility Functions

SECURITY: Includes sensitive data sanitization for logging
"""

from .models import ActivityLog, User
from functools import wraps
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)

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


def circuit_breaker(failure_threshold=5, recovery_timeout=60):
    """
    Simple circuit breaker decorator for external service calls.
    
    Usage:
        @circuit_breaker(failure_threshold=5, recovery_timeout=60)
        def send_email(...):
            ...
    """
    def decorator(func):
        failures = {'count': 0, 'last_failure': None, 'state': 'closed'}  # closed, open, half_open
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            import time
            
            # Check if circuit is open and recovery time has passed
            if failures['state'] == 'open':
                if failures['last_failure'] and (time.time() - failures['last_failure']) > recovery_timeout:
                    failures['state'] = 'half_open'
                    logger.warning(f"Circuit breaker for {func.__name__} entering half-open state")
                else:
                    raise Exception(f"Circuit breaker is OPEN for {func.__name__}")
            
            try:
                result = func(*args, **kwargs)
                # Success - reset failure count
                if failures['state'] == 'half_open':
                    failures['state'] = 'closed'
                    logger.info(f"Circuit breaker for {func.__name__} closed after recovery")
                failures['count'] = 0
                return result
            except Exception as e:
                failures['count'] += 1
                failures['last_failure'] = time.time()
                
                if failures['count'] >= failure_threshold:
                    failures['state'] = 'open'
                    logger.error(f"Circuit breaker for {func.__name__} OPENED after {failures['count']} failures")
                
                raise e
        
        return wrapper
    return decorator


def get_client_ip(request):
    """
    Get client IP address from request.
    Handles X-Forwarded-For header for proxy/load balancer scenarios.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')


def log_security_event(
    event_type: str,
    user=None,
    ip_address=None,
    details: dict = None,
    severity: str = 'INFO'
):
    """
    SECURITY: Log security-related events for monitoring and alerting.
    
    Event types:
    - 'failed_login'
    - 'successful_login'
    - 'password_reset_requested'
    - 'password_reset_completed'
    - 'password_changed'
    - 'permission_denied'
    - 'suspicious_activity'
    - 'account_locked'
    - 'rate_limit_exceeded'
    - 'invalid_token'
    
    Severity levels: 'INFO', 'WARNING', 'CRITICAL'
    """
    security_logger = logging.getLogger('security')
    
    log_data = {
        'event_type': event_type,
        'user_id': user.id if user else None,
        'username': user.username if user else None,
        'ip_address': ip_address,
        'timestamp': timezone.now().isoformat(),
        'severity': severity,
        'details': sanitize_metadata(details) if details else {},
    }
    
    # Log to security logger
    if severity == 'CRITICAL':
        security_logger.critical(f"SECURITY EVENT: {event_type}", extra=log_data)
    elif severity == 'WARNING':
        security_logger.warning(f"SECURITY EVENT: {event_type}", extra=log_data)
    else:
        security_logger.info(f"SECURITY EVENT: {event_type}", extra=log_data)
    
    # Store in database for analysis
    try:
        institution = get_institution_for_user(user) if user else None
        ActivityLog.objects.create(
            action_type=f'SECURITY_{event_type.upper()}',
            user=user,
            institution=institution,
            department=user.department if user else None,
            description=f"Security event: {event_type}",
            metadata=log_data
        )
    except Exception as e:
        # Don't fail the main operation if logging fails
        logger.error(f"Failed to create security event log: {e}")
