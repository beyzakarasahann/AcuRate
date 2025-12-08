"""OUTCOME Models Module"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


# =============================================================================
# PROGRAM OUTCOME MODEL
# =============================================================================

class ProgramOutcome(models.Model):
    """
    Program Outcomes (PO) represent learning objectives that students should achieve.
    
    Example POs:
    - PO1: Engineering Knowledge
    - PO2: Problem Analysis
    - PO3: Design/Development of Solutions
    """
    
    code = models.CharField(
        max_length=10,
        unique=True,
        help_text="Unique PO code (e.g., PO1, PO2)"
    )
    
    title = models.CharField(
        max_length=200,
        help_text="PO title (e.g., Engineering Knowledge)"
    )
    
    description = models.TextField(
        help_text="Detailed description of the program outcome"
    )
    
    department = models.CharField(
        max_length=100,
        help_text="Department this PO belongs to"
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
        help_text="Whether this PO is currently active"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'program_outcomes'
        ordering = ['code']
        verbose_name = 'Program Outcome'
        verbose_name_plural = 'Program Outcomes'
    
    def __str__(self):
        return f"{self.code}: {self.title}"
