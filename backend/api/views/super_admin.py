"""SUPER ADMIN Views Module

All critical admin operations use transactions to ensure data consistency.
"""

import os
import logging
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q, Avg, Count, F, Min, Max, StdDev
from django.db import transaction
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

from ..models import (
    User, Department, ProgramOutcome, Course,
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    ContactRequest, LearningOutcome, StudentLOAchievement, ActivityLog,
    AssessmentLO, LOPO
)
from ..utils import log_activity, get_institution_for_user
from ..serializers import (
    UserSerializer, UserDetailSerializer, UserCreateSerializer, LoginSerializer,
    TeacherCreateSerializer, InstitutionCreateSerializer,
    DepartmentSerializer,
    ProgramOutcomeSerializer, ProgramOutcomeStatsSerializer,
    LearningOutcomeSerializer,
    CourseSerializer, CourseDetailSerializer,
    EnrollmentSerializer, AssessmentSerializer,
    StudentGradeSerializer, StudentGradeDetailSerializer,
    StudentPOAchievementSerializer, StudentPOAchievementDetailSerializer,
    StudentLOAchievementSerializer,
    StudentDashboardSerializer, TeacherDashboardSerializer, InstitutionDashboardSerializer,
    ContactRequestSerializer, ContactRequestCreateSerializer,
    AssessmentLOSerializer, LOPOSerializer,
    generate_temp_password,
)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def super_admin_dashboard(request):
    """
    Super Admin dashboard with system-wide statistics
    
    GET /api/dashboard/super-admin/
    """
    user = request.user
    
    if not user.is_superuser:
        return Response({
            'error': 'This endpoint is only for super administrators'
        }, status=status.HTTP_403_FORBIDDEN)
    
    from datetime import timedelta
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)
    last_30d = now - timedelta(days=30)
    
    # 1. Toplam Kurum Sayısı (EXCLUDE super admin accounts - they are separate)
    # Super admin = program owner, Institution admin = customer
    total_institutions = User.objects.filter(
        role=User.Role.INSTITUTION,
        is_active=True,
        is_superuser=False  # Only count customer institution admins, not super admin accounts
    ).count()
    
    # 2. Toplam Teacher sayısı
    total_teachers = User.objects.filter(
        role=User.Role.TEACHER,
        is_active=True
    ).count()
    
    # 3. Toplam Student sayısı
    total_students = User.objects.filter(
        role=User.Role.STUDENT,
        is_active=True
    ).count()
    
    # 4. Kurum adminlerinin giriş sayıları (EXCLUDE super admin accounts)
    institution_users = User.objects.filter(
        role=User.Role.INSTITUTION, 
        is_active=True,
        is_superuser=False  # Only count customer institution admins, not super admin accounts
    )
    logins_24h = institution_users.filter(last_login__gte=last_24h).count()
    logins_7d = institution_users.filter(last_login__gte=last_7d).count()
    logins_30d = institution_users.filter(last_login__gte=last_30d).count()
    
    # 5. Bugün yapılan toplam işlem/log sayısı
    # Count all created/updated records today
    today_activities = (
        StudentGrade.objects.filter(created_at__gte=today_start).count() +
        Assessment.objects.filter(created_at__gte=today_start).count() +
        Enrollment.objects.filter(created_at__gte=today_start).count() +
        Course.objects.filter(created_at__gte=today_start).count() +
        StudentGrade.objects.filter(updated_at__gte=today_start, created_at__lt=today_start).count() +
        Assessment.objects.filter(updated_at__gte=today_start, created_at__lt=today_start).count() +
        Enrollment.objects.filter(updated_at__gte=today_start, created_at__lt=today_start).count()
    )
    
    # 6. En aktif kurum (bugün) - bugün en çok işlem yapan kurum
    # Get institutions and count their activities today
    institution_activities = {}
    for inst in institution_users:
        # Count activities related to this institution's department
        inst_dept = inst.department or ''
        if inst_dept:
            # Count students, teachers, courses in this department
            dept_activities = (
                StudentGrade.objects.filter(
                    student__department=inst_dept,
                    created_at__gte=today_start
                ).count() +
                Assessment.objects.filter(
                    course__department=inst_dept,
                    created_at__gte=today_start
                ).count() +
                Enrollment.objects.filter(
                    student__department=inst_dept,
                    created_at__gte=today_start
                ).count()
            )
            if dept_activities > 0:
                institution_activities[inst] = dept_activities
    
    most_active_institution = None
    if institution_activities:
        most_active_institution = max(institution_activities.items(), key=lambda x: x[1])[0]
        most_active_institution_name = most_active_institution.get_full_name() or most_active_institution.username
    else:
        most_active_institution_name = None
    
    # 7. En aktif kullanıcı (bugün)
    # Count activities per user today
    user_activities = {}
    
    # Teachers who created assessments or graded students today
    teachers_today = User.objects.filter(
        role=User.Role.TEACHER,
        is_active=True
    )
    for teacher in teachers_today:
        activities = (
            Assessment.objects.filter(course__teacher=teacher, created_at__gte=today_start).count() +
            StudentGrade.objects.filter(assessment__course__teacher=teacher, created_at__gte=today_start).count()
        )
        if activities > 0:
            user_activities[teacher] = activities
    
    # Students who were enrolled or received grades today
    students_today = User.objects.filter(
        role=User.Role.STUDENT,
        is_active=True
    )
    for student in students_today:
        activities = (
            Enrollment.objects.filter(student=student, created_at__gte=today_start).count() +
            StudentGrade.objects.filter(student=student, created_at__gte=today_start).count()
        )
        if activities > 0:
            user_activities[student] = user_activities.get(student, 0) + activities
    
    most_active_user = None
    if user_activities:
        most_active_user = max(user_activities.items(), key=lambda x: x[1])[0]
        most_active_user_name = f"{most_active_user.get_full_name() or most_active_user.username} ({most_active_user.get_role_display()})"
    else:
        most_active_user_name = None
    
    # 8. Son 10 log - Son 10 işlem
    recent_logs = []
    
    # Get recent grades
    recent_grades = StudentGrade.objects.select_related('student', 'assessment').order_by('-created_at')[:5]
    for grade in recent_grades:
        recent_logs.append({
            'type': 'grade',
            'action': 'Graded',
            'description': f"{grade.student.get_full_name() or grade.student.username} - {grade.assessment.title}",
            'timestamp': grade.created_at,
            'user': grade.student.get_full_name() or grade.student.username
        })
    
    # Get recent assessments
    recent_assessments = Assessment.objects.select_related('course', 'course__teacher').order_by('-created_at')[:3]
    for assessment in recent_assessments:
        teacher_name = assessment.course.teacher.get_full_name() if assessment.course.teacher else 'Unknown'
        recent_logs.append({
            'type': 'assessment',
            'action': 'Created',
            'description': f"{assessment.title} in {assessment.course.code}",
            'timestamp': assessment.created_at,
            'user': teacher_name
        })
    
    # Get recent enrollments
    recent_enrollments = Enrollment.objects.select_related('student', 'course').order_by('-created_at')[:2]
    for enrollment in recent_enrollments:
        recent_logs.append({
            'type': 'enrollment',
            'action': 'Enrolled',
            'description': f"{enrollment.student.get_full_name() or enrollment.student.username} enrolled in {enrollment.course.code}",
            'timestamp': enrollment.created_at,
            'user': enrollment.student.get_full_name() or enrollment.student.username
        })
    
    # Sort by timestamp and take top 10
    recent_logs.sort(key=lambda x: x['timestamp'], reverse=True)
    recent_logs = recent_logs[:10]
    
    # Format timestamps for JSON serialization
    for log in recent_logs:
        log['timestamp'] = log['timestamp'].isoformat() if log['timestamp'] else None
    
    data = {
        'total_institutions': total_institutions,
        'total_teachers': total_teachers,
        'total_students': total_students,
        'institution_logins': {
            'last_24h': logins_24h,
            'last_7d': logins_7d,
            'last_30d': logins_30d
        },
        'today_activities': today_activities,
        'most_active_institution': most_active_institution_name,
        'most_active_user': most_active_user_name,
        'recent_logs': recent_logs
    }
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def super_admin_activity_logs(request):
    """
    Get activity logs for super admin
    
    GET /api/super-admin/activity-logs/
    Query params: ?institution_id=1&action_type=user_created&department=Computer Science&limit=100
    Returns activity logs with filtering options
    """
    user = request.user
    
    # Only superusers can access - refresh user from DB to ensure we have latest is_superuser status
    if not user.is_superuser:
        # Refresh user from database to get latest is_superuser status
        try:
            user.refresh_from_db()
        except:
            pass
        
        if not user.is_superuser:
            return Response({
                'error': 'Only super admins can access activity logs'
            }, status=status.HTTP_403_FORBIDDEN)
    
    # Get filter parameters
    institution_id = request.query_params.get('institution_id', None)
    action_type = request.query_params.get('action_type', None)
    department = request.query_params.get('department', None)
    search = request.query_params.get('search', None)
    limit = int(request.query_params.get('limit', 100))
    
    # Start with all logs
    logs = ActivityLog.objects.select_related('user', 'institution').all()
    
    # Apply filters
    if institution_id:
        try:
            logs = logs.filter(institution_id=int(institution_id))
        except ValueError:
            pass
    
    if action_type:
        logs = logs.filter(action_type=action_type)
    
    if department:
        logs = logs.filter(department=department)
    
    if search:
        logs = logs.filter(description__icontains=search)
    
    # Order by most recent first
    logs = logs.order_by('-created_at')[:limit]
    
    # Serialize logs
    log_data = []
    for log in logs:
        log_data.append({
            'id': log.id,
            'action_type': log.action_type,
            'action_type_display': log.get_action_type_display(),
            'description': log.description,
            'user': {
                'id': log.user.id if log.user else None,
                'username': log.user.username if log.user else None,
                'full_name': log.user.get_full_name() if log.user else None,
                'role': log.user.role if log.user else None,
            } if log.user else None,
            'institution': {
                'id': log.institution.id if log.institution else None,
                'username': log.institution.username if log.institution else None,
                'full_name': log.institution.get_full_name() if log.institution else None,
            } if log.institution else None,
            'department': log.department,
            'related_object_type': log.related_object_type,
            'related_object_id': log.related_object_id,
            'metadata': log.metadata,
            'created_at': log.created_at.isoformat(),
            'time_ago': _get_time_ago(log.created_at)
        })
    
    return Response({
        'success': True,
        'logs': log_data,
        'count': len(log_data)
    })


def _get_time_ago(dt):
    """Helper function to get human-readable time ago"""
    from django.utils import timezone
    now = timezone.now()
    diff = now - dt
    
    if diff.days > 0:
        if diff.days == 1:
            return '1 day ago'
        elif diff.days < 7:
            return f'{diff.days} days ago'
        elif diff.days < 30:
            weeks = diff.days // 7
            return f'{weeks} week{"s" if weeks > 1 else ""} ago'
        else:
            months = diff.days // 30
            return f'{months} month{"s" if months > 1 else ""} ago'
    elif diff.seconds < 60:
        return 'Just now'
    elif diff.seconds < 3600:
        minutes = diff.seconds // 60
        return f'{minutes} minute{"s" if minutes > 1 else ""} ago'
    else:
        hours = diff.seconds // 3600
        return f'{hours} hour{"s" if hours > 1 else ""} ago'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_institution(request):
    """
    Create a new institution by super admin
    
    POST /api/super-admin/institutions/create/
    Body: {
        "email": "admin@institution.com",
        "first_name": "John",
        "last_name": "Doe",
        "department": "Computer Science",
        "phone": "+1234567890"
    }
    """
    user = request.user
    
    # Only superusers can create institutions
    if not user.is_superuser:
        return Response({
            'error': 'Only super admins can create institutions'
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = InstitutionCreateSerializer(data=request.data)
    if serializer.is_valid():
        try:
            with transaction.atomic():
                institution = serializer.save()
            
            # Check email sending status
            email_sent = getattr(institution, '_email_sent', False)
            email_error = getattr(institution, '_email_error', None)
            temp_password = getattr(institution, '_temp_password', None)
            
            # Log institution creation
            log_activity(
                action_type=ActivityLog.ActionType.USER_CREATED,
                user=user,
                institution=None,  # New institution, no parent
                department=institution.department,
                description=f"Institution admin account created: {institution.get_full_name() or institution.username}",
                related_object_type='User',
                related_object_id=institution.id,
                metadata={
                    'role': 'INSTITUTION', 
                    'created_by': user.username,
                    'email_sent': email_sent,
                    'email_error': email_error
                }
            )
            
            # Prepare response message based on email status
            # SECURITY: Never expose temp_password in API response
            if email_sent:
                message = 'Institution created successfully. Credentials have been sent to the email.'
            else:
                if email_error:
                    message = f'Institution created successfully, but email could not be sent: {email_error}. '
                else:
                    message = 'Institution created successfully, but email could not be sent. '
                message += 'Please use the password reset feature to set up credentials, or check server logs (admin only).'
            
            response_data = {
                'success': True,
                'message': message,
                'institution': UserDetailSerializer(institution).data,
                'email_sent': email_sent,
            }
            
            # SECURITY: Log credentials securely for admin access (never in API response)
            if not email_sent and temp_password:
                logger.info(
                    f"[ADMIN] Credentials for institution {institution.username}: "
                    f"Check server logs or use password reset. (temp password NOT exposed in API)"
                )
            
            if email_error:
                response_data['email_error'] = email_error
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'success': False,
                'errors': {'non_field_errors': [f'Failed to create institution: {str(e)}']}
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_institution(request, institution_id):
    """
    Delete an institution by super admin
    
    DELETE /api/super-admin/institutions/{institution_id}/
    """
    user = request.user
    
    # Only superusers can delete institutions
    if not user.is_superuser:
        return Response({
            'error': 'Only super admins can delete institutions'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        institution = User.objects.get(id=institution_id, role=User.Role.INSTITUTION)
        
        # CRITICAL: Never allow deletion of super admin accounts
        if institution.is_superuser:
            return Response({
                'success': False,
                'error': 'Cannot delete super admin accounts. Super admin accounts are protected.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Additional safety check: Ensure we're not deleting the requesting user
        if institution.id == user.id:
            return Response({
                'success': False,
                'error': 'Cannot delete your own account.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        institution_email = institution.email
        institution_username = institution.username
        institution_department = institution.department or ''
        
        # Find and delete all related users
        # 1. Delete all teachers created by this institution or in the same department
        if institution_department:
            teachers = User.objects.filter(
                Q(created_by=institution) | Q(department=institution_department),
                role=User.Role.TEACHER
            )
        else:
            teachers = User.objects.filter(
                created_by=institution,
                role=User.Role.TEACHER
            )
        teacher_count = teachers.count()
        teacher_usernames = list(teachers.values_list('username', flat=True))
        
        # 2. Delete all students in this institution's department
        students = User.objects.none()
        student_count = 0
        student_usernames = []
        if institution_department:
            students = User.objects.filter(
                role=User.Role.STUDENT,
                department=institution_department
            )
            student_count = students.count()
            student_usernames = list(students.values_list('username', flat=True))
        
        # Perform all deletions in a single transaction
        with transaction.atomic():
            # Log deletion of related users before deleting
            for teacher in teachers:
                log_activity(
                    action_type=ActivityLog.ActionType.USER_DELETED,
                    user=user,
                    institution=None,
                    department=teacher.department,
                    description=f"Teacher account deleted (institution deletion): {teacher.get_full_name() or teacher.username}",
                    related_object_type='User',
                    related_object_id=teacher.id,
                    metadata={'role': 'TEACHER', 'deleted_by': user.username, 'institution': institution_username}
                )
            
            for student in students:
                log_activity(
                    action_type=ActivityLog.ActionType.USER_DELETED,
                    user=user,
                    institution=None,
                    department=student.department,
                    description=f"Student account deleted (institution deletion): {student.get_full_name() or student.username}",
                    related_object_type='User',
                    related_object_id=student.id,
                    metadata={'role': 'STUDENT', 'deleted_by': user.username, 'institution': institution_username}
                )
            
            # Delete all related users
            teachers.delete()
            students.delete()
            
            # Log institution deletion
            log_activity(
                action_type=ActivityLog.ActionType.USER_DELETED,
                user=user,
                institution=None,
                department=institution.department,
                description=f"Institution admin account deleted: {institution_username} (along with {teacher_count} teachers and {student_count} students)",
                related_object_type='User',
                related_object_id=institution.id,
                metadata={
                    'role': 'INSTITUTION', 
                    'deleted_by': user.username, 
                    'email': institution_email,
                    'teachers_deleted': teacher_count,
                    'students_deleted': student_count
                }
            )
            
            # Delete the institution
            institution.delete()
        
        return Response({
            'success': True,
            'message': f'Institution {institution_username} ({institution_email}) and all related accounts have been deleted successfully. Deleted: {teacher_count} teachers, {student_count} students.',
            'deleted_counts': {
                'teachers': teacher_count,
                'students': student_count
            }
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Institution not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Failed to delete institution: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def super_admin_institutions(request):
    """
    Super Admin institutions list with statistics
    
    GET /api/super-admin/institutions/
    """
    user = request.user
    
    if not user.is_superuser:
        return Response({
            'error': 'This endpoint is only for super administrators'
        }, status=status.HTTP_403_FORBIDDEN)
    
    from django.db.models import Count, Q
    from datetime import timedelta
    now = timezone.now()
    last_30d = now - timedelta(days=30)
    
    # Get all institutions (EXCLUDE super admin accounts - they are separate)
    # Super admin = program owner, Institution admin = customer
    institutions = User.objects.filter(
        role=User.Role.INSTITUTION,
        is_active=True,
        is_superuser=False  # Only show customer institution admins, not super admin accounts
    ).annotate(
        # Count teachers in this institution (by department)
        teacher_count=Count('created_teachers', distinct=True),
        # Count students (by department - we'll need to match by department name)
        # This is approximate since students have department as string
    ).order_by('-date_joined')
    
    institutions_data = []
    for inst in institutions:
        # Get department name from institution (if available)
        inst_dept = inst.department or ''
        
        # Count teachers created by this institution
        teachers_created_by_inst = User.objects.filter(
            role=User.Role.TEACHER,
            is_active=True,
            created_by=inst
        )
        teacher_count = teachers_created_by_inst.count()
        
        # Count courses taught by teachers created by this institution
        course_count = 0
        if teacher_count > 0:
            teacher_ids = teachers_created_by_inst.values_list('id', flat=True)
            course_count = Course.objects.filter(
                teacher_id__in=teacher_ids
            ).count()
        
        # If no teachers created by institution, try to match by department
        if teacher_count == 0 and inst_dept:
            teachers_in_dept = User.objects.filter(
                role=User.Role.TEACHER,
                is_active=True,
                department=inst_dept
            )
            teacher_count = teachers_in_dept.count()
            if teacher_count > 0:
                teacher_ids = teachers_in_dept.values_list('id', flat=True)
                course_count = Course.objects.filter(
                    teacher_id__in=teacher_ids
                ).count()
        
        # If still no courses, try to count by department
        if course_count == 0 and inst_dept:
            course_count = Course.objects.filter(department=inst_dept).count()
        
        # If institution has no created teachers and department is "Administration" or empty,
        # it likely manages the entire system, so count all active records
        if teacher_count == 0 and (not inst_dept or inst_dept.lower() == 'administration'):
            # Count all active teachers in the system
            teacher_count = User.objects.filter(
                role=User.Role.TEACHER,
                is_active=True
            ).count()
            
            # Count all courses in the system
            course_count = Course.objects.all().count()
        
        # Count students enrolled in courses taught by this institution's teachers
        student_count = 0
        if course_count > 0:
            if teacher_count > 0:
                # Get courses taught by institution's teachers
                if teachers_created_by_inst.exists():
                    teacher_ids = teachers_created_by_inst.values_list('id', flat=True)
                elif inst_dept and inst_dept.lower() != 'administration':
                    teacher_ids = User.objects.filter(
                        role=User.Role.TEACHER,
                        is_active=True,
                        department=inst_dept
                    ).values_list('id', flat=True)
                else:
                    # If institution manages all, get all teacher IDs
                    teacher_ids = User.objects.filter(
                        role=User.Role.TEACHER,
                        is_active=True
                    ).values_list('id', flat=True)
                
                course_ids = Course.objects.filter(
                    teacher_id__in=teacher_ids
                ).values_list('id', flat=True)
                
                # Count unique students enrolled in these courses
                from ..models import Enrollment
                student_count = Enrollment.objects.filter(
                    course_id__in=course_ids
                ).values('student_id').distinct().count()
        
        # If no students found via courses, try to match by department
        if student_count == 0 and inst_dept and inst_dept.lower() != 'administration':
            student_count = User.objects.filter(
                role=User.Role.STUDENT,
                is_active=True,
                department=inst_dept
            ).count()
        elif student_count == 0 and (not inst_dept or inst_dept.lower() == 'administration'):
            # If institution manages all, count all active students
            from ..models import Enrollment
            student_count = Enrollment.objects.filter(
                is_active=True
            ).values('student_id').distinct().count()
        
        # Last login info
        last_login = inst.last_login
        login_status = 'never'
        if last_login:
            days_since_login = (now - last_login).days
            if days_since_login == 0:
                login_status = 'today'
            elif days_since_login <= 7:
                login_status = 'recent'
            elif days_since_login <= 30:
                login_status = 'month'
            else:
                login_status = 'old'
        
        # Only include non-superuser institutions (customers only)
        # Super admin accounts should NOT appear in the institutions list
        # Super admin = program owner, Institution admin = customer
        if not inst.is_superuser:
            institutions_data.append({
                'id': inst.id,
                'username': inst.username,
                'email': inst.email,
                'first_name': inst.first_name,
                'last_name': inst.last_name,
                'full_name': inst.get_full_name() or inst.username,
                'department': inst_dept,
                'phone': inst.phone,
                'is_active': inst.is_active,
                'is_superuser': False,  # All items in this list are non-superuser (customers)
                'date_joined': inst.date_joined.isoformat() if inst.date_joined else None,
                'last_login': last_login.isoformat() if last_login else None,
                'login_status': login_status,
                'student_count': student_count,
                'teacher_count': teacher_count,
                'course_count': course_count,
            })
    
    # Calculate summary statistics
    total_institutions = len(institutions_data)
    total_students = User.objects.filter(
        role=User.Role.STUDENT,
        is_active=True
    ).count()
    total_teachers = User.objects.filter(
        role=User.Role.TEACHER,
        is_active=True
    ).count()
    total_courses = Course.objects.all().count()
    
    return Response({
        'institutions': institutions_data,
        'summary': {
            'total_institutions': total_institutions,
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_courses': total_courses,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_institution_password(request, institution_id):
    """
    Reset password for an institution admin by super admin
    Sends password reset link via email
    
    POST /api/super-admin/institutions/{institution_id}/reset-password/
    """
    user = request.user
    
    # Only superusers can reset institution passwords
    if not user.is_superuser:
        return Response({
            'error': 'Only super admins can reset institution passwords'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        institution = User.objects.get(id=institution_id, role=User.Role.INSTITUTION)
        
        # Don't allow resetting super admin accounts
        if institution.is_superuser:
            return Response({
                'success': False,
                'error': 'Cannot reset password for super admin accounts'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Generate temporary password
        from ..serializers import generate_temp_password
        temp_password = generate_temp_password()
        
        # Set temporary password and mark user as needing password change
        with transaction.atomic():
            institution.set_password(temp_password)
            if hasattr(institution, "is_temporary_password"):
                institution.is_temporary_password = True
            institution.save()
        
        # Build email
        full_name = (institution.get_full_name() or "").strip()
        if full_name:
            greeting_line = f"Hello {full_name},\n\n"
        else:
            greeting_line = "Hello,\n\n"
        
        message = (
            greeting_line
            + "Your AcuRate institution admin account password has been reset by a super administrator.\n\n"
            + "Account Details:\n"
            + f"Username: {institution.username}\n"
            + f"Email address: {institution.email}\n"
            + f"Temporary password: {temp_password}\n\n"
            + "IMPORTANT: Please log in using your EMAIL ADDRESS or USERNAME and this temporary password.\n"
            + "After logging in, you will be REQUIRED to change your password immediately.\n"
            + "You will not be able to use the system until you update your password.\n\n"
            + "If you did not request this password reset, please contact your administrator immediately.\n\n"
            + "Best regards,\n"
            + "AcuRate Team"
        )
        
        email_sent = False
        email_error_message = None
        
        # Ensure SSL skip is applied if needed
        import ssl
        if os.environ.get("SENDGRID_SKIP_SSL_VERIFY", "").lower() == "true":
            ssl._create_default_https_context = ssl._create_unverified_context
        
        try:
            result = send_mail(
                subject="AcuRate - Temporary Password (Admin Reset)",
                message=message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[institution.email],
                fail_silently=False,
            )
            email_sent = result > 0
            if not email_sent:
                email_error_message = "Email sending returned 0 (no emails sent)"
        except Exception as email_error:
            error_str = str(email_error)
            error_type = type(email_error).__name__
            logger = logging.getLogger(__name__)
            logger.error(
                f"Failed to send password reset email to {institution.email}. "
                f"Error type: {error_type}, Error: {error_str}",
                exc_info=True
            )
            email_error_message = f"Email sending failed ({error_type}): {error_str}"
        
        # Log password reset
        log_activity(
            action_type=ActivityLog.ActionType.PASSWORD_RESET,
            user=user,
            institution=None,
            department=institution.department,
            description=f"Password reset for institution admin: {institution.get_full_name() or institution.username} (requested by super admin)",
            related_object_type='User',
            related_object_id=institution.id,
            metadata={
                'role': 'INSTITUTION',
                'reset_by': user.username,
                'email_sent': email_sent,
                'email_error': email_error_message
            }
        )
        
        if email_sent:
            return Response({
                'success': True,
                'message': f'Temporary password has been sent to {institution.email}. User will be required to change password on next login.',
                'email_sent': True
            }, status=status.HTTP_200_OK)
        else:
            # SECURITY: Log credentials for admin, never expose in API response
            logger.info(
                f"[ADMIN] Password reset for {institution.username} - email failed. "
                f"Admin should check server logs or use alternative method."
            )
            return Response({
                'success': True,
                'message': f'Password has been reset, but email could not be sent: {email_error_message}. Please check server logs (admin only) or use an alternative method to provide credentials.',
                'email_sent': False,
                'email_error': email_error_message,
                'action_required': 'Contact system administrator for credentials or retry email sending'
            }, status=status.HTTP_200_OK)
            
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Institution not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Failed to reset password: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# LEARNING OUTCOME VIEWSET
# =============================================================================

class LearningOutcomeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for LearningOutcome CRUD operations
    Only TEACHER role can create/update/delete LOs for their courses
    """
    queryset = LearningOutcome.objects.all()
    serializer_class = LearningOutcomeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'title', 'description']
    ordering_fields = ['code', 'created_at', 'course__code']
    ordering = ['course__code', 'code']
    
    def get_queryset(self):
        """Filter LOs based on user role"""
        user = self.request.user
        queryset = LearningOutcome.objects.select_related('course')
        
        # Teachers see only LOs for their courses
        if user.role == User.Role.TEACHER:
            queryset = queryset.filter(course__teacher=user)
        
        # Filter by course if specified
        course_id = self.request.query_params.get('course', None)
        if course_id:
            try:
                course_id_int = int(course_id)
                queryset = queryset.filter(course_id=course_id_int)
            except (ValueError, TypeError):
                # Invalid course_id, return empty queryset
                queryset = queryset.none()
        
        # Filter active LOs for non-admin users
        if not user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override list to ensure proper response format"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """Only allow teachers to create LOs for their own courses"""
        user = self.request.user
        course = serializer.validated_data.get('course')
        
        if user.role != User.Role.TEACHER and not user.is_staff:
            raise PermissionDenied('Only teachers can create Learning Outcomes')
        
        if course and course.teacher != user and not user.is_staff:
            raise PermissionDenied('You can only create Learning Outcomes for your own courses')
        
        serializer.save()
    
    def perform_update(self, serializer):
        """Only allow teachers to update LOs for their own courses"""
        user = self.request.user
        learning_outcome = self.get_object()
        
        if user.role != User.Role.TEACHER and not user.is_staff:
            raise PermissionDenied('Only teachers can update Learning Outcomes')
        
        if learning_outcome.course.teacher != user and not user.is_staff:
            raise PermissionDenied('You can only update Learning Outcomes for your own courses')
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only allow teachers to delete LOs for their own courses"""
        user = self.request.user
        
        if user.role != User.Role.TEACHER and not user.is_staff:
            raise PermissionDenied('Only teachers can delete Learning Outcomes')
        
        if instance.course.teacher != user and not user.is_staff:
            raise PermissionDenied('You can only delete Learning Outcomes for your own courses')
        
        instance.delete()


# =============================================================================
# CONTACT REQUEST VIEWS
# =============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def create_contact_request(request):
    """
    Create a new contact request (public endpoint)
    
    POST /api/contact/
    Body: {
        "institution_name": "...",
        "institution_type": "university",
        "contact_name": "...",
        "contact_email": "...",
        "contact_phone": "...",
        "request_type": "demo",
        "message": "..."
    }
    """
    serializer = ContactRequestCreateSerializer(data=request.data)
    if serializer.is_valid():
        contact_request = serializer.save()
        return Response({
            'success': True,
            'message': 'Your request has been received. Our team will contact you within 24 hours.',
            'request_id': contact_request.id
        }, status=status.HTTP_201_CREATED)
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


class ContactRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ContactRequest CRUD operations (admin only)
    """
    queryset = ContactRequest.objects.all()
    serializer_class = ContactRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['institution_name', 'contact_name', 'contact_email', 'message']
    ordering_fields = ['created_at', 'status', 'institution_name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter requests based on user permissions"""
        user = self.request.user
        
        # Only staff/admin/superuser can view all requests
        if not user.is_staff and not user.is_superuser:
            return ContactRequest.objects.none()
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            return ContactRequest.objects.filter(status=status_filter)
        
        return ContactRequest.objects.all()
    
    def get_permissions(self):
        """Only allow staff/admin/superuser to access"""
        # Public create is handled by create_contact_request view
        # This ViewSet is only for admin CRUD operations
        # Check in get_queryset instead, allow authenticated users and check is_superuser/is_staff there
        return [IsAuthenticated()]
    
    def list(self, request, *args, **kwargs):
        """Override list to ensure proper response format"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
