"""
AcuRate - Bulk Operations Views
Handles CSV/Excel import/export operations
"""

import csv
import io
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from django.db import transaction
from decimal import Decimal, InvalidOperation

from ..models import User, Course, Enrollment, Assessment, StudentGrade
from ..utils import log_activity


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_import_students(request):
    """
    Bulk import students from CSV
    
    POST /api/bulk/import/students/
    Content-Type: multipart/form-data
    Body: file (CSV file)
    
    CSV Format:
    email,first_name,last_name,student_id,department,year_of_study
    student1@example.com,John,Doe,2024001,Computer Science,2
    """
    user = request.user
    
    if user.role != User.Role.INSTITUTION and not user.is_staff:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'PermissionDenied',
                    'message': 'Only institution admins can import students',
                    'code': status.HTTP_403_FORBIDDEN,
                }
            },
            status=status.HTTP_403_FORBIDDEN
        )
    
    if 'file' not in request.FILES:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ValidationError',
                    'message': 'No file provided',
                    'code': status.HTTP_400_BAD_REQUEST,
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    
    try:
        # Read CSV
        decoded_file = file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(decoded_file))
        
        created_count = 0
        updated_count = 0
        errors = []
        
        with transaction.atomic():
            for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 (header is row 1)
                try:
                    email = row.get('email', '').strip()
                    if not email:
                        errors.append(f"Row {row_num}: Email is required")
                        continue
                    
                    # Get or create user
                    student, created = User.objects.get_or_create(
                        email=email,
                        defaults={
                            'username': email,
                            'first_name': row.get('first_name', '').strip(),
                            'last_name': row.get('last_name', '').strip(),
                            'role': User.Role.STUDENT,
                            'student_id': row.get('student_id', '').strip(),
                            'department': row.get('department', '').strip(),
                            'year_of_study': int(row.get('year_of_study', 1)) if row.get('year_of_study') else 1,
                        }
                    )
                    
                    if created:
                        # Generate temporary password and set it
                        from ..serializers import generate_temp_password
                        temp_password = generate_temp_password()
                        student.set_password(temp_password)
                        student.is_temporary_password = True
                        student.created_by = user
                        student.save()
                        created_count += 1
                        
                        # Send email with credentials (optional, can be skipped if email fails)
                        try:
                            from django.core.mail import send_mail
                            from django.conf import settings
                            import ssl
                            import os
                            
                            # Ensure SSL skip is applied if needed
                            if os.environ.get("SENDGRID_SKIP_SSL_VERIFY", "").lower() == "true":
                                ssl._create_default_https_context = ssl._create_unverified_context
                            
                            sendgrid_api_key = getattr(settings, "SENDGRID_API_KEY", "")
                            if sendgrid_api_key and sendgrid_api_key != "your-sendgrid-api-key-here":
                                full_name = (student.get_full_name() or "").strip()
                                greeting = f"Hello {full_name},\n\n" if full_name else "Hello,\n\n"
                                
                                send_mail(
                                    subject="Your AcuRate Student Account",
                                    message=(
                                        greeting
                                        + "Your AcuRate student account has been created.\n\n"
                                        + f"Username: {student.username}\n"
                                        + f"Email: {student.email}\n"
                                        + f"Student ID: {student.student_id or 'N/A'}\n"
                                        + f"Temporary password: {temp_password}\n\n"
                                        + "Please log in using your EMAIL ADDRESS or USERNAME and this temporary password.\n"
                                        + "After logging in, you will be REQUIRED to change your password immediately.\n"
                                        + "You will not be able to use the system until you update your password.\n"
                                    ),
                                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                                    recipient_list=[student.email],
                                    fail_silently=True,
                                )
                        except Exception:
                            # Email sending failed, but student is created - continue
                            pass
                    else:
                        # Update existing student
                        student.first_name = row.get('first_name', '').strip() or student.first_name
                        student.last_name = row.get('last_name', '').strip() or student.last_name
                        student.department = row.get('department', '').strip() or student.department
                        if row.get('year_of_study'):
                            student.year_of_study = int(row.get('year_of_study'))
                        student.save()
                        updated_count += 1
                        
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
        
        log_activity(
            user=user,
            action_type='CREATE',
            model_name='User',
            description=f'Bulk imported {created_count} students, updated {updated_count}'
        )
        
        return Response(
            {
                'success': True,
                'created': created_count,
                'updated': updated_count,
                'errors': errors if errors else None,
                'message': f'Successfully imported {created_count} students, updated {updated_count}'
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ServerError',
                    'message': f'Failed to import students: {str(e)}',
                    'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bulk_export_grades(request):
    """
    Export grades to CSV
    
    GET /api/bulk/export/grades/?course_id=1&assessment_id=2
    """
    user = request.user
    
    if user.role != User.Role.TEACHER and user.role != User.Role.INSTITUTION and not user.is_staff:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'PermissionDenied',
                    'message': 'Only teachers and institution admins can export grades',
                    'code': status.HTTP_403_FORBIDDEN,
                }
            },
            status=status.HTTP_403_FORBIDDEN
        )
    
    course_id = request.query_params.get('course_id')
    assessment_id = request.query_params.get('assessment_id')
    
    # Build query
    grades_query = StudentGrade.objects.select_related('student', 'assessment', 'assessment__course')
    
    if course_id:
        grades_query = grades_query.filter(assessment__course_id=course_id)
    if assessment_id:
        grades_query = grades_query.filter(assessment_id=assessment_id)
    if user.role == User.Role.TEACHER:
        grades_query = grades_query.filter(assessment__course__teacher=user)
    
    grades = grades_query.all()
    
    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="grades_export.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Student ID', 'Student Name', 'Course Code', 'Course Name', 'Assessment', 'Score', 'Max Score', 'Percentage', 'Feedback'])
    
    for grade in grades:
        writer.writerow([
            grade.student.student_id or '',
            f"{grade.student.first_name} {grade.student.last_name}",
            grade.assessment.course.code,
            grade.assessment.course.name,
            grade.assessment.title,
            float(grade.score),
            float(grade.assessment.max_score),
            f"{grade.percentage:.2f}%",
            grade.feedback or '',
        ])
    
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_import_grades(request):
    """
    Bulk import grades from CSV
    
    POST /api/bulk/import/grades/
    Content-Type: multipart/form-data
    Body: file (CSV file)
    
    CSV Format:
    student_id,assessment_id,score,feedback
    2024001,1,85.5,Good work
    """
    user = request.user
    
    if user.role != User.Role.TEACHER and not user.is_staff:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'PermissionDenied',
                    'message': 'Only teachers can import grades',
                    'code': status.HTTP_403_FORBIDDEN,
                }
            },
            status=status.HTTP_403_FORBIDDEN
        )
    
    if 'file' not in request.FILES:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ValidationError',
                    'message': 'No file provided',
                    'code': status.HTTP_400_BAD_REQUEST,
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    
    try:
        # Read CSV
        decoded_file = file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(decoded_file))
        
        created_count = 0
        updated_count = 0
        errors = []
        
        with transaction.atomic():
            for row_num, row in enumerate(csv_reader, start=2):
                try:
                    student_id = row.get('student_id', '').strip()
                    assessment_id = row.get('assessment_id', '').strip()
                    score = row.get('score', '').strip()
                    
                    if not all([student_id, assessment_id, score]):
                        errors.append(f"Row {row_num}: student_id, assessment_id, and score are required")
                        continue
                    
                    # Get student and assessment
                    try:
                        student = User.objects.get(student_id=student_id, role=User.Role.STUDENT)
                    except User.DoesNotExist:
                        errors.append(f"Row {row_num}: Student with ID {student_id} not found")
                        continue
                    
                    try:
                        assessment = Assessment.objects.get(id=int(assessment_id))
                    except (Assessment.DoesNotExist, ValueError):
                        errors.append(f"Row {row_num}: Assessment with ID {assessment_id} not found")
                        continue
                    
                    # Check if teacher has access to this assessment
                    if user.role == User.Role.TEACHER and assessment.course.teacher != user:
                        errors.append(f"Row {row_num}: You don't have permission to grade this assessment")
                        continue
                    
                    # Parse score
                    try:
                        score_decimal = Decimal(score)
                    except (InvalidOperation, ValueError):
                        errors.append(f"Row {row_num}: Invalid score format: {score}")
                        continue
                    
                    # Validate score
                    if score_decimal < 0 or score_decimal > assessment.max_score:
                        errors.append(f"Row {row_num}: Score must be between 0 and {assessment.max_score}")
                        continue
                    
                    # Get or create grade
                    grade, created = StudentGrade.objects.get_or_create(
                        student=student,
                        assessment=assessment,
                        defaults={
                            'score': score_decimal,
                            'feedback': row.get('feedback', '').strip(),
                        }
                    )
                    
                    if not created:
                        grade.score = score_decimal
                        grade.feedback = row.get('feedback', '').strip() or grade.feedback
                        grade.save()
                        updated_count += 1
                    else:
                        created_count += 1
                        
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
        
        log_activity(
            user=user,
            action_type='CREATE',
            model_name='StudentGrade',
            description=f'Bulk imported {created_count} grades, updated {updated_count}'
        )
        
        return Response(
            {
                'success': True,
                'created': created_count,
                'updated': updated_count,
                'errors': errors if errors else None,
                'message': f'Successfully imported {created_count} grades, updated {updated_count}'
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ServerError',
                    'message': f'Failed to import grades: {str(e)}',
                    'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

