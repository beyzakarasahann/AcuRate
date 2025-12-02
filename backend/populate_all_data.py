#!/usr/bin/env python
"""
AcuRate - Populate Data for All Existing Users

This script populates comprehensive data for:
- All existing teachers (courses, assessments)
- All existing students (enrollments, grades, PO achievements)
- Including test.student

Usage:
    python populate_all_data.py
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


def get_or_create_program_outcomes():
    """Get or create Program Outcomes"""
    print("📚 Setting up Program Outcomes...")
    
    pos_data = [
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
    
    pos = []
    for po_data in pos_data:
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
            print(f"  ✓ Created {po.code}: {po.title}")
        else:
            print(f"  → Using existing {po.code}: {po.title}")
        pos.append(po)
    
    print(f"✅ {len(pos)} Program Outcomes ready\n")
    return pos


def create_courses_for_teacher(teacher, pos):
    """Create courses for a teacher"""
    print(f"📖 Creating Courses for {teacher.get_full_name()} ({teacher.username})...")
    
    courses_data = [
        {
            'code': 'CSE311',
            'name': 'Software Engineering',
            'description': 'This course covers the fundamental principles and concepts of software development, including software development (SD) processes, agile practices & scrum, test driven development, unit testing, integration testing, version control systems, continuous integration and continuous deployment.',
            'credits': 3,
            'semester': Course.Semester.FALL,
            'academic_year': '2024-2025'
        },
        {
            'code': 'CSE321',
            'name': 'Database Systems',
            'description': 'Introduction to database design, SQL, normalization, and database management systems.',
            'credits': 3,
            'semester': Course.Semester.FALL,
            'academic_year': '2024-2025'
        },
        {
            'code': 'CSE301',
            'name': 'Data Structures and Algorithms',
            'description': 'Study of fundamental data structures (arrays, linked lists, trees, graphs) and algorithms.',
            'credits': 4,
            'semester': Course.Semester.SPRING,
            'academic_year': '2024-2025'
        }
    ]
    
    courses = []
    for course_data in courses_data:
        course, created = Course.objects.get_or_create(
            code=course_data['code'],
            academic_year=course_data['academic_year'],
            defaults={
                'name': course_data['name'],
                'description': course_data['description'],
                'department': teacher.department or 'Computer Science',
                'credits': course_data['credits'],
                'semester': course_data['semester'],
                'teacher': teacher
            }
        )
        if created:
            print(f"  ✓ Created {course.code}: {course.name}")
        else:
            # Update teacher if needed
            if course.teacher != teacher:
                course.teacher = teacher
                course.save()
            print(f"  → Using existing {course.code}: {course.name}")
        courses.append(course)
    
    # Create Course-PO mappings
    print(f"  🔗 Creating Course-PO Mappings...")
    CoursePO.objects.filter(course__in=courses).delete()
    
    mappings = [
        # CSE311 → PO1, PO2, PO3
        (courses[0], pos[0], Decimal('1.5')),  # CSE311 → PO1
        (courses[0], pos[1], Decimal('1.5')),  # CSE311 → PO2
        (courses[0], pos[2], Decimal('1.0')),  # CSE311 → PO3
        
        # CSE321 → PO1, PO3, PO5
        (courses[1], pos[0], Decimal('1.0')),  # CSE321 → PO1
        (courses[1], pos[2], Decimal('1.5')),  # CSE321 → PO3
        (courses[1], pos[4], Decimal('1.2')),  # CSE321 → PO5
        
        # CSE301 → PO1, PO2, PO5
        (courses[2], pos[0], Decimal('1.5')),  # CSE301 → PO1
        (courses[2], pos[1], Decimal('1.5')),  # CSE301 → PO2
        (courses[2], pos[4], Decimal('1.0')),  # CSE301 → PO5
    ]
    
    for course, po, weight in mappings:
        CoursePO.objects.get_or_create(
            course=course,
            program_outcome=po,
            defaults={'weight': weight}
        )
        print(f"    ✓ {course.code} → {po.code} (weight: {weight})")
    
    print(f"✅ {len(courses)} Courses ready\n")
    return courses


def create_assessments_for_courses(courses, pos):
    """Create assessments for courses"""
    print("📝 Creating Assessments...")
    
    assessments = []
    for course in courses:
        # Clear existing assessments
        Assessment.objects.filter(course=course).delete()
        
        # Create assessments based on course
        if course.code == 'CSE311':
            assessment_data = [
                {'title': 'Midterm I', 'type': 'MIDTERM', 'weight': Decimal('25.00'), 'pos': [pos[0], pos[1]]},
                {'title': 'Midterm II', 'type': 'MIDTERM', 'weight': Decimal('25.00'), 'pos': [pos[1], pos[2]]},
                {'title': 'Attendance & Participation', 'type': 'OTHER', 'weight': Decimal('10.00'), 'pos': [pos[0]]},
                {'title': 'Project (Presentations, Demo)', 'type': 'PROJECT', 'weight': Decimal('40.00'), 'pos': [pos[2], pos[3]]},
            ]
        else:
            assessment_data = [
                {'title': 'Midterm Exam', 'type': 'MIDTERM', 'weight': Decimal('30.00'), 'pos': [pos[0], pos[1]]},
                {'title': 'Final Exam', 'type': 'FINAL', 'weight': Decimal('40.00'), 'pos': [pos[0], pos[1], pos[2]]},
                {'title': 'Project', 'type': 'PROJECT', 'weight': Decimal('20.00'), 'pos': [pos[2], pos[3]]},
                {'title': 'Quiz', 'type': 'QUIZ', 'weight': Decimal('10.00'), 'pos': [pos[0]]},
            ]
        
        for ass_data in assessment_data:
            assessment = Assessment.objects.create(
                course=course,
                title=ass_data['title'],
                description=f"{ass_data['title']} for {course.code}",
                assessment_type=ass_data['type'],
                weight=ass_data['weight'],
                max_score=Decimal('100.00'),
                due_date=timezone.now() + timedelta(days=random.randint(30, 90)),
                is_active=True
            )
            assessment.related_pos.set(ass_data['pos'])
            assessments.append(assessment)
            print(f"  ✓ {course.code}: {assessment.title} ({assessment.weight}%)")
    
    print(f"✅ Created {len(assessments)} Assessments\n")
    return assessments


def create_enrollments_for_students(students, courses):
    """Create enrollments for all students in all courses"""
    print("📋 Creating Enrollments...")
    
    enrollments = []
    for student in students:
        for course in courses:
            enrollment, created = Enrollment.objects.get_or_create(
                student=student,
                course=course,
                defaults={'is_active': True}
            )
            enrollments.append(enrollment)
            if student.username == 'test.student' or created:
                print(f"  ✓ {student.username} enrolled in {course.code}")
    
    print(f"✅ Created/Updated {len(enrollments)} Enrollments\n")
    return enrollments


def create_grades_for_students(students, courses, assessments):
    """Create grades for all students"""
    print("📊 Creating Student Grades...")
    
    # Clear existing grades
    StudentGrade.objects.filter(student__in=students, assessment__course__in=courses).delete()
    
    grades_created = 0
    for student in students:
        # Determine performance level based on username
        if student.username == 'test.student':
            # Good performance for test.student
            base_score = 75
            variance = 15
        else:
            # Random performance for others
            base_score = random.randint(60, 85)
            variance = 10
        
        for course in courses:
            course_assessments = [a for a in assessments if a.course == course]
            for assessment in course_assessments:
                # Generate score with some variance
                score = max(0, min(100, base_score + random.randint(-variance, variance)))
                
                grade = StudentGrade.objects.create(
                    student=student,
                    assessment=assessment,
                    score=Decimal(str(score)),
                    feedback=f"Good work on {assessment.title}",
                    graded_at=timezone.now() - timedelta(days=random.randint(1, 30))
                )
                grades_created += 1
                if student.username == 'test.student' and grades_created <= 5:
                    print(f"  ✓ {student.username} - {course.code} - {assessment.title}: {score}")
    
    print(f"✅ Created {grades_created} Student Grades\n")
    return grades_created


def calculate_final_grades(students, courses):
    """Calculate and set final grades for enrollments"""
    print("📈 Calculating Final Grades...")
    
    for student in students:
        for course in courses:
            try:
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
                    
                    if student.username == 'test.student':
                        print(f"  ✓ {student.username} - {course.code}: {final_grade:.2f}")
            except Enrollment.DoesNotExist:
                pass
    
    print(f"✅ Final Grades Calculated\n")


def create_po_achievements_for_students(students, pos):
    """Create PO achievements for all students"""
    print("🎯 Creating Student PO Achievements...")
    
    # Clear existing achievements
    StudentPOAchievement.objects.filter(student__in=students).delete()
    
    achievements_created = 0
    for student in students:
        # Determine achievement level
        if student.username == 'test.student':
            # Good achievements for test.student
            base_achievement = 80
            variance = 10
        else:
            # Random achievements for others
            base_achievement = random.randint(65, 90)
            variance = 8
        
        for po in pos:
            # Calculate achievement with variance
            current_percentage = max(0, min(100, base_achievement + random.randint(-variance, variance)))
            
            # Count assessments related to this PO
            total_assessments = Assessment.objects.filter(related_pos=po).count()
            completed_assessments = total_assessments  # Assume all completed for test data
            
            achievement = StudentPOAchievement.objects.create(
                student=student,
                program_outcome=po,
                current_percentage=Decimal(str(current_percentage)),
                total_assessments=total_assessments,
                completed_assessments=completed_assessments
            )
            achievements_created += 1
            if student.username == 'test.student':
                is_achieved = current_percentage >= float(po.target_percentage)
                status = "✓" if is_achieved else "○"
                print(f"  {status} {student.username} - {po.code}: {current_percentage:.1f}% (target: {po.target_percentage}%)")
    
    print(f"✅ Created {achievements_created} PO Achievements\n")


def main():
    """Main function"""
    print("=" * 60)
    print("🚀 AcuRate - Populate Data for All Users")
    print("=" * 60)
    print()
    
    # Get or create Program Outcomes
    pos = get_or_create_program_outcomes()
    
    # Get all teachers
    teachers = User.objects.filter(role=User.Role.TEACHER, is_active=True)
    if not teachers.exists():
        print("❌ No active teachers found!")
        print("   Please create a teacher first.")
        return
    
    print(f"✅ Found {teachers.count()} Teacher(s)\n")
    
    # Get all students
    students = User.objects.filter(role=User.Role.STUDENT, is_active=True)
    if not students.exists():
        print("❌ No active students found!")
        print("   Please create students first.")
        return
    
    print(f"✅ Found {students.count()} Student(s)")
    print(f"   Including: {', '.join([s.username for s in students[:5]])}{'...' if students.count() > 5 else ''}\n")
    
    all_courses = []
    all_assessments = []
    
    # Create courses and assessments for each teacher
    for teacher in teachers:
        courses = create_courses_for_teacher(teacher, pos)
        all_courses.extend(courses)
        
        assessments = create_assessments_for_courses(courses, pos)
        all_assessments.extend(assessments)
    
    # Create enrollments for all students
    enrollments = create_enrollments_for_students(students, all_courses)
    
    # Create grades for all students
    create_grades_for_students(students, all_courses, all_assessments)
    
    # Calculate final grades
    calculate_final_grades(students, all_courses)
    
    # Create PO achievements
    create_po_achievements_for_students(students, pos)
    
    # Summary
    print("=" * 60)
    print("✅ DATA POPULATION COMPLETE!")
    print("=" * 60)
    print(f"\n📊 Summary:")
    print(f"   • Program Outcomes: {len(pos)}")
    print(f"   • Teachers: {teachers.count()}")
    print(f"   • Students: {students.count()}")
    print(f"   • Courses: {len(all_courses)}")
    print(f"   • Assessments: {len(all_assessments)}")
    print(f"   • Enrollments: {len(enrollments)}")
    print(f"   • Grades: {StudentGrade.objects.filter(student__in=students).count()}")
    print(f"   • PO Achievements: {StudentPOAchievement.objects.filter(student__in=students).count()}")
    
    print(f"\n🔐 Test Student Credentials:")
    test_student = students.filter(username='test.student').first()
    if test_student:
        print(f"   • Username: {test_student.username}")
        print(f"   • Password: student123")
        print(f"   • Email: {test_student.email}")
        print(f"   • Student ID: {test_student.student_id}")
    
    print("\n🎉 All data populated successfully!")
    print("=" * 60)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

