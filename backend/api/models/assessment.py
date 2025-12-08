"""ASSESSMENT Models Module"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError


# =============================================================================
# ASSESSMENT MODEL
# =============================================================================

class Assessment(models.Model):
    """
    Assessments/evaluations within a course (exams, projects, assignments, etc.)
    Each assessment can be mapped to multiple program outcomes.
    """
    
    class AssessmentType(models.TextChoices):
        MIDTERM = 'MIDTERM', 'Midterm Exam'
        FINAL = 'FINAL', 'Final Exam'
        QUIZ = 'QUIZ', 'Quiz'
        HOMEWORK = 'HOMEWORK', 'Homework'
        PROJECT = 'PROJECT', 'Project'
        LAB = 'LAB', 'Lab Work'
        PRESENTATION = 'PRESENTATION', 'Presentation'
        OTHER = 'OTHER', 'Other'
    
    course = models.ForeignKey(
        'Course',
        on_delete=models.CASCADE,
        related_name='assessments',
        help_text="Course this assessment belongs to"
    )
    
    title = models.CharField(
        max_length=200,
        help_text="Assessment title (e.g., Midterm Exam 1)"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Assessment description"
    )
    
    assessment_type = models.CharField(
        max_length=20,
        choices=AssessmentType.choices,
        help_text="Type of assessment"
    )
    
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Weight in final grade (%)"
    )
    
    max_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=100.00,
        validators=[MinValueValidator(0)],
        help_text="Maximum possible score"
    )
    
    # NOTE: related_pos field removed to enforce 3-level graph structure:
    # Assessment → LO → PO (not Assessment → PO directly)
    # Use related_los instead, which maps to POs through LOPO
    
    related_los = models.ManyToManyField(
        'LearningOutcome',
        through='AssessmentLO',
        related_name='assessments',
        blank=True,
        help_text="Learning outcomes this assessment evaluates (with weights)"
    )
    
    due_date = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Due date/exam date"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this assessment is currently active"
    )
    
    # Feedback ranges for automatic feedback generation
    feedback_ranges = models.JSONField(
        default=list,
        blank=True,
        help_text="List of feedback ranges: [{'min_score': 90, 'max_score': 100, 'feedback': 'Excellent'}, ...]"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assessments'
        ordering = ['course', 'due_date']
        verbose_name = 'Assessment'
        verbose_name_plural = 'Assessments'
    
    def __str__(self):
        return f"{self.course.code}: {self.title} ({self.get_assessment_type_display()})"
    
    def get_feedback_for_score(self, score):
        """Get automatic feedback based on score and feedback ranges"""
        if not self.feedback_ranges:
            return ""
        
        score_percentage = (float(score) / float(self.max_score)) * 100 if self.max_score > 0 else 0
        
        for range_item in self.feedback_ranges:
            min_score = range_item.get('min_score', 0)
            max_score = range_item.get('max_score', 100)
            if min_score <= score_percentage <= max_score:
                return range_item.get('feedback', '')
        
        return ""


# =============================================================================
# ASSESSMENT-LO MAPPING MODEL
# =============================================================================

class AssessmentLO(models.Model):
    """
    Through model for Assessment-LearningOutcome relationship.
    Allows weighting of how much each assessment contributes to an LO.
    This is used to calculate LO scores from assessment scores.
    Example: Midterm %60 + Project %40 → LO
    """
    
    assessment = models.ForeignKey(
        'Assessment',
        on_delete=models.CASCADE,
        related_name='assessment_los',
        help_text="Assessment"
    )
    
    learning_outcome = models.ForeignKey(
        'LearningOutcome',
        on_delete=models.CASCADE,
        related_name='assessment_los',
        help_text="Learning Outcome"
    )
    
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.00,
        validators=[MinValueValidator(0.01), MaxValueValidator(10.0)],
        help_text="Weight/contribution of this assessment to the LO (0.01-10.0 scale, where 1.0 = 10%, 10.0 = 100%)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assessment_learning_outcomes'
        unique_together = ['assessment', 'learning_outcome']
        verbose_name = 'Assessment-LO Mapping'
        verbose_name_plural = 'Assessment-LO Mappings'
    
    def __str__(self):
        return f"{self.assessment.title} → {self.learning_outcome.code} (weight: {self.weight})"


# =============================================================================
# STUDENT GRADE MODEL
# =============================================================================

class StudentGrade(models.Model):
    """
    Individual grades for students on specific assessments.
    """
    
    student = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='grades',
        limit_choices_to={'role': 'STUDENT'},
        help_text="Student"
    )
    
    assessment = models.ForeignKey(
        'Assessment',
        on_delete=models.CASCADE,
        related_name='grades',
        help_text="Assessment"
    )
    
    score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Score received"
    )
    
    feedback = models.TextField(
        blank=True,
        help_text="Teacher's feedback"
    )
    
    graded_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the grade was recorded"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_grades'
        unique_together = ['student', 'assessment']
        ordering = ['-graded_at']
        verbose_name = 'Student Grade'
        verbose_name_plural = 'Student Grades'
    
    def __str__(self):
        return f"{self.student.username} - {self.assessment.title}: {self.score}/{self.assessment.max_score}"
    
    @property
    def percentage(self):
        """Calculate percentage score"""
        if self.assessment.max_score > 0:
            return (self.score / self.assessment.max_score) * 100
        return 0
    
    @property
    def weighted_contribution(self):
        """Calculate contribution to final grade"""
        return (self.percentage * self.assessment.weight) / 100
    
    def clean(self):
        """Validate that score doesn't exceed max_score"""
        if self.score > self.assessment.max_score:
            raise ValidationError(f"Score cannot exceed maximum score of {self.assessment.max_score}")
