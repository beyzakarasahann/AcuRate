#!/usr/bin/env python
"""
AcuRate - Test Data Generator (Course Analytics Edition)

This script creates comprehensive test data for Course Analytics:
- Program Outcomes (5 POs)
- Teacher: Ahmet Bulut
- Students: 50 students (including beyza2 and beyza.karasahan)
- Courses: Multiple courses taught by Ahmet Bulut
- Enrollments: All students in same courses
- Assessments: Midterm, Final, Project, Quiz, Assignment
- Student grades: beyza2 (high), beyza.karasahan (low), others (medium)
- Final grades calculated

Usage:
    python create_test_data.py
"""

import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal
import random
from django.utils import timezone

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import (
    User, ProgramOutcome, Course, CoursePO,
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    LearningOutcome, StudentLOAchievement
)


def clear_existing_data():
    """Clear all existing test data"""
    print("🗑️  Clearing existing data...")
    StudentLOAchievement.objects.all().delete()
    StudentPOAchievement.objects.all().delete()
    StudentGrade.objects.all().delete()
    Assessment.objects.all().delete()
    LearningOutcome.objects.all().delete()
    Enrollment.objects.all().delete()
    CoursePO.objects.all().delete()
    Course.objects.all().delete()
    ProgramOutcome.objects.all().delete()
    # Keep superusers and existing users, but clear their enrollments
    User.objects.filter(role=User.Role.STUDENT).exclude(username__in=['beyza2', 'beyza.karasahan']).delete()
    User.objects.filter(role=User.Role.TEACHER).exclude(username__in=['ahmet.bulut']).delete()
    User.objects.filter(role=User.Role.INSTITUTION).exclude(username__in=['institution']).delete()
    print("✅ Existing data cleared\n")


def create_program_outcomes():
    """Create 5 Program Outcomes"""
    print("📚 Creating Program Outcomes...")
    
    pos = [
        {
            'code': 'PO1',
            'title': 'Engineering Knowledge',
            'description': 'An ability to apply knowledge of mathematics, science, and engineering appropriate to the degree discipline.',
            'target_percentage': Decimal('70.00')
        },
        {
            'code': 'PO2',
            'title': 'Problem Analysis',
            'description': 'An ability to identify, formulate, research literature and analyze complex engineering problems.',
            'target_percentage': Decimal('75.00')
        },
        {
            'code': 'PO3',
            'title': 'Design/Development of Solutions',
            'description': 'An ability to design solutions for complex engineering problems and design systems, components or processes.',
            'target_percentage': Decimal('70.00')
        },
        {
            'code': 'PO4',
            'title': 'Investigation',
            'description': 'An ability to investigate complex engineering problems in a methodical way including literature survey.',
            'target_percentage': Decimal('70.00')
        },
        {
            'code': 'PO5',
            'title': 'Modern Tool Usage',
            'description': 'An ability to create, select and apply appropriate techniques, resources, and modern engineering and IT tools.',
            'target_percentage': Decimal('65.00')
        }
    ]
    
    created_pos = []
    for po_data in pos:
        po, created = ProgramOutcome.objects.get_or_create(
            code=po_data['code'],
            defaults={
                'title': po_data['title'],
                'description': po_data['description'],
                'department': 'Computer Science',
                'target_percentage': po_data['target_percentage'],
                'is_active': True
            }
        )
        if created:
            created_pos.append(po)
            print(f"  ✓ Created {po.code}: {po.title} (Target: {po.target_percentage}%)")
        else:
            created_pos.append(po)
            print(f"  → Using existing {po.code}: {po.title}")
    
    print(f"✅ Using {len(created_pos)} Program Outcomes\n")
    return created_pos


def create_teacher():
    """Create teacher Ahmet Bulut"""
    print("👨‍🏫 Creating Teacher...")
    
    teacher, created = User.objects.get_or_create(
        username='ahmet.bulut',
        defaults={
            'email': 'ahmet.bulut@acurate.edu',
            'first_name': 'Ahmet',
            'last_name': 'Bulut',
            'role': User.Role.TEACHER,
            'department': 'Computer Science'
        }
    )
    
    if created:
        teacher.set_password('ahmet123')
        teacher.save()
        print(f"  ✓ Created {teacher.get_full_name()} ({teacher.username})")
    else:
        # Update password in case it changed
        teacher.set_password('ahmet123')
        teacher.save()
        print(f"  → Using existing {teacher.get_full_name()} ({teacher.username})")
    
    print(f"✅ Teacher ready\n")
    return teacher


def create_institution():
    """Create institution admin user"""
    print("🏛️  Creating Institution Admin...")
    
    institution, created = User.objects.get_or_create(
        username='institution',
        defaults={
            'email': 'institution@acurate.edu',
            'first_name': 'Institution',
            'last_name': 'Admin',
            'role': User.Role.INSTITUTION,
            'department': 'Administration'
        }
    )
    
    if created:
        institution.set_password('institution123')
        institution.save()
        print(f"  ✓ Created {institution.get_full_name()} ({institution.username})")
    else:
        # Update password in case it changed
        institution.set_password('institution123')
        institution.save()
        print(f"  → Using existing {institution.get_full_name()} ({institution.username})")
    
    print(f"✅ Institution ready\n")
    return institution


def create_students():
    """Create 50 students including beyza2 and beyza.karasahan"""
    print("👨‍🎓 Creating Students...")
    
    students = []
    
    # Get or create beyza2
    beyza2, created = User.objects.get_or_create(
        username='beyza2',
        defaults={
            'email': 'beyza2@student.acurate.edu',
            'first_name': 'Beyza',
            'last_name': 'Test',
            'role': User.Role.STUDENT,
            'student_id': '2024001',
            'department': 'Computer Science',
            'year_of_study': 2
        }
    )
    if created:
        beyza2.set_password('beyza123')
        beyza2.save()
        print(f"  ✓ Created {beyza2.username} ({beyza2.student_id})")
    else:
        beyza2.set_password('beyza123')
        beyza2.save()
        print(f"  → Using existing {beyza2.username}")
    students.append(beyza2)
    
    # Get or create beyza.karasahan
    beyza_karasahan, created = User.objects.get_or_create(
        username='beyza.karasahan',
        defaults={
            'email': 'beyza.karasahan@student.acurate.edu',
            'first_name': 'Beyza',
            'last_name': 'Karasahan',
            'role': User.Role.STUDENT,
            'student_id': '2024002',
            'department': 'Computer Science',
            'year_of_study': 2
        }
    )
    if created:
        beyza_karasahan.set_password('beyza123')
        beyza_karasahan.save()
        print(f"  ✓ Created {beyza_karasahan.username} ({beyza_karasahan.student_id})")
    else:
        beyza_karasahan.set_password('beyza123')
        beyza_karasahan.save()
        print(f"  → Using existing {beyza_karasahan.username}")
    students.append(beyza_karasahan)
    
    # Create 48 more students
    # Get existing student IDs to avoid duplicates
    existing_student_ids = set(User.objects.filter(role=User.Role.STUDENT).exclude(student_id__isnull=True).values_list('student_id', flat=True))
    
    student_counter = 3
    created_count = 0
    
    while created_count < 48:
        student_id = f'2024{student_counter:03d}'
        username = f'student{student_counter}'
        
        # Skip if student_id already exists
        if student_id in existing_student_ids:
            student_counter += 1
            continue
        
        first_names = ['Ali', 'Ayşe', 'Mehmet', 'Fatma', 'Mustafa', 'Zeynep', 'Ahmet', 'Elif', 'Hasan', 'Merve']
        last_names = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Arslan', 'Öztürk', 'Aydın', 'Özdemir']
        
        try:
            student, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@student.acurate.edu',
                    'first_name': random.choice(first_names),
                    'last_name': random.choice(last_names),
                    'role': User.Role.STUDENT,
                    'student_id': student_id,
                    'department': 'Computer Science',
                    'year_of_study': random.randint(1, 4)
                }
            )
            if created:
                student.set_password('student123')
                student.save()
                students.append(student)
                existing_student_ids.add(student_id)
                created_count += 1
                if created_count <= 10:  # Print first 10
                    print(f"  ✓ Created {student.username} ({student.student_id})")
        except Exception as e:
            # Skip if there's an error (e.g., duplicate username)
            pass
        
        student_counter += 1
    
    print(f"✅ Created/Using {len(students)} Students\n")
    return students


def create_courses(teacher):
    """Create multiple courses taught by Ahmet Bulut"""
    print("📖 Creating Courses...")
    
    courses_data = [
        {
            'code': 'CSE301',
            'name': 'Data Structures and Algorithms',
            'description': 'Study of fundamental data structures (arrays, linked lists, trees, graphs) and algorithms.',
            'credits': 4,
            'semester': Course.Semester.FALL,
            'academic_year': '2024-2025'
        },
        {
            'code': 'CSE302',
            'name': 'Database Systems',
            'description': 'Introduction to database design, SQL, normalization, and database management systems.',
            'credits': 3,
            'semester': Course.Semester.FALL,
            'academic_year': '2024-2025'
        },
        {
            'code': 'CSE303',
            'name': 'Software Engineering',
            'description': 'Software development lifecycle, design patterns, testing, and project management.',
            'credits': 3,
            'semester': Course.Semester.SPRING,
            'academic_year': '2024-2025'
        }
    ]
    
    courses = []
    for course_data in courses_data:
        course, created = Course.objects.get_or_create(
            code=course_data['code'],
            defaults={
                'name': course_data['name'],
                'description': course_data['description'],
                'department': 'Computer Science',
                'credits': course_data['credits'],
                'semester': course_data['semester'],
                'academic_year': course_data['academic_year'],
                'teacher': teacher
            }
        )
        if created:
            courses.append(course)
            print(f"  ✓ Created {course.code}: {course.name} ({course.credits} credits)")
        else:
            # Update teacher
            course.teacher = teacher
            course.save()
            courses.append(course)
            print(f"  → Using existing {course.code}: {course.name}")
    
    print(f"✅ Using {len(courses)} Courses\n")
    return courses


def create_course_po_mappings(courses, pos):
    """Create Course-PO mappings"""
    print("🔗 Creating Course-PO Mappings...")
    
    # Clear existing mappings for these courses
    CoursePO.objects.filter(course__in=courses).delete()
    
    # CSE301 → PO1, PO2, PO5
    mappings = [
        (courses[0], pos[0], Decimal('1.5')),  # CSE301 → PO1
        (courses[0], pos[1], Decimal('1.5')),  # CSE301 → PO2
        (courses[0], pos[4], Decimal('1.0')),  # CSE301 → PO5
        
        # CSE302 → PO1, PO3, PO5
        (courses[1], pos[0], Decimal('1.0')),  # CSE302 → PO1
        (courses[1], pos[2], Decimal('1.5')),  # CSE302 → PO3
        (courses[1], pos[4], Decimal('1.2')),  # CSE302 → PO5
        
        # CSE303 → PO2, PO3, PO4
        (courses[2], pos[1], Decimal('1.5')),  # CSE303 → PO2
        (courses[2], pos[2], Decimal('1.3')),  # CSE303 → PO3
        (courses[2], pos[3], Decimal('1.0')),  # CSE303 → PO4
    ]
    
    course_pos = []
    for course, po, weight in mappings:
        cpo = CoursePO.objects.create(
            course=course,
            program_outcome=po,
            weight=weight
        )
        course_pos.append(cpo)
        print(f"  ✓ {course.code} → {po.code} (weight: {weight})")
    
    print(f"✅ Created {len(course_pos)} Course-PO Mappings\n")
    return course_pos


def create_enrollments(students, courses):
    """Create enrollments - all students in all courses"""
    print("📝 Creating Enrollments...")
    
    # Clear existing enrollments
    Enrollment.objects.filter(course__in=courses).delete()
    
    enrollments = []
    for student in students:
        for course in courses:
            enrollment, created = Enrollment.objects.get_or_create(
                student=student,
                course=course,
                defaults={'is_active': False}  # Completed courses for analytics
            )
            enrollments.append(enrollment)
            if student.username in ['beyza2', 'beyza.karasahan']:
                print(f"  ✓ {student.username} enrolled in {course.code}")
    
    print(f"✅ Created {len(enrollments)} Enrollments\n")
    return enrollments


def create_assessments(courses, pos):
    """Create detailed assessments for each course"""
    print("📋 Creating Assessments...")
    
    # Clear existing assessments
    Assessment.objects.filter(course__in=courses).delete()
    
    assessments = []
    now = timezone.now()
    
    # CSE301 Assessments
    cse301_assessments = [
        {
            'title': 'Quiz 1',
            'type': Assessment.AssessmentType.QUIZ,
            'weight': Decimal('10.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[0]],
            'due_date': now - timedelta(days=60)
        },
        {
            'title': 'Midterm Exam',
            'type': Assessment.AssessmentType.MIDTERM,
            'weight': Decimal('30.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[0], pos[1]],
            'due_date': now - timedelta(days=30)
        },
        {
            'title': 'Project',
            'type': Assessment.AssessmentType.PROJECT,
            'weight': Decimal('20.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[1], pos[4]],
            'due_date': now - timedelta(days=15)
        },
        {
            'title': 'Final Exam',
            'type': Assessment.AssessmentType.FINAL,
            'weight': Decimal('40.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[0], pos[1], pos[4]],
            'due_date': now - timedelta(days=5)
        }
    ]
    
    for assess_data in cse301_assessments:
        assessment = Assessment.objects.create(
            course=courses[0],
            title=assess_data['title'],
            assessment_type=assess_data['type'],
            weight=assess_data['weight'],
            max_score=assess_data['max_score'],
            due_date=assess_data['due_date'],
            is_active=True
        )
        assessment.related_pos.set(assess_data['pos'])
        assessments.append(assessment)
        print(f"  ✓ {courses[0].code}: {assessment.title}")
    
    # CSE302 Assessments
    cse302_assessments = [
        {
            'title': 'Assignment 1',
            'type': Assessment.AssessmentType.HOMEWORK,
            'weight': Decimal('15.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[0]],
            'due_date': now - timedelta(days=55)
        },
        {
            'title': 'Midterm Exam',
            'type': Assessment.AssessmentType.MIDTERM,
            'weight': Decimal('35.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[0], pos[2]],
            'due_date': now - timedelta(days=25)
        },
        {
            'title': 'Database Project',
            'type': Assessment.AssessmentType.PROJECT,
            'weight': Decimal('25.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[2], pos[4]],
            'due_date': now - timedelta(days=10)
        },
        {
            'title': 'Final Exam',
            'type': Assessment.AssessmentType.FINAL,
            'weight': Decimal('25.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[0], pos[2], pos[4]],
            'due_date': now - timedelta(days=3)
        }
    ]
    
    for assess_data in cse302_assessments:
        assessment = Assessment.objects.create(
            course=courses[1],
            title=assess_data['title'],
            assessment_type=assess_data['type'],
            weight=assess_data['weight'],
            max_score=assess_data['max_score'],
            due_date=assess_data['due_date'],
            is_active=True
        )
        assessment.related_pos.set(assess_data['pos'])
        assessments.append(assessment)
        print(f"  ✓ {courses[1].code}: {assessment.title}")
    
    # CSE303 Assessments
    cse303_assessments = [
        {
            'title': 'Quiz 1',
            'type': Assessment.AssessmentType.QUIZ,
            'weight': Decimal('10.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[1]],
            'due_date': now - timedelta(days=50)
        },
        {
            'title': 'Midterm Exam',
            'type': Assessment.AssessmentType.MIDTERM,
            'weight': Decimal('30.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[1], pos[2]],
            'due_date': now - timedelta(days=20)
        },
        {
            'title': 'Software Project',
            'type': Assessment.AssessmentType.PROJECT,
            'weight': Decimal('30.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[2], pos[3]],
            'due_date': now - timedelta(days=8)
        },
        {
            'title': 'Final Exam',
            'type': Assessment.AssessmentType.FINAL,
            'weight': Decimal('30.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[1], pos[2], pos[3]],
            'due_date': now - timedelta(days=1)
        }
    ]
    
    for assess_data in cse303_assessments:
        assessment = Assessment.objects.create(
            course=courses[2],
            title=assess_data['title'],
            assessment_type=assess_data['type'],
            weight=assess_data['weight'],
            max_score=assess_data['max_score'],
            due_date=assess_data['due_date'],
            is_active=True
        )
        assessment.related_pos.set(assess_data['pos'])
        assessments.append(assessment)
        print(f"  ✓ {courses[2].code}: {assessment.title}")
    
    print(f"✅ Created {len(assessments)} Assessments\n")
    return assessments


def create_student_grades(students, assessments):
    """Create grades: beyza2 (high), beyza.karasahan (low), others (medium)"""
    print("💯 Creating Student Grades...")
    
    # Clear existing grades
    StudentGrade.objects.filter(assessment__course__in=[a.course for a in assessments]).delete()
    
    grades = []
    beyza2 = None
    beyza_karasahan = None
    
    for student in students:
        if student.username == 'beyza2':
            beyza2 = student
        elif student.username == 'beyza.karasahan':
            beyza_karasahan = student
    
    for student in students:
        for assessment in assessments:
            # Determine score range based on student
            if student.username == 'beyza2':
                # High scores: 85-100
                score = Decimal(str(random.randint(85, 100)))
                feedback = "Excellent work! Outstanding performance."
            elif student.username == 'beyza.karasahan':
                # Low scores: 30-50
                score = Decimal(str(random.randint(30, 50)))
                feedback = "Needs improvement. Please review the material and seek help."
            else:
                # Medium scores: 60-80 (normal distribution for better graphs)
                score = Decimal(str(random.randint(60, 80)))
                feedback = "Good work! Keep it up."
            
            grade = StudentGrade.objects.create(
                student=student,
                assessment=assessment,
                score=score,
                feedback=feedback
            )
            grades.append(grade)
            
            if student.username in ['beyza2', 'beyza.karasahan']:
                print(f"  ✓ {student.username} - {assessment.course.code} {assessment.title}: {score}/{assessment.max_score}")
    
    print(f"✅ Created {len(grades)} Student Grades\n")
    return grades


def calculate_final_grades(students, courses):
    """Calculate and set final grades for enrollments"""
    print("📊 Calculating Final Grades...")
    
    for student in students:
        for course in courses:
            enrollment = Enrollment.objects.get(student=student, course=course)
            
            # Get all assessments for this course
            assessments = Assessment.objects.filter(course=course, is_active=True)
            
            # Calculate weighted average
            total_weighted_score = Decimal('0.00')
            total_weight = Decimal('0.00')
            
            for assessment in assessments:
                try:
                    grade = StudentGrade.objects.get(student=student, assessment=assessment)
                    weight = assessment.weight
                    percentage = (grade.score / assessment.max_score) * Decimal('100.00')
                    total_weighted_score += percentage * weight
                    total_weight += weight
                except StudentGrade.DoesNotExist:
                    pass
            
            if total_weight > 0:
                final_grade = total_weighted_score / total_weight
                enrollment.final_grade = final_grade
                enrollment.is_active = False  # Mark as completed
                enrollment.save()
                
                if student.username in ['beyza2', 'beyza.karasahan']:
                    print(f"  ✓ {student.username} - {course.code}: {final_grade:.2f}")
    
    print(f"✅ Final Grades Calculated\n")


def create_student_po_achievements(students, pos):
    """Create PO achievements for students"""
    print("🎯 Creating Student PO Achievements...")
    
    # Clear existing achievements
    StudentPOAchievement.objects.filter(student__in=students).delete()
    
    achievements = []
    
    for student in students:
        for po in pos:
            # Calculate achievement based on student performance
            if student.username == 'beyza2':
                # High achievement: 85-95
                current_percentage = Decimal(str(random.randint(85, 95) + random.random()))
            elif student.username == 'beyza.karasahan':
                # Low achievement: 30-50
                current_percentage = Decimal(str(random.randint(30, 50) + random.random()))
            else:
                # Medium achievement: 60-80
                current_percentage = Decimal(str(random.randint(60, 80) + random.random()))
            
            # Count assessments related to this PO
            enrollments = Enrollment.objects.filter(student=student)
            total_assessments = 0
            for enrollment in enrollments:
                total_assessments += Assessment.objects.filter(
                    course=enrollment.course,
                    related_pos=po
                ).count()
            
            # Completed assessments
            if student.username == 'beyza2':
                completed = total_assessments  # All completed
            elif student.username == 'beyza.karasahan':
                completed = max(1, int(total_assessments * 0.6))  # 60% completed
            else:
                completed = int(total_assessments * random.uniform(0.8, 1.0))
            
            achievement = StudentPOAchievement.objects.create(
                student=student,
                program_outcome=po,
                current_percentage=current_percentage,
                total_assessments=total_assessments,
                completed_assessments=completed
            )
            achievements.append(achievement)
            
            if student.username in ['beyza2', 'beyza.karasahan']:
                status = "✓" if achievement.is_target_met else "✗"
                print(f"  {status} {student.username} - {po.code}: {current_percentage:.1f}% ({completed}/{total_assessments})")
    
    print(f"✅ Created {len(achievements)} PO Achievements\n")
    return achievements


def print_summary(pos, teacher, students, courses, enrollments, assessments, grades, po_achievements, learning_outcomes=None, lo_achievements=None):
    """Print summary of created data"""
    print("\n" + "="*70)
    print("🎉 TEST DATA CREATION COMPLETED!")
    print("="*70)
    
    print("\n📊 SUMMARY:")
    print(f"  • Program Outcomes: {len(pos)}")
    if learning_outcomes:
        print(f"  • Learning Outcomes: {len(learning_outcomes)}")
    print(f"  • Teacher: {teacher.get_full_name()} ({teacher.username})")
    print(f"  • Students: {len(students)}")
    print(f"  • Courses: {len(courses)}")
    print(f"  • Course-PO Mappings: {CoursePO.objects.count()}")
    print(f"  • Enrollments: {len(enrollments)}")
    print(f"  • Assessments: {len(assessments)}")
    print(f"  • Student Grades: {len(grades)}")
    print(f"  • PO Achievements: {len(po_achievements)}")
    if lo_achievements:
        print(f"  • LO Achievements: {len(lo_achievements)}")
    
    # Show class sizes
    print("\n📚 CLASS SIZES:")
    for course in courses:
        count = Enrollment.objects.filter(course=course).count()
        print(f"  • {course.code}: {count} students")
    
    # Show grade ranges
    print("\n📈 GRADE RANGES:")
    for course in courses:
        enrollments = Enrollment.objects.filter(course=course, final_grade__isnull=False)
        if enrollments.exists():
            grades_list = [float(e.final_grade) for e in enrollments]
            print(f"  • {course.code}: Min={min(grades_list):.1f}, Max={max(grades_list):.1f}, Avg={sum(grades_list)/len(grades_list):.1f}")
    
    print("\n🔐 DEMO CREDENTIALS:")
    print("\n  👨‍🏫 Teacher:")
    print(f"    • Username: {teacher.username}")
    print(f"      Password: ahmet123")
    print(f"      Name: {teacher.get_full_name()}\n")
    
    print("  👨‍🎓 Key Students:")
    for student in students:
        if student.username in ['beyza2', 'beyza.karasahan']:
            enrollment = Enrollment.objects.filter(student=student).first()
            final_grade = enrollment.final_grade if enrollment and enrollment.final_grade else None
            grade_str = f" (Final: {final_grade:.1f})" if final_grade else ""
            print(f"    • Username: {student.username}")
            print(f"      Password: beyza123")
            print(f"      Name: {student.get_full_name()} ({student.student_id}){grade_str}\n")
    
    print("  👨‍🎓 Other Students:")
    print(f"    • Password: student123")
    print(f"    • Total: {len([s for s in students if s.username not in ['beyza2', 'beyza.karasahan']])} students")
    
    print("\n🌐 LOGIN CREDENTIALS:")
    print("\n  👨‍🏫 TEACHER:")
    print("     Username: ahmet.bulut")
    print("     Password: ahmet123")
    print("\n  🏛️  INSTITUTION:")
    print("     Username: institution")
    print("     Password: institution123")
    print("\n  👨‍🎓 STUDENTS:")
    print("     Username: beyza2 or beyza.karasahan")
    print("     Password: beyza123")
    print("\n🌐 NEXT STEPS:")
    print("  1. Start the development server:")
    print("     python manage.py runserver")
    print("\n  2. Login with any of the credentials above")
    print("\n  3. Navigate to Analytics to see the graphs!")
    
    print("\n" + "="*70)


def create_learning_outcomes(courses):
    """Create Learning Outcomes for each course"""
    print("🎯 Creating Learning Outcomes...")
    
    learning_outcomes = []
    lo_definitions = {
        'CSE301': [
            {'code': 'LO1', 'title': 'Master Advanced Algorithms', 'description': 'Students will master divide-and-conquer algorithms', 'target': 75.00},
            {'code': 'LO2', 'title': 'Apply Dynamic Programming', 'description': 'Students will apply dynamic programming techniques', 'target': 70.00},
            {'code': 'LO3', 'title': 'Optimize Algorithm Solutions', 'description': 'Students will optimize solutions using greedy algorithms', 'target': 80.00},
        ],
        'CSE302': [
            {'code': 'LO1', 'title': 'Understand Database Design', 'description': 'Students will understand database design principles and normalization', 'target': 75.00},
            {'code': 'LO2', 'title': 'Master SQL Queries', 'description': 'Students will master complex SQL queries and database operations', 'target': 70.00},
            {'code': 'LO3', 'title': 'Apply Database Management', 'description': 'Students will apply database management concepts in real-world scenarios', 'target': 80.00},
        ],
        'CSE303': [
            {'code': 'LO1', 'title': 'Understand Software Engineering Principles', 'description': 'Students will understand software development lifecycle and methodologies', 'target': 75.00},
            {'code': 'LO2', 'title': 'Apply Design Patterns', 'description': 'Students will apply design patterns and best practices', 'target': 70.00},
            {'code': 'LO3', 'title': 'Master Project Management', 'description': 'Students will master project management and team collaboration', 'target': 80.00},
        ],
    }
    
    for course in courses:
        if course.code in lo_definitions:
            for lo_def in lo_definitions[course.code]:
                lo = LearningOutcome.objects.create(
                    course=course,
                    code=lo_def['code'],
                    title=lo_def['title'],
                    description=lo_def['description'],
                    target_percentage=Decimal(str(lo_def['target'])),
                    is_active=True
                )
                learning_outcomes.append(lo)
                print(f"  ✓ {course.code} - {lo.code}: {lo.title}")
    
    print(f"✅ Created {len(learning_outcomes)} Learning Outcomes\n")
    return learning_outcomes


def create_student_lo_achievements(students, learning_outcomes):
    """Create StudentLOAchievement records for all students"""
    print("📊 Creating Student LO Achievements...")
    
    achievements = []
    
    for student in students:
        # Get courses this student is enrolled in
        enrollments = Enrollment.objects.filter(student=student)
        enrolled_course_ids = enrollments.values_list('course_id', flat=True)
        
        # Get LOs for enrolled courses
        student_los = [lo for lo in learning_outcomes if lo.course_id in enrolled_course_ids]
        
        for lo in student_los:
            # Generate achievement percentage based on student
            if student.username == 'beyza2':
                base_percentage = random.uniform(85, 95)
            elif student.username == 'beyza.karasahan':
                base_percentage = random.uniform(45, 60)
            else:
                base_percentage = random.uniform(65, 85)
            
            # Get assessments for this LO's course
            course_assessments = Assessment.objects.filter(course=lo.course)
            total_assessments = course_assessments.count()
            completed = random.randint(int(total_assessments * 0.7), total_assessments)
            
            achievement = StudentLOAchievement.objects.create(
                student=student,
                learning_outcome=lo,
                current_percentage=Decimal(str(round(base_percentage, 2))),
                total_assessments=total_assessments,
                completed_assessments=completed
            )
            achievements.append(achievement)
    
    print(f"✅ Created {len(achievements)} Student LO Achievements")
    print(f"  Students: {len(students)}")
    print(f"  Learning Outcomes per student: ~{len(achievements) // len(students) if students else 0}\n")
    
    return achievements


def main():
    """Main function to create all test data"""
    print("\n" + "="*70)
    print("🚀 ACURATE TEST DATA GENERATOR (Course Analytics Edition)")
    print("="*70 + "\n")
    
    try:
        # Clear existing data
        clear_existing_data()
        
        # Create data in order
        pos = create_program_outcomes()
        teacher = create_teacher()
        institution = create_institution()
        students = create_students()
        courses = create_courses(teacher)
        create_course_po_mappings(courses, pos)
        learning_outcomes = create_learning_outcomes(courses)
        enrollments = create_enrollments(students, courses)
        assessments = create_assessments(courses, pos)
        grades = create_student_grades(students, assessments)
        calculate_final_grades(students, courses)
        po_achievements = create_student_po_achievements(students, pos)
        lo_achievements = create_student_lo_achievements(students, learning_outcomes)
        
        # Print summary
        print_summary(pos, teacher, students, courses, enrollments, assessments, grades, po_achievements, learning_outcomes, lo_achievements)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
