"""COURSE Models Module"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError


# =============================================================================
# COURSE MODEL
# =============================================================================

class Course(models.Model):
    """
    Academic courses offered by the institution.
    Each course is taught by a teacher and mapped to multiple program outcomes.
    """
    
    class Semester(models.IntegerChoices):
        FALL = 1, 'Fall'
        SPRING = 2, 'Spring'
        SUMMER = 3, 'Summer'
    
    code = models.CharField(
        max_length=20,
        help_text="Course code (e.g., CS101)"
    )
    
    name = models.CharField(
        max_length=200,
        help_text="Course name"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Course description"
    )
    
    department = models.CharField(
        max_length=100,
        help_text="Department offering this course"
    )
    
    credits = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Number of credits (1-10)"
    )
    
    semester = models.IntegerField(
        choices=Semester.choices,
        help_text="Semester when course is offered"
    )
    
    academic_year = models.CharField(
        max_length=20,
        help_text="Academic year (e.g., 2024-2025)"
    )
    
    teacher = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='courses_teaching',
        limit_choices_to={'role': 'TEACHER'},
        help_text="Teacher assigned to this course"
    )
    
    program_outcomes = models.ManyToManyField(
        'ProgramOutcome',
        through='CoursePO',
        related_name='courses',
        help_text="Program outcomes covered by this course"
    )
    
    enrolled_students = models.ManyToManyField(
        'User',
        through='Enrollment',
        related_name='enrolled_courses',
        help_text="Students enrolled in this course"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'courses'
        ordering = ['code', '-academic_year']
        unique_together = ['code', 'academic_year']
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
    
    def __str__(self):
        return f"{self.code}: {self.name} ({self.academic_year})"


# =============================================================================
# COURSE-PO MAPPING MODEL
# =============================================================================

class CoursePO(models.Model):
    """
    Through model for Course-ProgramOutcome relationship.
    Allows weighting of how much each course contributes to a PO.
    """
    
    course = models.ForeignKey(
        'Course',
        on_delete=models.CASCADE,
        related_name='course_pos',
        help_text="Course"
    )
    
    program_outcome = models.ForeignKey(
        'ProgramOutcome',
        on_delete=models.CASCADE,
        related_name='course_pos',
        help_text="Program Outcome"
    )
    
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.00,
        validators=[MinValueValidator(0.1), MaxValueValidator(10.0)],
        help_text="Weight/importance of this PO in the course (default: 1.0)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'course_program_outcomes'
        unique_together = ['course', 'program_outcome']
        verbose_name = 'Course-PO Mapping'
        verbose_name_plural = 'Course-PO Mappings'
    
    def __str__(self):
        return f"{self.course.code} → {self.program_outcome.code} (weight: {self.weight})"


# =============================================================================
# ENROLLMENT MODEL
# =============================================================================

class Enrollment(models.Model):
    """
    Student enrollment in courses.
    Tracks which students are taking which courses.
    """
    
    student = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'role': 'STUDENT'},
        help_text="Enrolled student"
    )
    
    course = models.ForeignKey(
        'Course',
        on_delete=models.CASCADE,
        related_name='enrollments',
        help_text="Course"
    )
    
    enrolled_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Enrollment date"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether enrollment is currently active"
    )
    
    final_grade = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Final grade for the course (0-100)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'enrollments'
        unique_together = ['student', 'course']
        ordering = ['-enrolled_at']
        verbose_name = 'Enrollment'
        verbose_name_plural = 'Enrollments'
    
    def __str__(self):
        return f"{self.student.username} enrolled in {self.course.code}"
