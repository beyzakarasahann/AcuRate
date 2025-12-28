# Generated migration for demo accounts to match login page auto-fill

from django.db import migrations
from django.contrib.auth.hashers import make_password
from decimal import Decimal


def create_demo_accounts_for_login(apps, schema_editor):
    """
    Create demo accounts that match the login page auto-fill feature.
    This ensures that when someone installs the project, the auto-fill will work correctly.
    
    Also ensures teacher can see students, courses, and data by creating/updating:
    - Demo accounts (beyza2, ahmet.bulut, institution)
    - Basic course data if missing (so teacher can see courses and students)
    - Enrollment and assessment data if missing (so teacher can see student grades)
    
    Accounts created:
    - beyza2 / beyza123 (Student)
    - ahmet.bulut / ahmet123 (Teacher)  
    - institution / institution123 (Institution Admin)
    """
    User = apps.get_model('api', 'User')
    ProgramOutcome = apps.get_model('api', 'ProgramOutcome')
    Course = apps.get_model('api', 'Course')
    CoursePO = apps.get_model('api', 'CoursePO')
    Enrollment = apps.get_model('api', 'Enrollment')
    Assessment = apps.get_model('api', 'Assessment')
    StudentGrade = apps.get_model('api', 'StudentGrade')
    
    # Demo Student account (matching login page)
    student, student_created = User.objects.get_or_create(
        username='beyza2',
        defaults={
            'email': 'beyza2@student.acurate.edu',
            'first_name': 'Beyza',
            'last_name': 'Student',
            'role': 'STUDENT',
            'student_id': '2021001',
            'department': 'Computer Science',
            'year_of_study': 3,
            'is_active': True,
            'is_temporary_password': False,
            'password': make_password('beyza123')
        }
    )
    if not student_created:
        # Update existing user to match login page credentials
        student.password = make_password('beyza123')
        student.email = 'beyza2@student.acurate.edu'
        student.is_active = True
        student.is_temporary_password = False
        student.save()
    
    # Demo Teacher account (matching login page)
    teacher, teacher_created = User.objects.get_or_create(
        username='ahmet.bulut',
        defaults={
            'email': 'ahmet.bulut@acurate.edu',
            'first_name': 'Ahmet',
            'last_name': 'Bulut',
            'role': 'TEACHER',
            'department': 'Computer Science',
            'is_active': True,
            'is_temporary_password': False,
            'password': make_password('ahmet123')
        }
    )
    if not teacher_created:
        # Update existing user to match login page credentials
        teacher.password = make_password('ahmet123')
        teacher.email = 'ahmet.bulut@acurate.edu'
        teacher.role = 'TEACHER'
        teacher.is_active = True
        teacher.is_temporary_password = False
        teacher.save()
    
    # Demo Institution Admin account (matching login page)
    institution, _ = User.objects.get_or_create(
        username='institution',
        defaults={
            'email': 'institution@acurate.edu',
            'first_name': 'Institution',
            'last_name': 'Admin',
            'role': 'INSTITUTION',
            'department': 'Administration',
            'is_active': True,
            'is_temporary_password': False,
            'password': make_password('institution123')
        }
    )
    if not _:
        # Update existing user to match login page credentials
        institution.password = make_password('institution123')
        institution.email = 'institution@acurate.edu'
        institution.is_active = True
        institution.is_temporary_password = False
        institution.save()
    
    # Ensure teacher can see students and courses by creating basic course data
    # This is important for teacher dashboard to work properly
    academic_year = '2024-2025'
    
    # Get or create Program Outcomes (needed for courses)
    po1, _ = ProgramOutcome.objects.get_or_create(
        code='PO1',
        defaults={
            'title': 'Engineering Knowledge',
            'description': 'Apply knowledge of mathematics, science, engineering fundamentals.',
            'department': 'Computer Science',
            'target_percentage': Decimal('70.00'),
            'is_active': True
        }
    )
    
    po2, _ = ProgramOutcome.objects.get_or_create(
        code='PO2',
        defaults={
            'title': 'Problem Analysis',
            'description': 'Identify, formulate, and analyze complex engineering problems.',
            'department': 'Computer Science',
            'target_percentage': Decimal('70.00'),
            'is_active': True
        }
    )
    
    # Create or update at least one course for teacher (so teacher dashboard isn't empty)
    course1, _ = Course.objects.get_or_create(
        code='CS301',
        academic_year=academic_year,
        defaults={
            'name': 'Data Structures and Algorithms',
            'description': 'Advanced data structures and algorithm analysis',
            'department': 'Computer Science',
            'credits': 4,
            'semester': 1,
            'academic_year': academic_year,
            'teacher': teacher
        }
    )
    # Ensure course is assigned to teacher
    if course1.teacher != teacher:
        course1.teacher = teacher
        course1.save()
    
    # Create course-PO mapping
    CoursePO.objects.get_or_create(
        course=course1,
        program_outcome=po1,
        defaults={'weight': Decimal('1.50')}
    )
    CoursePO.objects.get_or_create(
        course=course1,
        program_outcome=po2,
        defaults={'weight': Decimal('2.00')}
    )
    
    # Create enrollment for student (so teacher can see the student in the course)
    enrollment, _ = Enrollment.objects.get_or_create(
        student=student,
        course=course1,
        defaults={
            'is_active': True,
            'final_grade': Decimal('85.50')
        }
    )
    
    # Create at least one assessment (so teacher can see assessment management)
    # Note: We don't set related_los here - teacher can add Learning Outcomes later
    assessment, _ = Assessment.objects.get_or_create(
        course=course1,
        title='Midterm Exam',
        defaults={
            'description': 'Midterm examination',
            'assessment_type': 'MIDTERM',
            'weight': Decimal('30.00'),
            'max_score': Decimal('100.00'),
            'is_active': True
        }
    )
    
    # Create a grade for the student (so teacher can see student grades)
    StudentGrade.objects.get_or_create(
        student=student,
        assessment=assessment,
        defaults={
            'score': Decimal('85.00'),
            'feedback': 'Good performance.'
        }
    )
    
    print("✅ Demo accounts created/updated for login auto-fill:")
    print("   • beyza2 / beyza123 (Student)")
    print("   • ahmet.bulut / ahmet123 (Teacher)")
    print("   • institution / institution123 (Institution Admin)")
    print("✅ Basic course data created/updated so teacher can see students and courses")


def reverse_demo_accounts(apps, schema_editor):
    """
    Reverse migration - do not delete accounts, just leave them as is.
    This is a safe reverse operation.
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0015_passwordhistory_passwordresettoken_and_more'),
    ]

    operations = [
        migrations.RunPython(create_demo_accounts_for_login, reverse_demo_accounts),
    ]
