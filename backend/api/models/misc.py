"""MISC Models Module"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


# =============================================================================
# CONTACT REQUEST MODEL
# =============================================================================

class ContactRequest(models.Model):
    """
    Represents an institutional contact or demo request submitted from the platform's contact page.

    This model records various types of inquiries or demo requests from organizations
    such as universities, faculties, schools, companies, etc. It also tracks the
    status of each inquiry, relevant contacts, and additional notes.

    Key Fields:
        - institution_name: The name of the institution making the request.
        - institution_type: The type/category of the institution (e.g., University, School).
        - contact_name: Name of the individual contact person.
        - contact_email: Email address for follow-up.
        - contact_phone: Optional phone number for the contact person.
        - request_type: Nature of the request (e.g., demo, pricing, partnership).
        - message: Optional message or details provided by the requestor.
        - status: Progress or handling status of the request (e.g., pending, contacted).
        - notes: Internal notes for administrative use.
        - created_at: Timestamp when the request was created.
        - updated_at: Timestamp when the request was last updated.

    Meta:
        The model is indexed by status, institution_type, and request_type for efficient admin filtering.
    """
    
    class InstitutionType(models.TextChoices):
        """
        Enumeration representing the different kinds of institutions that can submit a request.
        """
        UNIVERSITY = 'university', 'University'
        FACULTY = 'faculty', 'Faculty / Department'
        SCHOOL = 'school', 'School / College'
        TRAINING = 'training', 'Training Center'
        COMPANY = 'company', 'Company'
        OTHER = 'other', 'Other'
    
    class RequestType(models.TextChoices):
        """
        The category or reason for the institutional request.
        """
        DEMO = 'demo', 'Request a demo'
        PRICING = 'pricing', 'Request pricing'
        PARTNERSHIP = 'partnership', 'Partnership / Collaboration'
        TECHNICAL = 'technical', 'Technical integration question'
        GENERAL = 'general', 'General institutional inquiry'
    
    # Institution Details
    institution_name = models.CharField(
        max_length=255,
        help_text="Name of the institution"
    )
    
    institution_type = models.CharField(
        max_length=20,
        choices=InstitutionType.choices,
        help_text="Type of institution"
    )
    
    # Contact Person Details
    contact_name = models.CharField(
        max_length=255,
        help_text="Full name of the contact person"
    )
    
    contact_email = models.EmailField(
        help_text="Work email of the contact person"
    )
    
    contact_phone = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Phone number (optional)"
    )
    
    # Request Details
    request_type = models.CharField(
        max_length=20,
        choices=RequestType.choices,
        help_text="Type of request"
    )
    
    message = models.TextField(
        blank=True,
        null=True,
        help_text="Additional message or description"
    )
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('contacted', 'Contacted'),
            ('demo_scheduled', 'Demo Scheduled'),
            ('completed', 'Completed'),
            ('archived', 'Archived')
        ],
        default='pending',
        help_text="Status of the request"
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Internal notes about this request"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'contact_requests'
        ordering = ['-created_at']
        verbose_name = 'Contact Request'
        verbose_name_plural = 'Contact Requests'
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['institution_type']),
            models.Index(fields=['request_type']),
        ]
    
    def __str__(self):
        """
        Returns a string representation of the ContactRequest object.

        Returns:
            str: A human-readable summary that includes the institution and contact info.
        """
        return f"{self.institution_name} - {self.contact_name} ({self.get_request_type_display()})"


# =============================================================================
# ACTIVITY LOG MODEL
# =============================================================================

class ActivityLog(models.Model):
    """
    Logs important actions throughout the system for monitoring and audit purposes.

    Tracks user-initiated or system actions across the application. 
    Records references to actors (users), institutions, relevant objects, and additional metadata.

    Key Fields:
        - action_type: The type of action performed (see ActionType enum).
        - user: The user who performed the action (nullable for system events).
        - institution: The originating institution's user object if applicable.
        - department: Department context if relevant.
        - description: Informational description of the action (no sensitive data).
        - related_object_type: Optionally, the type of the object affected (as string).
        - related_object_id: Optionally, the id of the object affected.
        - metadata: JSON dictionary with supplemental details (no sensitive data).
        - created_at: When this log entry was created.

    Meta:
        Includes several database indexes to support efficient search and filtering.
    """
    
    class ActionType(models.TextChoices):
        """
        The types of actions that can be recorded in the activity log.

        Options include user management, course and assessment lifecycle events, 
        grading actions, department and PO updates, and authentication activities.
        """
        USER_CREATED = 'user_created', 'User Created'
        USER_UPDATED = 'user_updated', 'User Updated'
        USER_DELETED = 'user_deleted', 'User Deleted'
        COURSE_CREATED = 'course_created', 'Course Created'
        COURSE_UPDATED = 'course_updated', 'Course Updated'
        COURSE_DELETED = 'course_deleted', 'Course Deleted'
        ENROLLMENT_CREATED = 'enrollment_created', 'Enrollment Created'
        ENROLLMENT_UPDATED = 'enrollment_updated', 'Enrollment Updated'
        ASSESSMENT_CREATED = 'assessment_created', 'Assessment Created'
        ASSESSMENT_UPDATED = 'assessment_updated', 'Assessment Updated'
        GRADE_ASSIGNED = 'grade_assigned', 'Grade Assigned'
        GRADE_UPDATED = 'grade_updated', 'Grade Updated'
        DEPARTMENT_CREATED = 'department_created', 'Department Created'
        DEPARTMENT_UPDATED = 'department_updated', 'Department Updated'
        PO_CREATED = 'po_created', 'Program Outcome Created'
        PO_UPDATED = 'po_updated', 'Program Outcome Updated'
        LOGIN = 'login', 'User Login'
        PASSWORD_RESET = 'password_reset', 'Password Reset'
    
    action_type = models.CharField(
        max_length=50,
        choices=ActionType.choices,
        help_text="Type of action performed"
    )
    
    # User who performed the action (can be null for system actions)
    user = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
        help_text="User who performed this action"
    )
    
    # Institution/department context (for filtering)
    institution = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='institution_activity_logs',
        limit_choices_to={'role': 'INSTITUTION'},
        help_text="Institution this activity belongs to"
    )
    
    department = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Department name (for filtering)"
    )
    
    # Action description (generic, no sensitive data)
    description = models.TextField(
        help_text="Description of the action (no sensitive data)"
    )
    
    # Related object info (generic references, no sensitive data)
    related_object_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Type of related object (e.g., 'User', 'Course')"
    )
    
    related_object_id = models.IntegerField(
        blank=True,
        null=True,
        help_text="ID of related object"
    )
    
    # Metadata (JSON field for additional info)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata (no sensitive data)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['action_type']),
            models.Index(fields=['institution']),
            models.Index(fields=['department']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['related_object_type', 'related_object_id']),
        ]
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'
    
    def __str__(self):
        """
        Returns a human-readable summary of the ActivityLog entry.

        Returns:
            str: The display name of the action and a preview of the description.
        """
        return f"{self.get_action_type_display()} - {self.description[:50]}"
