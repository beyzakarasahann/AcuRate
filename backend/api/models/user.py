"""USER Models Module"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


# =============================================================================
# USER MODEL
# =============================================================================

class User(AbstractUser):
    """
    Custom User Model with role-based access control.
    
    Roles:
    - STUDENT: Can view their own performance, grades, and PO achievements
    - TEACHER: Can manage courses, assessments, and grade students
    - INSTITUTION: Can view all analytics and reports
    """
    
    class Role(models.TextChoices):
        STUDENT = 'STUDENT', 'Student'
        TEACHER = 'TEACHER', 'Teacher'
        INSTITUTION = 'INSTITUTION', 'Institution'
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
        help_text="User role in the system"
    )
    
    email = models.EmailField(
        unique=True,
        help_text="User's email address"
    )
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Contact phone number"
    )
    
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        blank=True,
        null=True,
        help_text="User's profile picture"
    )
    
    # Student-specific fields
    student_id = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        unique=True,
        help_text="Unique student ID (for students only)"
    )
    
    department = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Department name (e.g., Computer Science)"
    )
    
    year_of_study = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1), MaxValueValidator(6)],
        help_text="Current year of study (1-6)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Onboarding / account management
    is_temporary_password = models.BooleanField(
        default=True,
        help_text="If True, user must change password before full access"
    )

    created_by = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_teachers",
        help_text="Admin/Institution user who created this account (for teachers)"
    )
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def clean(self):
        """Validate student-specific fields"""
        if self.role == self.Role.STUDENT and not self.student_id:
            raise ValidationError("Student ID is required for students")
