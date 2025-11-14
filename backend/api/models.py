"""
AcuRate - Academic Performance Analysis System
Django Models

This module contains all database models for the AcuRate system:
- User (Custom User Model with roles)
- ProgramOutcome (Learning outcomes/PO)
- Course (Academic courses)
- CoursePO (Course-PO mapping with weights)
- Enrollment (Student-Course enrollment)
- Assessment (Exams, projects, assignments)
- StudentGrade (Individual grades)
- StudentPOAchievement (PO achievement tracking)
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError


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
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='courses_teaching',
        limit_choices_to={'role': User.Role.TEACHER},
        help_text="Teacher assigned to this course"
    )
    
    program_outcomes = models.ManyToManyField(
        ProgramOutcome,
        through='CoursePO',
        related_name='courses',
        help_text="Program outcomes covered by this course"
    )
    
    enrolled_students = models.ManyToManyField(
        User,
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
        Course,
        on_delete=models.CASCADE,
        related_name='course_pos',
        help_text="Course"
    )
    
    program_outcome = models.ForeignKey(
        ProgramOutcome,
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
        User,
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'role': User.Role.STUDENT},
        help_text="Enrolled student"
    )
    
    course = models.ForeignKey(
        Course,
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
        Course,
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
    
    related_pos = models.ManyToManyField(
        ProgramOutcome,
        related_name='assessments',
        help_text="Program outcomes this assessment evaluates"
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
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assessments'
        ordering = ['course', 'due_date']
        verbose_name = 'Assessment'
        verbose_name_plural = 'Assessments'
    
    def __str__(self):
        return f"{self.course.code}: {self.title} ({self.get_assessment_type_display()})"


# =============================================================================
# STUDENT GRADE MODEL
# =============================================================================

class StudentGrade(models.Model):
    """
    Individual grades for students on specific assessments.
    """
    
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='grades',
        limit_choices_to={'role': User.Role.STUDENT},
        help_text="Student"
    )
    
    assessment = models.ForeignKey(
        Assessment,
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


# =============================================================================
# STUDENT PO ACHIEVEMENT MODEL
# =============================================================================

class StudentPOAchievement(models.Model):
    """
    Tracks student achievement for each Program Outcome.
    Aggregates performance across all relevant assessments.
    """
    
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='po_achievements',
        limit_choices_to={'role': User.Role.STUDENT},
        help_text="Student"
    )
    
    program_outcome = models.ForeignKey(
        ProgramOutcome,
        on_delete=models.CASCADE,
        related_name='student_achievements',
        help_text="Program Outcome"
    )
    
    current_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
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
# CONTACT REQUEST MODEL
# =============================================================================

class ContactRequest(models.Model):
    """
    Model for institutional contact/demo requests from the contact page.
    """
    
    class InstitutionType(models.TextChoices):
        UNIVERSITY = 'university', 'University'
        FACULTY = 'faculty', 'Faculty / Department'
        SCHOOL = 'school', 'School / College'
        TRAINING = 'training', 'Training Center'
        COMPANY = 'company', 'Company'
        OTHER = 'other', 'Other'
    
    class RequestType(models.TextChoices):
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
    
    def __str__(self):
        return f"{self.institution_name} - {self.contact_name} ({self.get_request_type_display()})"
