"""
AcuRate - Celery Background Tasks

Background tasks for async operations like email sending and heavy computations.
"""

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_welcome_email(self, user_id, temp_password, email_type='welcome'):
    """
    Background task for sending welcome emails.
    
    Args:
        user_id: User ID
        temp_password: Temporary password
        email_type: Type of email ('welcome', 'password_reset', etc.)
    """
    try:
        from .models import User
        user = User.objects.get(id=user_id)
        
        if email_type == 'welcome':
            subject = "Welcome to AcuRate"
            message = (
                f"Hello {user.get_full_name() or user.username},\n\n"
                f"Your AcuRate account has been created.\n\n"
                f"Username: {user.username}\n"
                f"Email: {user.email}\n"
                f"Temporary password: {temp_password}\n\n"
                "Please log in and change your password immediately.\n\n"
                "Best regards,\n"
                "AcuRate Team"
            )
        elif email_type == 'password_reset':
            subject = "AcuRate - Password Reset"
            message = (
                f"Hello {user.get_full_name() or user.username},\n\n"
                f"Your password has been reset.\n\n"
                f"Temporary password: {temp_password}\n\n"
                "Please log in and change your password immediately.\n\n"
                "Best regards,\n"
                "AcuRate Team"
            )
        else:
            subject = "AcuRate - Account Information"
            message = (
                f"Hello {user.get_full_name() or user.username},\n\n"
                f"Your temporary password: {temp_password}\n\n"
                "Please log in and change your password immediately.\n\n"
                "Best regards,\n"
                "AcuRate Team"
            )
        
        # Apply SSL skip if needed
        import ssl
        import os
        if os.environ.get("SENDGRID_SKIP_SSL_VERIFY", "").lower() == "true":
            ssl._create_default_https_context = ssl._create_unverified_context
        
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        logger.info(f"Welcome email sent successfully to {user.email}")
        return True
        
    except Exception as exc:
        logger.error(f"Failed to send welcome email to user {user_id}: {str(exc)}")
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task
def calculate_achievements_for_student(student_id):
    """
    Background task for calculating PO/LO achievements for a student.
    Useful for bulk operations or when recalculating all achievements.
    
    Args:
        student_id: Student user ID
    """
    try:
        from .models import User, ProgramOutcome
        from .signals import calculate_po_achievement, calculate_lo_achievement
        from .models import LearningOutcome
        
        student = User.objects.get(id=student_id, role=User.Role.STUDENT)
        
        # Calculate PO achievements
        pos = ProgramOutcome.objects.filter(is_active=True)
        for po in pos:
            calculate_po_achievement(student, po)
        
        # Calculate LO achievements
        # Get all LOs for courses the student is enrolled in
        from .models import Enrollment
        enrollments = Enrollment.objects.filter(student=student, is_active=True)
        for enrollment in enrollments:
            los = LearningOutcome.objects.filter(course=enrollment.course, is_active=True)
            for lo in los:
                calculate_lo_achievement(student, lo)
        
        logger.info(f"Achievements calculated for student {student_id}")
        return True
        
    except User.DoesNotExist:
        logger.error(f"Student {student_id} not found")
        return False
    except Exception as exc:
        logger.error(f"Failed to calculate achievements for student {student_id}: {str(exc)}")
        raise


@shared_task
def bulk_calculate_achievements(student_ids):
    """
    Bulk calculate achievements for multiple students.
    
    Args:
        student_ids: List of student user IDs
    """
    results = {'success': 0, 'failed': 0, 'errors': []}
    
    for student_id in student_ids:
        try:
            calculate_achievements_for_student(student_id)
            results['success'] += 1
        except Exception as e:
            results['failed'] += 1
            results['errors'].append(f"Student {student_id}: {str(e)}")
    
    logger.info(f"Bulk achievement calculation completed: {results}")
    return results
