"""LEARNING OUTCOME Models Module"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError


# =============================================================================
# LEARNING OUTCOME MODEL
# =============================================================================

class LearningOutcome(models.Model):
    """
    Learning Outcomes (LO) represent course-specific learning objectives.
    These are defined by teachers for their courses.
    
    Example LOs:
    - LO1: Understand data structures
    - LO2: Implement algorithms
    - LO3: Analyze algorithm complexity
    """
    
    code = models.CharField(
        max_length=20,
        help_text="LO code (e.g., LO1, LO2, CS301-LO1)"
    )
    
    title = models.CharField(
        max_length=200,
        help_text="LO title (e.g., Understand Data Structures)"
    )
    
    description = models.TextField(
        help_text="Detailed description of the learning outcome"
    )
    
    course = models.ForeignKey(
        'Course',
        on_delete=models.CASCADE,
        related_name='learning_outcomes',
        help_text="Course this LO belongs to"
    )
    
    target_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=70.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Target achievement percentage (default: 70%)"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this LO is currently active"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'learning_outcomes'
        ordering = ['course', 'code']
        unique_together = ['course', 'code']
        verbose_name = 'Learning Outcome'
        verbose_name_plural = 'Learning Outcomes'
    
    program_outcomes = models.ManyToManyField(
        'ProgramOutcome',
        through='LOPO',
        related_name='learning_outcomes',
        blank=True,
        help_text="Program outcomes this LO contributes to"
    )
    
    def __str__(self):
        return f"{self.course.code} - {self.code}: {self.title}"


# =============================================================================
# LO-PO MAPPING MODEL
# =============================================================================

class LOPO(models.Model):
    """
    Through model for LearningOutcome-ProgramOutcome relationship.
    Allows weighting of how much each LO contributes to a PO.
    """
    
    learning_outcome = models.ForeignKey(
        'LearningOutcome',
        on_delete=models.CASCADE,
        related_name='lo_pos',
        help_text="Learning Outcome"
    )
    
    program_outcome = models.ForeignKey(
        'ProgramOutcome',
        on_delete=models.CASCADE,
        related_name='lo_pos',
        help_text="Program Outcome"
    )
    
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.00,
        validators=[MinValueValidator(0.01), MaxValueValidator(10.0)],
        help_text="Weight/contribution of this LO to the PO (0.01-10.0 scale, where 1.0 = 10%, 10.0 = 100%)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'lo_program_outcomes'
        unique_together = ['learning_outcome', 'program_outcome']
        verbose_name = 'LO-PO Mapping'
        verbose_name_plural = 'LO-PO Mappings'
    
    def __str__(self):
        return f"{self.learning_outcome.code} → {self.program_outcome.code} (weight: {self.weight})"
