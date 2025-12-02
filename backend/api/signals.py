"""
AcuRate - Signal Handlers

Automatic calculation of PO/LO achievements when grades are added/updated/deleted.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Count, Q
from decimal import Decimal
from django.core.cache import cache
from .models import (
    StudentGrade, StudentPOAchievement, StudentLOAchievement,
    Assessment, ProgramOutcome, LearningOutcome, Enrollment,
    AssessmentLO, LOPO
)
from .cache_utils import invalidate_dashboard_cache, invalidate_user_cache


def calculate_po_achievement(student, program_outcome):
    """
    Calculate and update PO achievement for a student.
    
    Slayttaki mantık: LO'lar → PO'lar
    Algorithm:
    1. Find all Learning Outcomes that contribute to this PO (via LOPO)
    2. Get StudentLOAchievement for each LO
    3. Calculate weighted average using LOPO weights
    4. Update or create StudentPOAchievement record
    """
    # Get all enrollments for this student
    enrollments = Enrollment.objects.filter(student=student, is_active=True)
    enrolled_course_ids = enrollments.values_list('course_id', flat=True)
    
    # Find all LOs that contribute to this PO (via LOPO mapping)
    lopos = LOPO.objects.filter(
        program_outcome=program_outcome,
        learning_outcome__course_id__in=enrolled_course_ids,
        learning_outcome__is_active=True
    ).select_related('learning_outcome')
    
    if not lopos.exists():
        # No LO mappings for this PO, try fallback to old method
        # (direct assessment-PO relationship)
        calculate_po_achievement_fallback(student, program_outcome)
        return
    
    # Get LO achievements for all related LOs
    total_weighted_score = Decimal('0.00')
    total_weight = Decimal('0.00')
    total_assessments = 0
    completed_assessments = 0
    
    for lopo in lopos:
        lo = lopo.learning_outcome
        
        # Get student's LO achievement
        lo_achievement = StudentLOAchievement.objects.filter(
            student=student,
            learning_outcome=lo
        ).first()
        
        if lo_achievement:
            # Use LO achievement percentage and LOPO weight
            lo_score = lo_achievement.current_percentage
            lo_weight = lopo.weight
            
            total_weighted_score += lo_score * lo_weight
            total_weight += lo_weight
            
            total_assessments += lo_achievement.total_assessments
            completed_assessments += lo_achievement.completed_assessments
    
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


def calculate_po_achievement_fallback(student, program_outcome):
    """
    Fallback method: Calculate PO from assessments directly (old method).
    Used when no LO-PO mappings exist.
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
    from .models import CoursePO
    total_weighted_score = Decimal('0.00')
    total_weight = Decimal('0.00')
    
    for grade in grades:
        assessment = grade.assessment
        course_po = CoursePO.objects.filter(
            course=assessment.course,
            program_outcome=program_outcome
        ).first()
        course_po_weight = course_po.weight if course_po else Decimal('1.00')
        
        if assessment.max_score > 0:
            percentage = (grade.score / assessment.max_score) * Decimal('100.00')
        else:
            percentage = Decimal('0.00')
        
        combined_weight = assessment.weight * course_po_weight
        total_weighted_score += percentage * combined_weight
        total_weight += combined_weight
    
    if total_weight > 0:
        achievement_percentage = total_weighted_score / total_weight
    else:
        achievement_percentage = Decimal('0.00')
    
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
    
    # Calculate weighted average using AssessmentLO weights
    # Slayttaki mantık: Midterm %60 + Project %40 gibi
    total_weighted_score = Decimal('0.00')
    total_weight = Decimal('0.00')
    
    for grade in grades:
        assessment = grade.assessment
        
        # Get AssessmentLO weight for this assessment-LO pair
        assessment_lo = AssessmentLO.objects.filter(
            assessment=assessment,
            learning_outcome=learning_outcome
        ).first()
        
        # Use AssessmentLO weight if exists, otherwise use assessment weight
        if assessment_lo:
            weight = assessment_lo.weight
        else:
            # Fallback to assessment weight if no explicit mapping
            weight = assessment.weight
        
        # Calculate percentage for this grade
        if assessment.max_score > 0:
            percentage = (grade.score / assessment.max_score) * Decimal('100.00')
        else:
            percentage = Decimal('0.00')
        
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
    LO'lar önce hesaplanır (assessment'lerden), sonra PO'lar (LO'lardan).
    """
    student = instance.student
    assessment = instance.assessment
    
    # Update LO achievements first (LOs are calculated from assessments)
    for lo in assessment.related_los.all():
        calculate_lo_achievement(student, lo)
    
    # Then update PO achievements (POs are calculated from LOs)
    # Get all POs that are related to LOs affected by this assessment
    affected_los = assessment.related_los.all()
    affected_pos = set()
    for lo in affected_los:
        # Get POs via LOPO mappings
        pos_from_lo = ProgramOutcome.objects.filter(lo_pos__learning_outcome=lo).distinct()
        affected_pos.update(pos_from_lo)
    
    # Also include direct PO relationships (fallback)
    direct_pos = assessment.related_pos.all()
    affected_pos.update(direct_pos)
    
    # Update all affected POs
    for po in affected_pos:
        calculate_po_achievement(student, po)
    
    # Invalidate cache for this student
    invalidate_user_cache(student.id)
    invalidate_dashboard_cache(user_id=student.id)


@receiver(post_delete, sender=StudentGrade)
def update_achievements_on_grade_delete(sender, instance, **kwargs):
    """
    Update PO and LO achievements when a grade is deleted.
    LO'lar önce hesaplanır, sonra PO'lar.
    """
    student = instance.student
    assessment = instance.assessment
    
    # Update LO achievements first
    for lo in assessment.related_los.all():
        calculate_lo_achievement(student, lo)
    
    # Then update PO achievements (from LOs)
    affected_los = assessment.related_los.all()
    affected_pos = set()
    for lo in affected_los:
        pos_from_lo = ProgramOutcome.objects.filter(lo_pos__learning_outcome=lo).distinct()
        affected_pos.update(pos_from_lo)
    
    direct_pos = assessment.related_pos.all()
    affected_pos.update(direct_pos)
    
    for po in affected_pos:
        calculate_po_achievement(student, po)
    
    # Invalidate cache for this student
    invalidate_user_cache(student.id)
    invalidate_dashboard_cache(user_id=student.id)
    
    # Invalidate cache for this student
    invalidate_user_cache(student.id)
    invalidate_dashboard_cache(user_id=student.id)


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
    
    # Update LO achievements first (from assessments)
    for lo in instance.related_los.all():
        for student in students:
            calculate_lo_achievement(student, lo)
    
    # Then update PO achievements (from LOs)
    affected_pos = set()
    for lo in instance.related_los.all():
        pos_from_lo = ProgramOutcome.objects.filter(lo_pos__learning_outcome=lo).distinct()
        affected_pos.update(pos_from_lo)
    
    # Also include direct PO relationships
    for po in instance.related_pos.all():
        affected_pos.add(po)
    
    for po in affected_pos:
        for student in students:
            calculate_po_achievement(student, po)
            # Invalidate cache for affected students
            invalidate_user_cache(student.id)
            invalidate_dashboard_cache(user_id=student.id)
            # Invalidate cache for affected students
            invalidate_user_cache(student.id)
            invalidate_dashboard_cache(user_id=student.id)


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
    
    # Update LO achievements first (from assessments)
    learning_outcomes = LearningOutcome.objects.filter(
        course=course,
        is_active=True
    )
    for lo in learning_outcomes:
        calculate_lo_achievement(student, lo)
    
    # Then update PO achievements (from LOs)
    # Get all POs related to LOs in this course
    affected_pos = set()
    for lo in learning_outcomes:
        pos_from_lo = ProgramOutcome.objects.filter(lo_pos__learning_outcome=lo).distinct()
        affected_pos.update(pos_from_lo)
    
    # Also include direct PO relationships from assessments
    for assessment in assessments:
        for po in assessment.related_pos.all():
            affected_pos.add(po)
    
    for po in affected_pos:
        calculate_po_achievement(student, po)
    
    # Invalidate cache for this student
    invalidate_user_cache(student.id)
    invalidate_dashboard_cache(user_id=student.id)

