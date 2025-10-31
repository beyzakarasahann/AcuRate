#!/usr/bin/env python
"""
AcuRate - Test Data Generator

This script creates comprehensive test data for the AcuRate system including:
- Program Outcomes (5 POs)
- Teachers (2 users)
- Students (5 users)
- Courses (3 courses)
- Course-PO mappings
- Enrollments
- Assessments
- Student grades
- Student PO achievements

Usage:
    python create_test_data.py
"""

import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import (
    User, ProgramOutcome, Course, CoursePO,
    Enrollment, Assessment, StudentGrade, StudentPOAchievement
)


def clear_existing_data():
    """Clear all existing test data"""
    print("🗑️  Clearing existing data...")
    StudentPOAchievement.objects.all().delete()
    StudentGrade.objects.all().delete()
    Assessment.objects.all().delete()
    Enrollment.objects.all().delete()
    CoursePO.objects.all().delete()
    Course.objects.all().delete()
    ProgramOutcome.objects.all().delete()
    User.objects.filter(is_superuser=False).delete()
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
        po = ProgramOutcome.objects.create(
            code=po_data['code'],
            title=po_data['title'],
            description=po_data['description'],
            department='Computer Science',
            target_percentage=po_data['target_percentage'],
            is_active=True
        )
        created_pos.append(po)
        print(f"  ✓ Created {po.code}: {po.title} (Target: {po.target_percentage}%)")
    
    print(f"✅ Created {len(created_pos)} Program Outcomes\n")
    return created_pos


def create_teachers():
    """Create 2 teachers"""
    print("👨‍🏫 Creating Teachers...")
    
    teachers_data = [
        {
            'username': 'teacher1',
            'email': 'sarah.johnson@acurate.edu',
            'first_name': 'Sarah',
            'last_name': 'Johnson',
            'department': 'Computer Science'
        },
        {
            'username': 'teacher2',
            'email': 'michael.chen@acurate.edu',
            'first_name': 'Michael',
            'last_name': 'Chen',
            'department': 'Computer Science'
        }
    ]
    
    teachers = []
    for teacher_data in teachers_data:
        teacher = User.objects.create_user(
            username=teacher_data['username'],
            email=teacher_data['email'],
            password='teacher123',
            role=User.Role.TEACHER,
            first_name=teacher_data['first_name'],
            last_name=teacher_data['last_name'],
            department=teacher_data['department']
        )
        teachers.append(teacher)
        print(f"  ✓ Created {teacher.get_full_name()} ({teacher.username})")
    
    print(f"✅ Created {len(teachers)} Teachers\n")
    return teachers


def create_students():
    """Create 5 students"""
    print("👨‍🎓 Creating Students...")
    
    students_data = [
        {
            'username': 'student1',
            'email': 'alice.smith@student.acurate.edu',
            'first_name': 'Alice',
            'last_name': 'Smith',
            'student_id': '2024001',
            'year_of_study': 2
        },
        {
            'username': 'student2',
            'email': 'bob.wilson@student.acurate.edu',
            'first_name': 'Bob',
            'last_name': 'Wilson',
            'student_id': '2024002',
            'year_of_study': 2
        },
        {
            'username': 'student3',
            'email': 'charlie.brown@student.acurate.edu',
            'first_name': 'Charlie',
            'last_name': 'Brown',
            'student_id': '2024003',
            'year_of_study': 3
        },
        {
            'username': 'student4',
            'email': 'diana.prince@student.acurate.edu',
            'first_name': 'Diana',
            'last_name': 'Prince',
            'student_id': '2024004',
            'year_of_study': 1
        },
        {
            'username': 'student5',
            'email': 'emma.watson@student.acurate.edu',
            'first_name': 'Emma',
            'last_name': 'Watson',
            'student_id': '2024005',
            'year_of_study': 2
        }
    ]
    
    students = []
    for student_data in students_data:
        student = User.objects.create_user(
            username=student_data['username'],
            email=student_data['email'],
            password='student123',
            role=User.Role.STUDENT,
            first_name=student_data['first_name'],
            last_name=student_data['last_name'],
            student_id=student_data['student_id'],
            department='Computer Science',
            year_of_study=student_data['year_of_study']
        )
        students.append(student)
        print(f"  ✓ Created {student.get_full_name()} ({student.student_id}) - Year {student.year_of_study}")
    
    print(f"✅ Created {len(students)} Students\n")
    return students


def create_courses(teachers):
    """Create 3 courses"""
    print("📖 Creating Courses...")
    
    courses_data = [
        {
            'code': 'CS101',
            'name': 'Introduction to Programming',
            'description': 'Fundamental programming concepts using Python. Variables, control structures, functions, and basic data structures.',
            'credits': 3,
            'semester': Course.Semester.FALL,
            'teacher': teachers[0]
        },
        {
            'code': 'CS201',
            'name': 'Data Structures and Algorithms',
            'description': 'Study of fundamental data structures (arrays, linked lists, trees, graphs) and algorithms.',
            'credits': 4,
            'semester': Course.Semester.FALL,
            'teacher': teachers[1]
        },
        {
            'code': 'CS301',
            'name': 'Algorithm Design and Analysis',
            'description': 'Advanced algorithm design techniques: divide-and-conquer, dynamic programming, greedy algorithms.',
            'credits': 4,
            'semester': Course.Semester.SPRING,
            'teacher': teachers[0]
        }
    ]
    
    courses = []
    for course_data in courses_data:
        course = Course.objects.create(
            code=course_data['code'],
            name=course_data['name'],
            description=course_data['description'],
            department='Computer Science',
            credits=course_data['credits'],
            semester=course_data['semester'],
            academic_year='2024-2025',
            teacher=course_data['teacher']
        )
        courses.append(course)
        print(f"  ✓ Created {course.code}: {course.name} ({course.credits} credits)")
    
    print(f"✅ Created {len(courses)} Courses\n")
    return courses


def create_course_po_mappings(courses, pos):
    """Create Course-PO mappings"""
    print("🔗 Creating Course-PO Mappings...")
    
    # CS101 → PO1, PO5
    mappings = [
        (courses[0], pos[0], Decimal('1.5')),  # CS101 → PO1 (weight 1.5)
        (courses[0], pos[4], Decimal('1.0')),  # CS101 → PO5 (weight 1.0)
        
        # CS201 → PO1, PO2, PO5
        (courses[1], pos[0], Decimal('1.0')),  # CS201 → PO1
        (courses[1], pos[1], Decimal('1.5')),  # CS201 → PO2
        (courses[1], pos[4], Decimal('1.2')),  # CS201 → PO5
        
        # CS301 → PO2, PO3, PO4
        (courses[2], pos[1], Decimal('1.5')),  # CS301 → PO2
        (courses[2], pos[2], Decimal('1.3')),  # CS301 → PO3
        (courses[2], pos[3], Decimal('1.0')),  # CS301 → PO4
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
    """Create enrollments (3 students x 3 courses = 9 enrollments)"""
    print("📝 Creating Enrollments...")
    
    enrollments = []
    # Enroll first 3 students in all courses
    for student in students[:3]:
        for course in courses:
            enrollment = Enrollment.objects.create(
                student=student,
                course=course,
                is_active=True
            )
            enrollments.append(enrollment)
            print(f"  ✓ {student.username} enrolled in {course.code}")
    
    print(f"✅ Created {len(enrollments)} Enrollments\n")
    return enrollments


def create_assessments(courses, pos):
    """Create assessments for each course"""
    print("📋 Creating Assessments...")
    
    assessments = []
    
    # CS101 Assessments
    cs101_assessments = [
        {
            'title': 'Midterm Exam',
            'type': Assessment.AssessmentType.MIDTERM,
            'weight': Decimal('30.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[0]],  # PO1
            'due_date': datetime.now() - timedelta(days=30)
        },
        {
            'title': 'Final Exam',
            'type': Assessment.AssessmentType.FINAL,
            'weight': Decimal('40.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[0], pos[4]],  # PO1, PO5
            'due_date': datetime.now() + timedelta(days=30)
        },
        {
            'title': 'Programming Project',
            'type': Assessment.AssessmentType.PROJECT,
            'weight': Decimal('30.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[4]],  # PO5
            'due_date': datetime.now() + timedelta(days=15)
        }
    ]
    
    for assess_data in cs101_assessments:
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
    
    # CS201 Assessments
    cs201_assessments = [
        {
            'title': 'Midterm Exam',
            'type': Assessment.AssessmentType.MIDTERM,
            'weight': Decimal('35.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[1]],  # PO2
            'due_date': datetime.now() - timedelta(days=25)
        },
        {
            'title': 'Final Exam',
            'type': Assessment.AssessmentType.FINAL,
            'weight': Decimal('40.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[1], pos[4]],  # PO2, PO5
            'due_date': datetime.now() + timedelta(days=35)
        },
        {
            'title': 'Algorithm Implementation',
            'type': Assessment.AssessmentType.PROJECT,
            'weight': Decimal('25.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[0], pos[4]],  # PO1, PO5
            'due_date': datetime.now() + timedelta(days=20)
        }
    ]
    
    for assess_data in cs201_assessments:
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
    
    # CS301 Assessments
    cs301_assessments = [
        {
            'title': 'Midterm Exam',
            'type': Assessment.AssessmentType.MIDTERM,
            'weight': Decimal('30.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[1]],  # PO2
            'due_date': datetime.now() + timedelta(days=40)
        },
        {
            'title': 'Final Exam',
            'type': Assessment.AssessmentType.FINAL,
            'weight': Decimal('40.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[2], pos[3]],  # PO3, PO4
            'due_date': datetime.now() + timedelta(days=70)
        },
        {
            'title': 'Research Project',
            'type': Assessment.AssessmentType.PROJECT,
            'weight': Decimal('30.00'),
            'max_score': Decimal('100.00'),
            'pos': [pos[3]],  # PO4
            'due_date': datetime.now() + timedelta(days=60)
        }
    ]
    
    for assess_data in cs301_assessments:
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
    """Create random grades for students"""
    print("💯 Creating Student Grades...")
    
    grades = []
    # Only grade students who are enrolled (first 3 students)
    enrolled_students = students[:3]
    
    for student in enrolled_students:
        # Get assessments for enrolled courses
        for assessment in assessments:
            # Check if student is enrolled in this course
            if Enrollment.objects.filter(student=student, course=assessment.course).exists():
                # Random score between 60-95 (realistic range)
                score = Decimal(str(random.randint(60, 95)))
                
                grade = StudentGrade.objects.create(
                    student=student,
                    assessment=assessment,
                    score=score,
                    feedback=f"Good work! Keep it up."
                )
                grades.append(grade)
                print(f"  ✓ {student.username} - {assessment.course.code} {assessment.title}: {score}/{assessment.max_score}")
    
    print(f"✅ Created {len(grades)} Student Grades\n")
    return grades


def create_student_po_achievements(students, pos):
    """Create PO achievements for students"""
    print("🎯 Creating Student PO Achievements...")
    
    achievements = []
    enrolled_students = students[:3]
    
    for student in enrolled_students:
        for po in pos:
            # Random achievement between 60-90
            current_percentage = Decimal(str(random.randint(60, 90) + random.random()))
            
            # Count assessments related to this PO
            enrollments = Enrollment.objects.filter(student=student)
            total_assessments = 0
            for enrollment in enrollments:
                total_assessments += Assessment.objects.filter(
                    course=enrollment.course,
                    related_pos=po
                ).count()
            
            # Completed assessments (80-100% of total)
            completed = int(total_assessments * random.uniform(0.8, 1.0))
            
            achievement = StudentPOAchievement.objects.create(
                student=student,
                program_outcome=po,
                current_percentage=current_percentage,
                total_assessments=total_assessments,
                completed_assessments=completed
            )
            achievements.append(achievement)
            
            status = "✓" if achievement.is_target_met else "✗"
            print(f"  {status} {student.username} - {po.code}: {current_percentage:.1f}% ({completed}/{total_assessments})")
    
    print(f"✅ Created {len(achievements)} PO Achievements\n")
    return achievements


def print_summary(pos, teachers, students, courses, enrollments, assessments, grades, achievements):
    """Print summary of created data"""
    print("\n" + "="*70)
    print("🎉 TEST DATA CREATION COMPLETED!")
    print("="*70)
    
    print("\n📊 SUMMARY:")
    print(f"  • Program Outcomes: {len(pos)}")
    print(f"  • Teachers: {len(teachers)}")
    print(f"  • Students: {len(students)}")
    print(f"  • Courses: {len(courses)}")
    print(f"  • Course-PO Mappings: {CoursePO.objects.count()}")
    print(f"  • Enrollments: {len(enrollments)}")
    print(f"  • Assessments: {len(assessments)}")
    print(f"  • Student Grades: {len(grades)}")
    print(f"  • PO Achievements: {len(achievements)}")
    
    print("\n🔐 DEMO CREDENTIALS:")
    print("\n  👨‍🏫 Teachers:")
    for teacher in teachers:
        print(f"    • Username: {teacher.username}")
        print(f"      Password: teacher123")
        print(f"      Name: {teacher.get_full_name()}\n")
    
    print("  👨‍🎓 Students:")
    for student in students:
        print(f"    • Username: {student.username}")
        print(f"      Password: student123")
        print(f"      Name: {student.get_full_name()} ({student.student_id})\n")
    
    print("  🏛️  Institution Admin:")
    print("    • Create superuser with: python manage.py createsuperuser")
    print("    • Suggested username: admin")
    print("    • Suggested password: admin123")
    
    print("\n🌐 NEXT STEPS:")
    print("  1. Run migrations if not done:")
    print("     python manage.py migrate")
    print("\n  2. Start the development server:")
    print("     python manage.py runserver")
    print("\n  3. Access the admin panel:")
    print("     http://127.0.0.1:8000/admin/")
    print("\n  4. Explore the data and test the system!")
    
    print("\n" + "="*70)


def main():
    """Main function to create all test data"""
    print("\n" + "="*70)
    print("🚀 ACURATE TEST DATA GENERATOR")
    print("="*70 + "\n")
    
    try:
        # Clear existing data
        clear_existing_data()
        
        # Create data in order
        pos = create_program_outcomes()
        teachers = create_teachers()
        students = create_students()
        courses = create_courses(teachers)
        create_course_po_mappings(courses, pos)
        enrollments = create_enrollments(students, courses)
        assessments = create_assessments(courses, pos)
        grades = create_student_grades(students, assessments)
        achievements = create_student_po_achievements(students, pos)
        
        # Print summary
        print_summary(pos, teachers, students, courses, enrollments, assessments, grades, achievements)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

