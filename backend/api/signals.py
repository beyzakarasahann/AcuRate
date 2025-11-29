"""
AcuRate - Signal Handlers

Automatic calculation of PO/LO achievements when grades are added/updated/deleted.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Count, Q
from decimal import Decimal
from .models import (
    StudentGrade, StudentPOAchievement, StudentLOAchievement,
    Assessment, ProgramOutcome, LearningOutcome, Enrollment
)


def calculate_po_achievement(student, program_outcome):
    """
    Calculate and update PO achievement for a student.
    
    Algorithm:
    1. Find all assessments related to this PO for courses the student is enrolled in
    2. Calculate weighted average of grades for those assessments
    3. Count total and completed assessments
    4. Update or create StudentPOAchievement record
    """
    # Get all enrollments for this student
    enrollments = Enrollment.objects.filter(student=student, is_active=True)
    enrolled_course_ids = enrollments.values_list('course_id', flat=True)
    
    # Find all assessments related to this PO in enrolled courses
    assessments = Assessment.objects.filter(
        course_id__in=enrolled_course_ids,
        related_pos=program_outcome,
        is_active=True
    ).distinct()
    
    total_assessments = assessments.count()
    
    if total_assessments == 0:
        # No assessments for this PO, set achievement to 0
        StudentPOAchievement.objects.update_or_create(
            student=student,
            program_outcome=program_outcome,
            defaults={
                'current_percentage': Decimal('0.00'),
                'total_assessments': 0,
                'completed_assessments': 0
            }
        )
        return
    
    # Get all grades for these assessments
    grades = StudentGrade.objects.filter(
        student=student,
        assessment__in=assessments
    ).select_related('assessment')
    
    completed_assessments = grades.count()
    
    if completed_assessments == 0:
        # No grades yet, set achievement to 0
        StudentPOAchievement.objects.update_or_create(
            student=student,
            program_outcome=program_outcome,
            defaults={
                'current_percentage': Decimal('0.00'),
                'total_assessments': total_assessments,
                'completed_assessments': 0
            }
        )
        return
    
    # Calculate weighted average
    # Weight = assessment weight * course-PO weight
    total_weighted_score = Decimal('0.00')
    total_weight = Decimal('0.00')
    
    for grade in grades:
        assessment = grade.assessment
        # Get course-PO weight (default to 1.0 if not found)
        from .models import CoursePO
        course_po = CoursePO.objects.filter(
            course=assessment.course,
            program_outcome=program_outcome
        ).first()
        course_po_weight = course_po.weight if course_po else Decimal('1.00')
        
        # Calculate percentage for this grade
        if assessment.max_score > 0:
            percentage = (grade.score / assessment.max_score) * Decimal('100.00')
        else:
            percentage = Decimal('0.00')
        
        # Combined weight: assessment weight * course-PO weight
        combined_weight = assessment.weight * course_po_weight
        
        total_weighted_score += percentage * combined_weight
        total_weight += combined_weight
    
    # Calculate final achievement percentage
    if total_weight > 0:
        achievement_percentage = total_weighted_score / total_weight
    else:
        achievement_percentage = Decimal('0.00')
    
    # Update or create achievement record
    StudentPOAchievement.objects.update_or_create(
        student=student,
        program_outcome=program_outcome,
        defaults={
            'current_percentage': achievement_percentage,
            'total_assessments': total_assessments,
            'completed_assessments': completed_assessments
        }
    )


def calculate_lo_achievement(student, learning_outcome):
    """
    Calculate and update LO achievement for a student.
    
    Algorithm:
    1. Find all assessments related to this LO in the LO's course
    2. Calculate weighted average of grades for those assessments
    3. Count total and completed assessments
    4. Update or create StudentLOAchievement record
    """
    course = learning_outcome.course
    
    # Check if student is enrolled in this course
    enrollment = Enrollment.objects.filter(
        student=student,
        course=course,
        is_active=True
    ).first()
    
    if not enrollment:
        # Student not enrolled, remove achievement if exists
        StudentLOAchievement.objects.filter(
            student=student,
            learning_outcome=learning_outcome
        ).delete()
        return
    
    # Find all assessments related to this LO
    assessments = Assessment.objects.filter(
        course=course,
        related_los=learning_outcome,
        is_active=True
    ).distinct()
    
    total_assessments = assessments.count()
    
    if total_assessments == 0:
        # No assessments for this LO, set achievement to 0
        StudentLOAchievement.objects.update_or_create(
            student=student,
            learning_outcome=learning_outcome,
            defaults={
                'current_percentage': Decimal('0.00'),
                'total_assessments': 0,
                'completed_assessments': 0
            }
        )
        return
    
    # Get all grades for these assessments
    grades = StudentGrade.objects.filter(
        student=student,
        assessment__in=assessments
    ).select_related('assessment')
    
    completed_assessments = grades.count()
    
    if completed_assessments == 0:
        # No grades yet, set achievement to 0
        StudentLOAchievement.objects.update_or_create(
            student=student,
            learning_outcome=learning_outcome,
            defaults={
                'current_percentage': Decimal('0.00'),
                'total_assessments': total_assessments,
                'completed_assessments': 0
            }
        )
        return
    
    # Calculate weighted average
    total_weighted_score = Decimal('0.00')
    total_weight = Decimal('0.00')
    
    for grade in grades:
        assessment = grade.assessment
        
        # Calculate percentage for this grade
        if assessment.max_score > 0:
            percentage = (grade.score / assessment.max_score) * Decimal('100.00')
        else:
            percentage = Decimal('0.00')
        
        # Weight = assessment weight
        weight = assessment.weight
        
        total_weighted_score += percentage * weight
        total_weight += weight
    
    # Calculate final achievement percentage
    if total_weight > 0:
        achievement_percentage = total_weighted_score / total_weight
    else:
        achievement_percentage = Decimal('0.00')
    
    # Update or create achievement record
    StudentLOAchievement.objects.update_or_create(
        student=student,
        learning_outcome=learning_outcome,
        defaults={
            'current_percentage': achievement_percentage,
            'total_assessments': total_assessments,
            'completed_assessments': completed_assessments
        }
    )


@receiver(post_save, sender=StudentGrade)
def update_achievements_on_grade_save(sender, instance, created, **kwargs):
    """
    Update PO and LO achievements when a grade is saved.
    """
    student = instance.student
    assessment = instance.assessment
    
    # Update PO achievements for all POs related to this assessment
    for po in assessment.related_pos.all():
        calculate_po_achievement(student, po)
    
    # Update LO achievements for all LOs related to this assessment
    for lo in assessment.related_los.all():
        calculate_lo_achievement(student, lo)


@receiver(post_delete, sender=StudentGrade)
def update_achievements_on_grade_delete(sender, instance, **kwargs):
    """
    Update PO and LO achievements when a grade is deleted.
    """
    student = instance.student
    assessment = instance.assessment
    
    # Update PO achievements for all POs related to this assessment
    for po in assessment.related_pos.all():
        calculate_po_achievement(student, po)
    
    # Update LO achievements for all LOs related to this assessment
    for lo in assessment.related_los.all():
        calculate_lo_achievement(student, lo)


@receiver(post_save, sender=Assessment)
def update_achievements_on_assessment_change(sender, instance, created, **kwargs):
    """
    Update achievements when an assessment is created or updated
    (e.g., when related_pos or related_los change).
    """
    if not instance.is_active:
        return
    
    # Get all students enrolled in this course
    enrollments = Enrollment.objects.filter(
        course=instance.course,
        is_active=True
    )
    
    students = [enrollment.student for enrollment in enrollments]
    
    # Update PO achievements for all students
    for po in instance.related_pos.all():
        for student in students:
            calculate_po_achievement(student, po)
    
    # Update LO achievements for all students
    for lo in instance.related_los.all():
        for student in students:
            calculate_lo_achievement(student, lo)


@receiver(post_save, sender=Enrollment)
def update_achievements_on_enrollment(sender, instance, created, **kwargs):
    """
    Update achievements when a student enrolls in a course.
    """
    if not instance.is_active:
        return
    
    student = instance.student
    course = instance.course
    
    # Get all assessments for this course
    assessments = Assessment.objects.filter(
        course=course,
        is_active=True
    )
    
    # Update PO achievements
    for assessment in assessments:
        for po in assessment.related_pos.all():
            calculate_po_achievement(student, po)
    
    # Update LO achievements for all LOs in this course
    learning_outcomes = LearningOutcome.objects.filter(
        course=course,
        is_active=True
    )
    for lo in learning_outcomes:
        calculate_lo_achievement(student, lo)

