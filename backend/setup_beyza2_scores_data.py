#!/usr/bin/env python
"""
Script to setup complete data for beyza2 student to make scores page work properly
Creates: enrollments, assessments, learning outcomes, grades, and all mappings
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
    LearningOutcome, AssessmentLO, LOPO, StudentGrade, CoursePO
)


def setup_beyza2_data():
    """Setup complete data for beyza2 student"""
    print("\n" + "="*70)
    print("🎓 SETTING UP COMPLETE DATA FOR BEYZA2 STUDENT")
    print("="*70 + "\n")
    
    # Get or create beyza2 student
    try:
        student = User.objects.get(username='beyza2', email='beyza2@student.acurate.edu')
        print(f"✅ Found student: {student.username} ({student.get_full_name()})")
        print(f"   Student ID: {student.student_id}")
        print(f"   Department: {student.department}\n")
    except User.DoesNotExist:
        print("❌ ERROR: Student beyza2 not found!")
        print("   Please create the student first.")
        return
    
    # Get or create Program Outcomes for Computer Science
    department = student.department or 'Computer Science'
    print(f"🎯 Setting up Program Outcomes for {department}...")
    
    pos = []
    po_codes = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6']
    po_titles = [
        'Problem Solving',
        'Communication',
        'Ethics',
        'Teamwork',
        'Technical Skills',
        'Research'
    ]
    po_descriptions = [
        'Apply knowledge of mathematics, science, and engineering to solve complex problems',
        'Communicate effectively with a range of audiences',
        'Understand professional and ethical responsibility',
        'Function effectively on a team',
        'Apply engineering techniques, skills, and modern tools',
        'Conduct research and analyze data'
    ]
    
    for code, title, desc in zip(po_codes, po_titles, po_descriptions):
        po, created = ProgramOutcome.objects.get_or_create(
            code=code,
            department=department,
            defaults={
                'title': title,
                'description': desc,
                'target_percentage': Decimal('70.00'),
                'is_active': True
            }
        )
        if created:
            print(f"   ✓ Created {po.code}: {po.title}")
        else:
            print(f"   → Found existing {po.code}: {po.title}")
        pos.append(po)
    
    print(f"✅ {len(pos)} Program Outcomes ready\n")
    
    # Get or create courses for beyza2
    print("📚 Setting up Courses...")
    
    # Get a teacher (or create one if needed)
    teacher = User.objects.filter(role=User.Role.TEACHER).first()
    if not teacher:
        print("   ⚠️  No teacher found, creating one...")
        teacher = User.objects.create_user(
            username='teacher1',
            email='teacher1@acurate.edu',
            password='teacher123',
            first_name='John',
            last_name='Teacher',
            role=User.Role.TEACHER,
            department=department,
            is_active=True
        )
        print(f"   ✓ Created teacher: {teacher.username}")
    
    courses = []
    course_data = [
        {
            'code': 'CS301',
            'name': 'Data Structures and Algorithms',
            'credits': 4,
            'semester': Course.Semester.FALL,
            'academic_year': '2024-2025'
        },
        {
            'code': 'CS302',
            'name': 'Database Systems',
            'credits': 3,
            'semester': Course.Semester.FALL,
            'academic_year': '2024-2025'
        },
        {
            'code': 'CS303',
            'name': 'Software Engineering',
            'credits': 4,
            'semester': Course.Semester.SPRING,
            'academic_year': '2024-2025'
        }
    ]
    
    for course_info in course_data:
        course, created = Course.objects.get_or_create(
            code=course_info['code'],
            academic_year=course_info['academic_year'],
            defaults={
                'name': course_info['name'],
                'description': f"Course description for {course_info['name']}",
                'credits': course_info['credits'],
                'semester': course_info['semester'],
                'department': department,
                'teacher': teacher,
            }
        )
        if created:
            print(f"   ✓ Created {course.code}: {course.name}")
        else:
            print(f"   → Found existing {course.code}: {course.name}")
        courses.append(course)
    
    print(f"✅ {len(courses)} Courses ready\n")
    
    # Create Course-PO mappings
    print("🔗 Creating Course-PO Mappings...")
    for course in courses:
        # Each course maps to 2-3 POs
        selected_pos = pos[:3] if len(pos) >= 3 else pos
        for i, po in enumerate(selected_pos):
            weight = Decimal('1.00') if i == 0 else Decimal('0.50')
            CoursePO.objects.get_or_create(
                course=course,
                program_outcome=po,
                defaults={'weight': weight}
            )
    print(f"✅ Course-PO Mappings created\n")
    
    # Create Enrollments
    print("📝 Creating Enrollments...")
    enrollments = []
    for course in courses:
        enrollment, created = Enrollment.objects.get_or_create(
            student=student,
            course=course,
            defaults={
                'is_active': True,
                'final_grade': None  # Will be calculated from grades
            }
        )
        if created:
            print(f"   ✓ Enrolled in {course.code}")
        else:
            print(f"   → Already enrolled in {course.code}")
        enrollments.append(enrollment)
    print(f"✅ {len(enrollments)} Enrollments ready\n")
    
    # Create Learning Outcomes for each course
    print("📖 Creating Learning Outcomes...")
    learning_outcomes = []
    lo_templates = [
        {'code': 'LO1', 'title': 'Understand Core Concepts', 'description': 'Demonstrate understanding of fundamental concepts'},
        {'code': 'LO2', 'title': 'Apply Knowledge', 'description': 'Apply knowledge to solve problems'},
        {'code': 'LO3', 'title': 'Analyze and Evaluate', 'description': 'Analyze and evaluate solutions'},
    ]
    
    for course in courses:
        for lo_template in lo_templates:
            lo, created = LearningOutcome.objects.get_or_create(
                code=f"{course.code}-{lo_template['code']}",
                course=course,
                defaults={
                    'title': lo_template['title'],
                    'description': f"{lo_template['description']} in {course.name}",
                    'target_percentage': Decimal('70.00'),
                    'is_active': True
                }
            )
            if created:
                print(f"   ✓ Created {lo.code} for {course.code}")
            learning_outcomes.append(lo)
    
    print(f"✅ {len(learning_outcomes)} Learning Outcomes created\n")
    
    # Create Assessments for each course
    print("📋 Creating Assessments...")
    assessments = []
    assessment_templates = [
        {'title': 'Midterm Exam', 'type': 'MIDTERM', 'weight': Decimal('30.00')},
        {'title': 'Final Exam', 'type': 'FINAL', 'weight': Decimal('40.00')},
        {'title': 'Project', 'type': 'PROJECT', 'weight': Decimal('20.00')},
        {'title': 'Homework 1', 'type': 'HOMEWORK', 'weight': Decimal('10.00')},
    ]
    
    for course in courses:
        for template in assessment_templates:
            assessment, created = Assessment.objects.get_or_create(
                course=course,
                title=template['title'],
                defaults={
                    'description': f"{template['title']} for {course.name}",
                    'assessment_type': template['type'],
                    'weight': template['weight'],
                    'max_score': Decimal('100.00'),
                    'is_active': True
                }
            )
            if created:
                print(f"   ✓ Created {assessment.title} for {course.code}")
            assessments.append(assessment)
    
    print(f"✅ {len(assessments)} Assessments created\n")
    
    # Create Assessment-LO Mappings
    print("🔗 Creating Assessment-LO Mappings...")
    assessment_lo_count = 0
    
    for assessment in assessments:
        course_los = [lo for lo in learning_outcomes if lo.course.id == assessment.course.id]
        
        if not course_los:
            continue
        
        # Each assessment maps to 1-2 LOs
        import random
        num_los = min(len(course_los), random.randint(1, 2))
        selected_los = random.sample(course_los, num_los)
        
        # Create weights that sum to 1.0
        if num_los == 1:
            weights = [Decimal('1.00')]
        else:
            weights = [Decimal('0.60'), Decimal('0.40')]
        
        for i, lo in enumerate(selected_los):
            mapping, created = AssessmentLO.objects.get_or_create(
                assessment=assessment,
                learning_outcome=lo,
                defaults={'weight': weights[i]}
            )
            if created:
                assessment_lo_count += 1
                print(f"   ✓ {assessment.course.code} {assessment.title} → {lo.code} (weight: {weights[i]})")
    
    print(f"✅ {assessment_lo_count} Assessment-LO Mappings created\n")
    
    # Create LO-PO Mappings
    print("🔗 Creating LO-PO Mappings...")
    lo_po_count = 0
    
    for lo in learning_outcomes:
        # Get POs related to this course
        course_pos = CoursePO.objects.filter(course=lo.course).values_list('program_outcome', flat=True)
        related_pos = [po for po in pos if po.id in course_pos] if course_pos.exists() else pos[:3]
        
        if not related_pos:
            continue
        
        # Each LO maps to 1-2 POs
        import random
        num_pos = min(len(related_pos), random.randint(1, 2))
        selected_pos = random.sample(related_pos, num_pos)
        
        # Create weights (convert percentage to weight: 100% = 10.0, 50% = 5.0)
        if num_pos == 1:
            weights = [Decimal('10.00')]  # 100%
        else:
            weights = [Decimal('6.00'), Decimal('4.00')]  # 60% and 40%
        
        for i, po in enumerate(selected_pos):
            mapping, created = LOPO.objects.get_or_create(
                learning_outcome=lo,
                program_outcome=po,
                defaults={'weight': weights[i]}
            )
            if created:
                lo_po_count += 1
                print(f"   ✓ {lo.course.code} {lo.code} → {po.code} (weight: {weights[i]})")
    
    print(f"✅ {lo_po_count} LO-PO Mappings created\n")
    
    # Create Grades for beyza2
    print("📊 Creating Grades for beyza2...")
    grade_count = 0
    
    for assessment in assessments:
        # Generate realistic grades (75-95 range for good student)
        import random
        score = Decimal(str(random.randint(75, 95)))
        
        grade, created = StudentGrade.objects.get_or_create(
            student=student,
            assessment=assessment,
            defaults={
                'score': score,
                'feedback': f'Good performance on {assessment.title}.'
            }
        )
        if created:
            grade_count += 1
            print(f"   ✓ Grade for {assessment.course.code} {assessment.title}: {score}/100")
    
    print(f"✅ {grade_count} Grades created\n")
    
    # Calculate final grades for enrollments
    print("📈 Calculating Final Grades...")
    for enrollment in enrollments:
        course_assessments = [a for a in assessments if a.course.id == enrollment.course.id]
        total_weighted_score = Decimal('0.00')
        total_weight = Decimal('0.00')
        
        for assessment in course_assessments:
            grade = StudentGrade.objects.filter(
                student=student,
                assessment=assessment
            ).first()
            
            if grade:
                percentage = (grade.score / assessment.max_score) * 100
                weighted_contribution = (percentage * assessment.weight) / 100
                total_weighted_score += weighted_contribution
                total_weight += assessment.weight
        
        if total_weight > 0:
            final_grade = (total_weighted_score / total_weight) * 100
            enrollment.final_grade = final_grade
            enrollment.save()
            print(f"   ✓ {enrollment.course.code} Final Grade: {final_grade:.2f}%")
    
    print(f"✅ Final Grades calculated\n")
    
    # Summary
    print("="*70)
    print("🎉 DATA SETUP COMPLETED!")
    print("="*70)
    print(f"\n📊 SUMMARY:")
    print(f"   • Program Outcomes: {len(pos)}")
    print(f"   • Courses: {len(courses)}")
    print(f"   • Enrollments: {len(enrollments)}")
    print(f"   • Learning Outcomes: {len(learning_outcomes)}")
    print(f"   • Assessments: {len(assessments)}")
    print(f"   • Assessment-LO Mappings: {AssessmentLO.objects.filter(assessment__course__in=courses).count()}")
    print(f"   • LO-PO Mappings: {LOPO.objects.filter(learning_outcome__course__in=courses).count()}")
    print(f"   • Grades: {StudentGrade.objects.filter(student=student).count()}")
    print(f"\n✅ Scores page should now work perfectly for {student.username}!")
    print("="*70 + "\n")


if __name__ == '__main__':
    try:
        setup_beyza2_data()
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

