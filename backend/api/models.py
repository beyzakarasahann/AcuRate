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
        Course,
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
        ProgramOutcome,
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
        LearningOutcome,
        on_delete=models.CASCADE,
        related_name='lo_pos',
        help_text="Learning Outcome"
    )
    
    program_outcome = models.ForeignKey(
        ProgramOutcome,
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
    
    related_los = models.ManyToManyField(
        LearningOutcome,
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
        Assessment,
        on_delete=models.CASCADE,
        related_name='assessment_los',
        help_text="Assessment"
    )
    
    learning_outcome = models.ForeignKey(
        LearningOutcome,
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
# STUDENT LO ACHIEVEMENT MODEL
# =============================================================================

class StudentLOAchievement(models.Model):
    """
    Tracks individual student achievement for specific Learning Outcomes.
    Similar to StudentPOAchievement but for course-specific LOs.
    """
    
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='lo_achievements',
        limit_choices_to={'role': User.Role.STUDENT},
        help_text="Student"
    )
    
    learning_outcome = models.ForeignKey(
        LearningOutcome,
        on_delete=models.CASCADE,
        related_name='student_achievements',
        help_text="Learning Outcome"
    )
    
    current_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
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


# =============================================================================
# ACTIVITY LOG MODEL
# =============================================================================

class ActivityLog(models.Model):
    """
    System-wide activity log for tracking all important actions.
    Used by super admin to monitor system activity.
    """
    
    class ActionType(models.TextChoices):
        USER_CREATED = 'user_created', 'User Created'
        USER_UPDATED = 'user_updated', 'User Updated'
        USER_DELETED = 'user_deleted', 'User Deleted'
        COURSE_CREATED = 'course_created', 'Course Created'
        COURSE_UPDATED = 'course_updated', 'Course Updated'
        COURSE_DELETED = 'course_deleted', 'Course Deleted'
        ENROLLMENT_CREATED = 'enrollment_created', 'Enrollment Created'
        ENROLLMENT_UPDATED = 'enrollment_updated', 'Enrollment Updated'
        ASSESSMENT_CREATED = 'assessment_created', 'Assessment Created'
        ASSESSMENT_UPDATED = 'assessment_updated', 'Assessment Updated'
        GRADE_ASSIGNED = 'grade_assigned', 'Grade Assigned'
        GRADE_UPDATED = 'grade_updated', 'Grade Updated'
        DEPARTMENT_CREATED = 'department_created', 'Department Created'
        DEPARTMENT_UPDATED = 'department_updated', 'Department Updated'
        PO_CREATED = 'po_created', 'Program Outcome Created'
        PO_UPDATED = 'po_updated', 'Program Outcome Updated'
        LOGIN = 'login', 'User Login'
        PASSWORD_RESET = 'password_reset', 'Password Reset'
    
    action_type = models.CharField(
        max_length=50,
        choices=ActionType.choices,
        help_text="Type of action performed"
    )
    
    # User who performed the action (can be null for system actions)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
        help_text="User who performed this action"
    )
    
    # Institution/department context (for filtering)
    institution = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='institution_activity_logs',
        limit_choices_to={'role': User.Role.INSTITUTION},
        help_text="Institution this activity belongs to"
    )
    
    department = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Department name (for filtering)"
    )
    
    # Action description (generic, no sensitive data)
    description = models.TextField(
        help_text="Description of the action (no sensitive data)"
    )
    
    # Related object info (generic references, no sensitive data)
    related_object_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Type of related object (e.g., 'User', 'Course')"
    )
    
    related_object_id = models.IntegerField(
        blank=True,
        null=True,
        help_text="ID of related object"
    )
    
    # Metadata (JSON field for additional info)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata (no sensitive data)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['action_type']),
            models.Index(fields=['institution']),
            models.Index(fields=['department']),
        ]
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'
    
    def __str__(self):
        return f"{self.get_action_type_display()} - {self.description[:50]}"
