"""
Utility functions for AcuRate API
"""
from .models import ActivityLog, User


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
    No sensitive data should be included in description or metadata.
    """
    try:
        ActivityLog.objects.create(
            action_type=action_type,
            user=user,
            institution=institution,
            department=department,
            description=description,
            related_object_type=related_object_type,
            related_object_id=related_object_id,
            metadata=metadata or {}
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


