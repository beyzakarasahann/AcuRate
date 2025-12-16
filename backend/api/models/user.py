"""USER Models Module"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
import secrets


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
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['student_id']),
            models.Index(fields=['role', 'is_active']),
            models.Index(fields=['department', 'role']),
            models.Index(fields=['created_by']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def clean(self):
        """Validate student-specific fields"""
        if self.role == self.Role.STUDENT and not self.student_id:
            raise ValidationError("Student ID is required for students")
    
    def set_password(self, raw_password):
        """
        Override set_password to track password history.
        SECURITY: Prevents reuse of recent passwords.
        """
        from django.contrib.auth.hashers import make_password
        
        # Save old password hash to history before changing
        if self.pk and self.password:  # Only if user exists and has a password
            PasswordHistory.objects.create(
                user=self,
                password_hash=self.password
            )
            # Keep only last 5 passwords
            old_passwords = PasswordHistory.objects.filter(
                user=self
            ).order_by('-created_at')[5:]
            for old_pwd in old_passwords:
                old_pwd.delete()
        
        super().set_password(raw_password)
    
    def check_password_history(self, raw_password):
        """
        SECURITY: Check if password was used in last 5 passwords.
        Returns True if password was recently used, False otherwise.
        """
        from django.contrib.auth.hashers import check_password
        
        recent_passwords = PasswordHistory.objects.filter(
            user=self
        ).order_by('-created_at')[:5]
        
        for pwd_history in recent_passwords:
            if check_password(raw_password, pwd_history.password_hash):
                return True
        return False


# =============================================================================
# PASSWORD RESET TOKEN MODEL
# =============================================================================

class PasswordResetToken(models.Model):
    """
    SECURITY: Token-based password reset mechanism.
    Replaces plain text password emails with secure reset links.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        db_table = 'password_reset_tokens'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'used', 'expires_at']),
            models.Index(fields=['expires_at']),
        ]
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'
    
    @classmethod
    def create_token(cls, user, ip_address=None):
        """
        Create a new password reset token for a user.
        Token expires in 15 minutes.
        """
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(minutes=15)
        
        # Invalidate any existing unused tokens for this user
        cls.objects.filter(
            user=user,
            used=False,
            expires_at__gt=timezone.now()
        ).update(used=True)
        
        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at,
            ip_address=ip_address
        )
    
    def is_valid(self):
        """Check if token is valid (not used and not expired)"""
        return (
            not self.used and
            timezone.now() < self.expires_at
        )
    
    def mark_as_used(self):
        """Mark token as used"""
        self.used = True
        self.save(update_fields=['used'])
    
    def __str__(self):
        return f"PasswordResetToken for {self.user.username} (expires: {self.expires_at})"


# =============================================================================
# PASSWORD HISTORY MODEL
# =============================================================================

class PasswordHistory(models.Model):
    """
    SECURITY: Track password history to prevent reuse.
    Stores last 5 password hashes per user.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_history'
    )
    password_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'password_history'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]
        verbose_name = 'Password History'
        verbose_name_plural = 'Password History'
    
    def __str__(self):
        return f"PasswordHistory for {self.user.username} ({self.created_at})"
