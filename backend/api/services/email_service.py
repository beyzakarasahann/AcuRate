"""
Email Service for AcuRate System.

This module provides a robust email sending service using Django's templating system.
It supports HTML email templates with inline CSS for maximum compatibility with
email clients like Gmail, Outlook, and Apple Mail.

Usage:
    from api.services.email_service import EmailService
    
    EmailService.send_html_email(
        subject="Welcome to AcuRate",
        template_name="welcome_email.html",
        context={"first_name": "John"},
        recipient_list=["user@example.com"]
    )
"""

import logging
from typing import Any

from django.conf import settings
from django.core.mail import EmailMessage, send_mail
from django.template.loader import render_to_string


logger = logging.getLogger(__name__)


class EmailServiceError(Exception):
    """Custom exception for email service errors."""
    pass


class EmailService:
    """
    A service class for sending HTML emails using Django's templating system.
    
    This service provides a clean interface for sending templated emails with
    proper error handling and logging. All email sending logic is centralized
    here for maintainability and consistency.
    
    Attributes:
        TEMPLATE_PATH: Base path for email templates within the templates directory.
    """
    
    TEMPLATE_PATH = "emails/"
    
    @staticmethod
    def send_html_email(
        subject: str,
        template_name: str,
        context: dict[str, Any],
        recipient_list: list[str],
        from_email: str | None = None,
        fail_silently: bool = True,
    ) -> bool:
        """
        Send an HTML email using a Django template.
        
        This method renders an HTML template with the provided context and sends
        it as an email. It handles errors gracefully to ensure the main application
        doesn't crash if the email server is unavailable.
        
        Args:
            subject: The email subject line.
            template_name: Name of the template file (e.g., 'welcome_email.html').
                          The template should be located in the emails/ directory.
            context: Dictionary of variables to pass to the template.
            recipient_list: List of recipient email addresses.
            from_email: Sender email address. Defaults to settings.DEFAULT_FROM_EMAIL.
            fail_silently: If True, exceptions are caught and logged instead of raised.
                          Defaults to True for production safety.
        
        Returns:
            bool: True if the email was sent successfully, False otherwise.
        
        Raises:
            EmailServiceError: If fail_silently is False and an error occurs.
        
        Example:
            >>> EmailService.send_html_email(
            ...     subject="Welcome to AcuRate!",
            ...     template_name="welcome_email.html",
            ...     context={"first_name": "Ahmet"},
            ...     recipient_list=["ahmet@example.com"]
            ... )
            True
        """
        if from_email is None:
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@acurate.com')
        
        # Construct full template path
        full_template_path = f"{EmailService.TEMPLATE_PATH}{template_name}"
        
        try:
            # Render the HTML template with context
            html_content = render_to_string(full_template_path, context)
            
            # Create and send the email
            email = EmailMessage(
                subject=subject,
                body=html_content,
                from_email=from_email,
                to=recipient_list,
            )
            email.content_subtype = "html"  # Set content type to HTML
            
            # Send the email
            email.send(fail_silently=False)
            
            logger.info(
                f"Email sent successfully: subject='{subject}', "
                f"template='{template_name}', recipients={recipient_list}"
            )
            return True
            
        except Exception as e:
            error_message = (
                f"Failed to send email: subject='{subject}', "
                f"template='{template_name}', recipients={recipient_list}, "
                f"error={str(e)}"
            )
            logger.error(error_message, exc_info=True)
            
            if not fail_silently:
                raise EmailServiceError(error_message) from e
            
            return False
    
    @staticmethod
    def send_welcome_email(first_name: str, recipient_email: str) -> bool:
        """
        Send a welcome email to a new user.
        
        Args:
            first_name: User's first name for personalization.
            recipient_email: User's email address.
        
        Returns:
            bool: True if sent successfully, False otherwise.
        """
        return EmailService.send_html_email(
            subject="🎓 AcuRate'e Hoş Geldiniz!",
            template_name="welcome_email.html",
            context={"first_name": first_name},
            recipient_list=[recipient_email],
        )
    
    @staticmethod
    def send_password_reset_email(reset_url: str, recipient_email: str) -> bool:
        """
        Send a password reset email with a secure reset link.
        
        Args:
            reset_url: The password reset URL containing the token.
            recipient_email: User's email address.
        
        Returns:
            bool: True if sent successfully, False otherwise.
        """
        return EmailService.send_html_email(
            subject="🔐 AcuRate Şifre Sıfırlama",
            template_name="password_reset.html",
            context={"reset_url": reset_url},
            recipient_list=[recipient_email],
        )
    
    @staticmethod
    def send_grade_notification_email(
        course_name: str,
        grade: str | float | int,
        assessment_type: str,
        recipient_email: str,
    ) -> bool:
        """
        Send a grade notification email to a student.
        
        Args:
            course_name: Name of the course.
            grade: The grade value (can be numeric or letter grade).
            assessment_type: Type of assessment (e.g., "Midterm", "Final", "Quiz").
            recipient_email: Student's email address.
        
        Returns:
            bool: True if sent successfully, False otherwise.
        """
        return EmailService.send_html_email(
            subject=f"📝 Yeni Not: {course_name}",
            template_name="grade_notification.html",
            context={
                "course_name": course_name,
                "grade": str(grade),
                "assessment_type": assessment_type,
            },
            recipient_list=[recipient_email],
        )


# =============================================================================
# TEST / USAGE EXAMPLES (Commented Out)
# =============================================================================
# 
# The following functions demonstrate how to use the EmailService.
# Uncomment and run them in Django shell for testing.
# 
# def test_welcome_email():
#     """
#     Test the welcome email functionality.
#     
#     Usage in Django shell:
#         >>> from api.services.email_service import test_welcome_email
#         >>> test_welcome_email()
#     """
#     success = EmailService.send_welcome_email(
#         first_name="Test Kullanıcı",
#         recipient_email="test@example.com"
#     )
#     print(f"Welcome email sent: {success}")
#     return success
# 
# 
# def test_password_reset_email():
#     """
#     Test the password reset email functionality.
#     
#     Usage in Django shell:
#         >>> from api.services.email_service import test_password_reset_email
#         >>> test_password_reset_email()
#     """
#     success = EmailService.send_password_reset_email(
#         reset_url="https://acurate.example.com/reset-password?token=abc123xyz",
#         recipient_email="test@example.com"
#     )
#     print(f"Password reset email sent: {success}")
#     return success
# 
# 
# def test_grade_notification_email():
#     """
#     Test the grade notification email functionality.
#     
#     Usage in Django shell:
#         >>> from api.services.email_service import test_grade_notification_email
#         >>> test_grade_notification_email()
#     """
#     success = EmailService.send_grade_notification_email(
#         course_name="Veri Yapıları ve Algoritmalar",
#         grade=85.5,
#         assessment_type="Ara Sınav",
#         recipient_email="test@example.com"
#     )
#     print(f"Grade notification email sent: {success}")
#     return success
# 
# 
# def test_all_email_templates():
#     """
#     Test all email templates at once.
#     
#     Usage in Django shell:
#         >>> from api.services.email_service import test_all_email_templates
#         >>> test_all_email_templates()
#     """
#     print("Testing Welcome Email...")
#     result_1 = test_welcome_email()
#     
#     print("\nTesting Password Reset Email...")
#     result_2 = test_password_reset_email()
#     
#     print("\nTesting Grade Notification Email...")
#     result_3 = test_grade_notification_email()
#     
#     print("\n" + "="*50)
#     print(f"Results: Welcome={result_1}, Reset={result_2}, Grade={result_3}")
#     print("="*50)
#     
#     return all([result_1, result_2, result_3])

