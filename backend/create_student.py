#!/usr/bin/env python
"""
AcuRate - Create Student Account

This script creates a student account for an existing admin's teacher.

Usage:
    python create_student.py
"""

import os
import sys
import django
from django.utils import timezone

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User


def create_student():
    """Create a student account for an admin's teacher"""
    print("👨‍🎓 Creating Student Account...")
    print("=" * 60)
    
    # Find an institution admin
    institution = User.objects.filter(role=User.Role.INSTITUTION, is_active=True).first()
    
    if not institution:
        print("❌ No institution admin found!")
        print("   Please create an institution admin first.")
        return None
    
    print(f"✅ Found Institution Admin: {institution.username} ({institution.get_full_name()})")
    
    # Find a teacher (preferably one created by this institution)
    teacher = User.objects.filter(
        role=User.Role.TEACHER,
        is_active=True
    ).first()
    
    if not teacher:
        print("❌ No teacher found!")
        print("   Please create a teacher first.")
        return None
    
    print(f"✅ Found Teacher: {teacher.username} ({teacher.get_full_name()})")
    print(f"   Department: {teacher.department or 'N/A'}")
    
    # Create student account
    student_username = 'test.student'
    student_email = 'test.student@student.acurate.edu'
    student_password = 'student123'
    
    # Check if student already exists
    existing_student = User.objects.filter(username=student_username).first()
    if existing_student:
        print(f"\n⚠️  Student '{student_username}' already exists!")
        print(f"   Updating password...")
        existing_student.set_password(student_password)
        existing_student.is_active = True
        existing_student.is_temporary_password = False
        existing_student.save()
        student = existing_student
    else:
        # Create new student
        student = User.objects.create(
            username=student_username,
            email=student_email,
            first_name='Test',
            last_name='Student',
            role=User.Role.STUDENT,
            student_id='2024999',
            department=teacher.department or 'Computer Science',
            year_of_study=2,
            is_active=True,
            is_temporary_password=False
        )
        student.set_password(student_password)
        student.save()
        print(f"\n✅ Created new student account!")
    
    print("\n" + "=" * 60)
    print("📋 STUDENT LOGIN CREDENTIALS")
    print("=" * 60)
    print(f"Username: {student.username}")
    print(f"Password: {student_password}")
    print(f"Email: {student.email}")
    print(f"Student ID: {student.student_id}")
    print(f"Department: {student.department}")
    print(f"Year of Study: {student.year_of_study}")
    print("=" * 60)
    print(f"\n✅ Student account ready!")
    print(f"   Login URL: http://localhost:3000/login")
    
    return student


if __name__ == '__main__':
    try:
        student = create_student()
        if student:
            print("\n🎉 Success! Student account created/updated.")
        else:
            print("\n❌ Failed to create student account.")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

