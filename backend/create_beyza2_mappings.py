#!/usr/bin/env python
"""
Script to create Assessment-LO and LO-PO mappings for beyza2 student
This ensures the scores page can display the flow visualization
"""

import os
import sys
import django
from decimal import Decimal

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import (
    User, ProgramOutcome, Course, Enrollment, Assessment, 
    LearningOutcome, AssessmentLO, LOPO
)


def create_mappings_for_beyza2():
    """Create all necessary mappings for beyza2 student"""
    print("\n" + "="*70)
    print("🔗 CREATING MAPPINGS FOR BEYZA2 STUDENT")
    print("="*70 + "\n")
    
    # Get beyza2 student
    try:
        student = User.objects.get(username='beyza2', email='beyza2@student.acurate.edu')
        print(f"✅ Found student: {student.username} ({student.get_full_name()})")
        print(f"   Department: {student.department}\n")
    except User.DoesNotExist:
        print("❌ ERROR: Student beyza2 not found!")
        print("   Please create the student first or check the username/email.")
        return
    
    # Get student's enrollments
    enrollments = Enrollment.objects.filter(student=student)
    if not enrollments.exists():
        print("❌ ERROR: Student has no enrollments!")
        print("   Please create enrollments first.")
        return
    
    courses = [e.course for e in enrollments]
    print(f"📚 Found {len(courses)} courses for {student.username}:")
    for course in courses:
        print(f"   • {course.code}: {course.name}")
    print()
    
    # Get Program Outcomes for student's department
    pos = ProgramOutcome.objects.filter(department=student.department)
    if not pos.exists():
        print(f"❌ ERROR: No Program Outcomes found for department: {student.department}")
        print("   Please create Program Outcomes first.")
        return
    
    print(f"🎯 Found {pos.count()} Program Outcomes:")
    for po in pos:
        print(f"   • {po.code}: {po.title}")
    print()
    
    # Get Learning Outcomes for student's courses
    learning_outcomes = LearningOutcome.objects.filter(course__in=courses)
    if not learning_outcomes.exists():
        print("❌ ERROR: No Learning Outcomes found for student's courses!")
        print("   Please create Learning Outcomes first.")
        return
    
    print(f"📖 Found {learning_outcomes.count()} Learning Outcomes:")
    for lo in learning_outcomes:
        print(f"   • {lo.course.code} - {lo.code}: {lo.title}")
    print()
    
    # Get Assessments for student's courses
    assessments = Assessment.objects.filter(course__in=courses)
    if not assessments.exists():
        print("❌ ERROR: No Assessments found for student's courses!")
        print("   Please create Assessments first.")
        return
    
    print(f"📋 Found {assessments.count()} Assessments:")
    for assessment in assessments:
        print(f"   • {assessment.course.code} - {assessment.title}")
    print()
    
    # Create Assessment-LO mappings
    print("🔗 Creating Assessment-LO Mappings...")
    assessment_lo_count = 0
    
    # Group learning outcomes by course
    los_by_course = {}
    for lo in learning_outcomes:
        if lo.course.id not in los_by_course:
            los_by_course[lo.course.id] = []
        los_by_course[lo.course.id].append(lo)
    
    for assessment in assessments:
        course_los = los_by_course.get(assessment.course.id, [])
        
        if not course_los:
            print(f"   ⚠️  No LOs found for {assessment.course.code} - {assessment.title}, skipping...")
            continue
        
        # Check if mappings already exist
        existing_mappings = AssessmentLO.objects.filter(assessment=assessment)
        if existing_mappings.exists():
            print(f"   ✓ Mappings already exist for {assessment.course.code} - {assessment.title}")
            continue
        
        # Create mappings: each assessment maps to 1-3 LOs
        # Select 1-3 LOs randomly
        import random
        num_los = min(len(course_los), random.randint(1, min(3, len(course_los))))
        selected_los = random.sample(course_los, num_los)
        
        # Create weights that sum to 1.0
        if num_los == 1:
            weights = [Decimal('1.00')]
        elif num_los == 2:
            weights = [Decimal('0.60'), Decimal('0.40')]
        else:  # 3 LOs
            weights = [Decimal('0.40'), Decimal('0.35'), Decimal('0.25')]
        
        for i, lo in enumerate(selected_los):
            mapping, created = AssessmentLO.objects.get_or_create(
                assessment=assessment,
                learning_outcome=lo,
                defaults={'weight': weights[i]}
            )
            if created:
                assessment_lo_count += 1
                print(f"   ✓ Created: {assessment.course.code} {assessment.title} → {lo.code} (weight: {weights[i]})")
            else:
                print(f"   → Already exists: {assessment.course.code} {assessment.title} → {lo.code}")
    
    print(f"✅ Created/Updated {assessment_lo_count} Assessment-LO Mappings\n")
    
    # Create LO-PO mappings
    print("🔗 Creating LO-PO Mappings...")
    lo_po_count = 0
    
    for lo in learning_outcomes:
        # Check if mappings already exist
        existing_mappings = LOPO.objects.filter(learning_outcome=lo)
        if existing_mappings.exists():
            print(f"   ✓ Mappings already exist for {lo.course.code} - {lo.code}")
            continue
        
        # Get POs related to this course (via CoursePO if exists)
        from api.models import CoursePO
        course_pos = CoursePO.objects.filter(course=lo.course).values_list('program_outcome', flat=True)
        related_pos = [po for po in pos if po.id in course_pos] if course_pos.exists() else list(pos)
        
        if not related_pos:
            print(f"   ⚠️  No POs found for {lo.course.code} - {lo.code}, skipping...")
            continue
        
        # Create mappings: each LO maps to 1-3 POs
        import random
        num_pos = min(len(related_pos), random.randint(1, min(3, len(related_pos))))
        selected_pos = random.sample(related_pos, num_pos)
        
        # Create weights that sum to 1.0
        if num_pos == 1:
            weights = [Decimal('1.00')]
        elif num_pos == 2:
            weights = [Decimal('0.60'), Decimal('0.40')]
        else:  # 3 POs
            weights = [Decimal('0.40'), Decimal('0.35'), Decimal('0.25')]
        
        for i, po in enumerate(selected_pos):
            mapping, created = LOPO.objects.get_or_create(
                learning_outcome=lo,
                program_outcome=po,
                defaults={'weight': weights[i], 'is_active': True}
            )
            if created:
                lo_po_count += 1
                print(f"   ✓ Created: {lo.course.code} {lo.code} → {po.code} (weight: {weights[i]})")
            else:
                print(f"   → Already exists: {lo.course.code} {lo.code} → {po.code}")
    
    print(f"✅ Created/Updated {lo_po_count} LO-PO Mappings\n")
    
    # Summary
    print("="*70)
    print("🎉 MAPPING CREATION COMPLETED!")
    print("="*70)
    print(f"\n📊 SUMMARY:")
    print(f"   • Assessment-LO Mappings: {AssessmentLO.objects.filter(assessment__course__in=courses).count()}")
    print(f"   • LO-PO Mappings: {LOPO.objects.filter(learning_outcome__course__in=courses).count()}")
    print(f"\n✅ Scores page should now work for {student.username}!")
    print("="*70 + "\n")


if __name__ == '__main__':
    try:
        create_mappings_for_beyza2()
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

