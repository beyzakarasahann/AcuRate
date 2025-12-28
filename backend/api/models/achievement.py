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
    Model representing a student's achievement for a specific Program Outcome (PO).

    This model aggregates a student's performance across all relevant assessments for a given
    Program Outcome, storing the current achievement percentage, assessment completion counts,
    and calculation timestamps. It allows for analysis of how well students meet institutional
    learning objectives at the program level.

    Key Fields:
        student (ForeignKey to User): The student for whom the achievement is tracked. Only students allowed.
        program_outcome (ForeignKey to ProgramOutcome): The targeted program outcome.
        current_percentage (DecimalField): Student's current achievement percentage for the PO.
        total_assessments (IntegerField): Total number of assessments mapped to this PO.
        completed_assessments (IntegerField): Number of assessments completed by the student for this PO.
        last_calculated (DateTimeField): Timestamp when achievement was last calculated.
        created_at, updated_at (DateTimeFields): Record creation and update timestamps.
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
        """
        Returns a string representation of the StudentPOAchievement instance.

        Returns:
            str: Username, PO code, and current percentage (e.g., 'alice - PO1: 85.00%').
        """
        return f"{self.student.username} - {self.program_outcome.code}: {self.current_percentage}%"

    @property
    def is_target_met(self):
        """
        Determine if the student has met or exceeded the target percentage for this PO.

        Returns:
            bool: True if achieved percentage >= PO target, else False.
        """
        return self.current_percentage >= self.program_outcome.target_percentage

    @property
    def gap_to_target(self):
        """
        Calculate how much the student still needs to achieve, in percentage points, to reach the target.

        Returns:
            Decimal: Difference between PO target percentage and student's current percentage.
        """
        return self.program_outcome.target_percentage - self.current_percentage

    @property
    def completion_rate(self):
        """
        Calculate the completion rate of assessments for the PO (as a percentage).

        Returns:
            float: Percentage of completed assessments out of total assessments.
                  Returns 0 if total assessments is 0.
        """
        if self.total_assessments > 0:
            return (self.completed_assessments / self.total_assessments) * 100
        return 0


# =============================================================================
# STUDENT LO ACHIEVEMENT MODEL
# =============================================================================

class StudentLOAchievement(models.Model):
    """
    Model representing a student's achievement for a specific Learning Outcome (LO).

    This model tracks a student's progress towards meeting specific course-level learning outcomes.
    Similar to StudentPOAchievement but operates at the course-specific learning outcome level.

    Key Fields:
        student (ForeignKey to User): The student for whom the achievement is tracked. Only students allowed.
        learning_outcome (ForeignKey to LearningOutcome): The targeted learning outcome in the course.
        current_percentage (DecimalField): Student's current achievement percentage for the LO.
        total_assessments (IntegerField): Total number of assessments for this LO.
        completed_assessments (IntegerField): Number of completed assessments for this LO.
        last_calculated (DateTimeField): Timestamp when achievement was last calculated.
        created_at, updated_at (DateTimeFields): Record creation and update timestamps.
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
        """
        Returns a string representation of the StudentLOAchievement instance.

        Returns:
            str: Username, LO code, and current percentage (e.g., 'alice - LO1: 90.00%').
        """
        return f"{self.student.username} - {self.learning_outcome.code}: {self.current_percentage}%"

    @property
    def is_target_met(self):
        """
        Determine if the student has met or exceeded the target percentage for this LO.

        Returns:
            bool: True if achieved percentage >= LO target, else False.
        """
        return self.current_percentage >= self.learning_outcome.target_percentage

    @property
    def gap_to_target(self):
        """
        Calculate how much the student still needs to achieve, in percentage points, to reach the LO's target.

        Returns:
            Decimal: Difference between LO target percentage and student's current percentage.
        """
        return self.learning_outcome.target_percentage - self.current_percentage

    @property
    def completion_rate(self):
        """
        Calculate the completion rate of assessments for the LO (as a percentage).

        Returns:
            float: Percentage of completed assessments out of total assessments.
                  Returns 0 if total assessments is 0.
        """
        if self.total_assessments > 0:
            return (self.completed_assessments / self.total_assessments) * 100
        return 0
