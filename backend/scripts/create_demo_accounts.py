#!/usr/bin/env python
"""
AcuRate - Create Demo Accounts for Login Auto-fill

This script creates 3 demo accounts for testing:
- demo_student (Student role)
- demo_teacher (Teacher role)
- demo_institution (Institution role)

Usage:
    python create_demo_accounts.py
"""

import os
import sys
import django
from django.contrib.auth.hashers import make_password

# Setup Django environment - Add backend directory to Python path
# Script is in backend/scripts/, so we need to go up one level to backend/
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)  # Go up one level to backend/
sys.path.insert(0, backend_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User


def create_demo_accounts():
    """Create demo accounts for auto-fill"""
    print("=" * 60)
    print("🚀 AcuRate - Creating Demo Accounts")
    print("=" * 60)
    print()

    accounts = [
        {
            'username': 'beyza590beyza@gmail.com',
            'email': 'beyza590beyza@gmail.com',
            'password': 'demo12345',
            'role': User.Role.STUDENT,
            'first_name': 'Demo',
            'last_name': 'Student',
            'student_id': 'DEMO002',  # Changed to avoid conflict
            'department': 'Computer Science',
            'year_of_study': 3,
        },
        {
            'username': 'demo_teacher',
            'email': 'demo.teacher@acurate.edu',
            'password': 'demo12345',
            'role': User.Role.TEACHER,
            'first_name': 'Demo',
            'last_name': 'Teacher',
            'department': 'Computer Science',
        },
        {
            'username': 'demo_institution',
            'email': 'demo.institution@acurate.edu',
            'password': 'demo12345',
            'role': User.Role.INSTITUTION,
            'first_name': 'Demo',
            'last_name': 'Institution',
            'department': 'Administration',
        },
    ]

    created_count = 0
    updated_count = 0

    for account_data in accounts:
        username = account_data['username']
        password = account_data.pop('password')
        role = account_data['role']
        
        # Try to get existing user by username or email
        # Also check for old demo_student username
        user = None
        created = False
        
        try:
            user = User.objects.get(username=username)
            created = False
        except User.DoesNotExist:
            try:
                # Check if email exists
                user = User.objects.get(email=account_data['email'])
                created = False
            except User.DoesNotExist:
                # Check for old demo_student username if this is student account
                if role == User.Role.STUDENT:
                    try:
                        user = User.objects.get(username='demo_student')
                        created = False
                    except User.DoesNotExist:
                        created = True
                else:
                    created = True
        
        if created:
            # Create new user (username is already in account_data)
            user = User.objects.create(
                **account_data,
                password=make_password(password),
                is_active=True,
            )
            print(f"✅ Created: {username} ({role})")
            print(f"   Email: {account_data['email']}")
            print(f"   Password: {password}")
            created_count += 1
        else:
            # Update existing user
            user.username = username
            user.email = account_data['email']
            user.password = make_password(password)
            user.role = role
            user.is_active = True
            
            # Update role-specific fields
            if role == User.Role.STUDENT:
                # Only update student_id if it's not already taken by another user
                new_student_id = account_data.get('student_id')
                if new_student_id:
                    existing_with_id = User.objects.filter(student_id=new_student_id).exclude(id=user.id).first()
                    if not existing_with_id:
                        user.student_id = new_student_id
                user.year_of_study = account_data.get('year_of_study', user.year_of_study)
            if 'first_name' in account_data:
                user.first_name = account_data['first_name']
            if 'last_name' in account_data:
                user.last_name = account_data['last_name']
            if 'department' in account_data:
                user.department = account_data['department']
            
            user.save()
            print(f"🔄 Updated: {username} ({role})")
            print(f"   Email: {account_data['email']}")
            print(f"   Password: {password}")
            updated_count += 1
        print()

    print("=" * 60)
    print("✅ DEMO ACCOUNTS READY!")
    print("=" * 60)
    print(f"\n📊 Summary:")
    print(f"   • Created: {created_count}")
    print(f"   • Updated: {updated_count}")
    print(f"   • Total: {len(accounts)}")
    print(f"\n🔐 Demo Account Credentials:")
    print(f"   • Student: beyza590beyza@gmail.com / demo12345")
    print(f"   • Teacher: demo_teacher / demo12345")
    print(f"   • Institution: demo_institution / demo12345")
    print("\n🎉 All demo accounts are ready for auto-fill!")
    print("=" * 60)


if __name__ == '__main__':
    try:
        create_demo_accounts()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

