"""ACHIEVEMENT Models Module"""

from decimal import Decimal
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


# =============================================================================
# STUDENT PO ACHIEVEMENT MODEL
# =============================================================================

class StudentPOAchievement(models.Model):
    """
    Tracks student achievement for each Program Outcome.
    Aggregates performance across all relevant assessments.
    """
    
    student = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='po_achievements',
        limit_choices_to={'role': 'STUDENT'},
        help_text="Student"
    )
    
    program_outcome = models.ForeignKey(
        'ProgramOutcome',
        on_delete=models.CASCADE,
        related_name='student_achievements',
        help_text="Program Outcome"
    )
    
    current_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        help_text="Current achievement percentage"
    )
    
    total_assessments = models.IntegerField(
        default=0,
        help_text="Total number of assessments for this PO"
    )
    
    completed_assessments = models.IntegerField(
        default=0,
        help_text="Number of completed assessments"
    )
    
    last_calculated = models.DateTimeField(
        auto_now=True,
        help_text="When this achievement was last calculated"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_po_achievements'
        unique_together = ['student', 'program_outcome']
        ordering = ['student', 'program_outcome']
        verbose_name = 'Student PO Achievement'
        verbose_name_plural = 'Student PO Achievements'
        indexes = [
            models.Index(fields=['student', 'program_outcome']),
            models.Index(fields=['student', 'current_percentage']),
            models.Index(fields=['program_outcome', 'current_percentage']),
            models.Index(fields=['last_calculated']),
        ]
    
    def __str__(self):
        return f"{self.student.username} - {self.program_outcome.code}: {self.current_percentage}%"
    
    @property
    def is_target_met(self):
        """Check if student has met the target for this PO"""
        return self.current_percentage >= self.program_outcome.target_percentage
    
    @property
    def gap_to_target(self):
        """Calculate gap to target percentage"""
        return self.program_outcome.target_percentage - self.current_percentage
    
    @property
    def completion_rate(self):
        """Calculate completion rate"""
        if self.total_assessments > 0:
            return (self.completed_assessments / self.total_assessments) * 100
        return 0


# =============================================================================
# STUDENT LO ACHIEVEMENT MODEL
# =============================================================================

class StudentLOAchievement(models.Model):
    """
    Tracks individual student achievement for specific Learning Outcomes.
    Similar to StudentPOAchievement but for course-specific LOs.
    """
    
    student = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='lo_achievements',
        limit_choices_to={'role': 'STUDENT'},
        help_text="Student"
    )
    
    learning_outcome = models.ForeignKey(
        'LearningOutcome',
        on_delete=models.CASCADE,
        related_name='student_achievements',
        help_text="Learning Outcome"
    )
    
    current_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        help_text="Current achievement percentage"
    )
    
    total_assessments = models.IntegerField(
        default=0,
        help_text="Total number of assessments for this LO"
    )
    
    completed_assessments = models.IntegerField(
        default=0,
        help_text="Number of completed assessments"
    )
    
    last_calculated = models.DateTimeField(
        auto_now=True,
        help_text="When this achievement was last calculated"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_lo_achievements'
        unique_together = ['student', 'learning_outcome']
        ordering = ['student', 'learning_outcome']
        verbose_name = 'Student LO Achievement'
        verbose_name_plural = 'Student LO Achievements'
        indexes = [
            models.Index(fields=['student', 'learning_outcome']),
            models.Index(fields=['student', 'current_percentage']),
            models.Index(fields=['learning_outcome', 'current_percentage']),
            models.Index(fields=['last_calculated']),
        ]
    
    def __str__(self):
        return f"{self.student.username} - {self.learning_outcome.code}: {self.current_percentage}%"
    
    @property
    def is_target_met(self):
        """Check if target percentage is achieved"""
        return self.current_percentage >= self.learning_outcome.target_percentage
    
    @property
    def gap_to_target(self):
        """Calculate gap to target percentage"""
        return self.learning_outcome.target_percentage - self.current_percentage
    
    @property
    def completion_rate(self):
        """Calculate completion rate"""
        if self.total_assessments > 0:
            return (self.completed_assessments / self.total_assessments) * 100
        return 0
