#!/usr/bin/env python
"""
Script to ensure all mappings exist for beyza2 student's courses
This will create/verify Assessment-LO and LO-PO mappings for all enrolled courses
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
    User, Enrollment, Assessment, LearningOutcome, AssessmentLO, LOPO,
    ProgramOutcome, CoursePO
)


def ensure_mappings_for_beyza2():
    """Ensure all mappings exist for beyza2 student"""
    print("\n" + "="*70)
    print("🔧 FIXING MAPPINGS FOR BEYZA2 STUDENT")
    print("="*70 + "\n")
    
    # Get beyza2 student
    try:
        student = User.objects.get(username='beyza2', email='beyza2@student.acurate.edu')
        print(f"✅ Found student: {student.username} ({student.get_full_name()})")
        print(f"   Department: {student.department}\n")
    except User.DoesNotExist:
        print("❌ ERROR: Student beyza2 not found!")
        return
    
    # Get ALL enrollments (both active and inactive)
    enrollments = Enrollment.objects.filter(student=student)
    if not enrollments.exists():
        print("❌ ERROR: Student has no enrollments!")
        return
    
    courses = list(set([e.course for e in enrollments]))
    print(f"📚 Found {len(courses)} courses:")
    for course in courses:
        active = enrollments.filter(course=course, is_active=True).exists()
        status = "ACTIVE" if active else "COMPLETED"
        print(f"   • {course.code}: {course.name} ({status})")
    print()
    
    # Get Program Outcomes for student's department
    pos = list(ProgramOutcome.objects.filter(department=student.department))
    if not pos:
        print(f"❌ ERROR: No Program Outcomes found for department: {student.department}")
        return
    
    print(f"🎯 Found {len(pos)} Program Outcomes:")
    for po in pos:
        print(f"   • {po.code}: {po.title}")
    print()
    
    total_assessment_los_created = 0
    total_lo_pos_created = 0
    
    # Process each course
    for course in courses:
        print(f"📖 Processing course: {course.code} - {course.name}")
        
        # Get Learning Outcomes for this course
        los = list(LearningOutcome.objects.filter(course=course))
        if not los:
            print(f"   ⚠️  No Learning Outcomes found, skipping...")
            continue
        
        print(f"   📝 Learning Outcomes: {len(los)}")
        for lo in los:
            print(f"      • {lo.code}: {lo.title}")
        
        # Get Assessments for this course
        assessments = list(Assessment.objects.filter(course=course))
        if not assessments:
            print(f"   ⚠️  No Assessments found, skipping...")
            continue
        
        print(f"   📋 Assessments: {len(assessments)}")
        for assessment in assessments:
            print(f"      • {assessment.title}")
        
        # Create/Verify Assessment-LO mappings
        print(f"\n   🔗 Creating/Verifying Assessment-LO Mappings...")
        assessment_lo_created = 0
        
        for assessment in assessments:
            # Get existing mappings
            existing = AssessmentLO.objects.filter(assessment=assessment)
            
            if existing.exists():
                print(f"      ✓ {assessment.title}: {existing.count()} mappings exist")
            else:
                # Create mappings - each assessment maps to 1-3 LOs
                import random
                num_los = min(len(los), random.randint(1, min(3, len(los))))
                selected_los = random.sample(los, num_los)
                
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
                        assessment_lo_created += 1
                        print(f"      ✓ Created: {assessment.title} → {lo.code} (weight: {weights[i]})")
        
        total_assessment_los_created += assessment_lo_created
        
        # Create/Verify LO-PO mappings
        print(f"\n   🔗 Creating/Verifying LO-PO Mappings...")
        lo_po_created = 0
        
        # Get POs related to this course (via CoursePO)
        course_pos = CoursePO.objects.filter(course=course).values_list('program_outcome', flat=True)
        related_pos = [po for po in pos if po.id in course_pos] if course_pos.exists() else pos
        
        if not related_pos:
            print(f"      ⚠️  No POs related to this course")
            related_pos = pos  # Use all POs as fallback
        
        for lo in los:
            # Get existing mappings
            existing = LOPO.objects.filter(learning_outcome=lo)
            
            if existing.exists():
                print(f"      ✓ {lo.code}: {existing.count()} mappings exist")
            else:
                # Create mappings - each LO maps to 1-3 POs
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
                        lo_po_created += 1
                        print(f"      ✓ Created: {lo.code} → {po.code} (weight: {weights[i]})")
        
        total_lo_pos_created += lo_po_created
        print()
    
    # Final verification
    print("="*70)
    print("✅ VERIFICATION")
    print("="*70 + "\n")
    
    for course in courses:
        assessments = Assessment.objects.filter(course=course)
        los = LearningOutcome.objects.filter(course=course)
        assessment_los = AssessmentLO.objects.filter(assessment__course=course)
        lo_pos = LOPO.objects.filter(learning_outcome__course=course)
        
        print(f"📊 {course.code}:")
        print(f"   Assessments: {assessments.count()}")
        print(f"   Learning Outcomes: {los.count()}")
        print(f"   Assessment-LO Mappings: {assessment_los.count()}")
        print(f"   LO-PO Mappings: {lo_pos.count()}")
        
        # Check if all assessments have mappings
        assessments_without_mappings = []
        for assessment in assessments:
            if not AssessmentLO.objects.filter(assessment=assessment).exists():
                assessments_without_mappings.append(assessment.title)
        
        if assessments_without_mappings:
            print(f"   ⚠️  Assessments without LO mappings: {', '.join(assessments_without_mappings)}")
        
        # Check if all LOs have mappings
        los_without_mappings = []
        for lo in los:
            if not LOPO.objects.filter(learning_outcome=lo).exists():
                los_without_mappings.append(lo.code)
        
        if los_without_mappings:
            print(f"   ⚠️  LOs without PO mappings: {', '.join(los_without_mappings)}")
        
        print()
    
    print("="*70)
    print("🎉 MAPPING FIX COMPLETED!")
    print("="*70)
    print(f"\n📊 SUMMARY:")
    print(f"   • Assessment-LO Mappings Created: {total_assessment_los_created}")
    print(f"   • LO-PO Mappings Created: {total_lo_pos_created}")
    print(f"\n✅ All mappings are now configured for {student.username}!")
    print("="*70 + "\n")


if __name__ == '__main__':
    try:
        ensure_mappings_for_beyza2()
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

