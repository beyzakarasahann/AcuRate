"""DEPARTMENT Models Module"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


# =============================================================================
# PROGRAM OUTCOME MODEL
# =============================================================================

# =============================================================================
# DEPARTMENT MODEL
# =============================================================================

class Department(models.Model):
    """
    Academic departments in the institution.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Department name (e.g., Computer Science)"
    )
    
    code = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Department code or abbreviation (e.g., CS, EE)"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Department description"
    )
    
    contact_email = models.EmailField(
        blank=True,
        null=True,
        help_text="Department contact email"
    )
    
    contact_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Department contact phone"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'departments'
        ordering = ['name']
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
    
    def __str__(self):
        return self.name
