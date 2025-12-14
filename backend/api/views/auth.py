"""AUTH Views Module"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q, Avg, Count, F, Min, Max, StdDev
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.mail import send_mail
from django.core.cache import cache
from django.conf import settings

from ..models import (
    User, Department, ProgramOutcome, Course, CoursePO,
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    ContactRequest, LearningOutcome, StudentLOAchievement, ActivityLog,
    AssessmentLO, LOPO
)
from ..utils import log_activity, get_institution_for_user
from ..cache_utils import cache_response, invalidate_dashboard_cache
from ..middleware import rate_limit
from ..serializers import (
    UserSerializer, UserDetailSerializer, UserCreateSerializer, LoginSerializer,
    TeacherCreateSerializer, StudentCreateSerializer, InstitutionCreateSerializer,
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




# =============================================================================
# AUTHENTICATION VIEWS
# =============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
@rate_limit(requests_per_minute=10, key_prefix='login')  # SECURITY: 10 login attempts/min per IP
def login_view(request):
    """
    Login endpoint - Returns JWT tokens
    
    POST /api/auth/login/
    Body: {"username": "...", "password": "..."}
    """
    # Brute-force protection: Check failed login attempts
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR', 'unknown')
    
    login_attempts_key = f'login_attempts:{ip}'
    login_attempts = cache.get(login_attempts_key, 0)
    
    # Block if more than 5 failed attempts in last 15 minutes
    if login_attempts >= 5:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Blocked login attempt from IP {ip} - too many failed attempts")
        return Response({
            'success': False,
            'error': 'Too many failed login attempts. Please try again in 15 minutes.',
            'errors': {'non_field_errors': ['Too many failed login attempts. Please try again in 15 minutes.']}
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Clear failed login attempts on successful login
        cache.delete(login_attempts_key)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Log login activity
        institution = get_institution_for_user(user)
        log_activity(
            action_type=ActivityLog.ActionType.LOGIN,
            user=user,
            institution=institution,
            department=user.department,
            description=f"{user.get_full_name() or user.username} ({user.get_role_display()}) logged in",
            related_object_type='User',
            related_object_id=user.id
        )
        
        # Check if user needs to change password
        requires_password_change = getattr(user, 'is_temporary_password', False)
        
        return Response({
            'success': True,
            'message': 'Login successful',
            'user': UserDetailSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'requires_password_change': requires_password_change
        })
    
    # Increment failed login attempts (expires in 15 minutes = 900 seconds)
    cache.set(login_attempts_key, login_attempts + 1, 900)
    
    # Format errors for better frontend handling
    errors = serializer.errors
    error_message = None
    
    # Check for non_field_errors or __all__ errors (Django REST Framework format)
    if 'non_field_errors' in errors:
        error_message = errors['non_field_errors'][0] if errors['non_field_errors'] else None
    elif '__all__' in errors:
        error_message = errors['__all__'][0] if errors['__all__'] else None
    elif 'username' in errors or 'password' in errors:
        error_message = 'Invalid username or password'
    
    return Response({
        'success': False,
        'error': error_message or 'Invalid credentials',
        'errors': errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@rate_limit(requests_per_minute=3, key_prefix='forgot_password')  # SECURITY: 3 reset requests/min per IP
def forgot_password_view(request):
    """
    Forgot password endpoint - generates a temporary password and emails it to the user.

    POST /api/auth/forgot-password/
    Body: {"username": "..."} OR {"email": "..."}
    """
    identifier = request.data.get('username') or request.data.get('email')

    if not identifier:
        return Response(
            {
                'success': False,
                'error': 'Username or email is required'
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Look up user by username or email (case-insensitive)
    user = User.objects.filter(
        Q(username__iexact=identifier) | Q(email__iexact=identifier),
        is_active=True,
    ).first()

    # For security, don't reveal whether the user exists.
    if not user:
        return Response(
            {
                'success': True,
                'message': 'If an account with this username/email exists, a temporary password has been sent.'
            }
        )

    # SECURITY: Rate limiting - prevent password reset spam (15 minutes cooldown)
    cache_key = f'password_reset_{user.id}_{user.email}'
    last_reset_time = cache.get(cache_key)
    
    if last_reset_time:
        # Calculate remaining time in seconds
        elapsed = (timezone.now() - last_reset_time).total_seconds()
        remaining_seconds = 900 - elapsed  # 15 minutes = 900 seconds (increased from 3 min for security)
        
        if remaining_seconds > 0:
            remaining_minutes = int(remaining_seconds // 60)
            
            remaining_secs = int(remaining_seconds % 60)
            if remaining_minutes > 0:
                time_message = f"{remaining_minutes} minute{'s' if remaining_minutes > 1 else ''} and {remaining_secs} second{'s' if remaining_secs != 1 else ''}"
            else:
                time_message = f"{remaining_secs} second{'s' if remaining_secs != 1 else ''}"
            
            return Response(
                {
                    'success': False,
                    'error': f'Please wait {time_message} before requesting another password reset. This helps prevent spam.'
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

    # Generate temporary password and set it
    temp_password = generate_temp_password()
    # Ensure password is clean (no whitespace issues)
    temp_password = temp_password.strip()
    user.set_password(temp_password)
    if hasattr(user, "is_temporary_password"):
        user.is_temporary_password = True
    user.save()
    
    # Verify password was set correctly (for debugging)
    if not user.check_password(temp_password):
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Password verification failed for user {user.username} after setting temporary password")

    # Build email
    full_name = (user.get_full_name() or "").strip()
    if full_name:
        greeting_line = f"Hello {full_name},\n\n"
    else:
        greeting_line = "Hello,\n\n"

    message = (
        greeting_line
        + "You requested to reset your AcuRate account password.\n\n"
        + f"Username: {user.username}\n"
        + f"Email address: {user.email}\n"
        + f"Temporary password: {temp_password}\n\n"
        + "Please log in using your EMAIL ADDRESS or USERNAME and this temporary password.\n"
        + "After logging in, change your password immediately from your profile settings.\n\n"
        + "If you did not request this, please contact your administrator."
    )

    try:
        send_mail(
            subject="AcuRate - Temporary Password",
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        # SECURITY: Set cache to prevent spam (15 minutes = 900 seconds)
        cache.set(cache_key, timezone.now(), 900)
    except Exception as e:
        return Response(
            {
                'success': False,
                'error': f'Failed to send email: {e}'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Log password reset request
    institution = get_institution_for_user(user)
    log_activity(
        action_type=ActivityLog.ActionType.PASSWORD_RESET,
        user=user,
        institution=institution,
        department=user.department,
        description=f"Temporary password generated and emailed to user {user.username}",
        related_object_type='User',
        related_object_id=user.id,
    )

    return Response(
        {
            'success': True,
            'message': 'If an account with this username/email exists, a temporary password has been sent.'
        }
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_username_view(request):
    """
    Forgot username endpoint - sends the username to the user's email.

    POST /api/auth/forgot-username/
    Body: {"email": "..."}
    """
    email = request.data.get('email')

    if not email:
        return Response(
            {
                'success': False,
                'error': 'Email address is required'
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Look up user by email (case-insensitive)
    user = User.objects.filter(
        email__iexact=email,
        is_active=True,
    ).first()

    # For security, don't reveal whether the user exists.
    if not user:
        return Response(
            {
                'success': True,
                'message': 'If an account with this email exists, your username has been sent.'
            }
        )

    # Rate limiting: Check if username recovery was requested recently (within 3 minutes)
    cache_key = f'username_recovery_{user.id}_{user.email}'
    last_recovery_time = cache.get(cache_key)
    
    if last_recovery_time:
        # Calculate remaining time in seconds
        elapsed = (timezone.now() - last_recovery_time).total_seconds()
        remaining_seconds = 180 - elapsed  # 3 minutes = 180 seconds
        
        if remaining_seconds > 0:
            remaining_minutes = int(remaining_seconds // 60)
            remaining_secs = int(remaining_seconds % 60)
            if remaining_minutes > 0:
                time_message = f"{remaining_minutes} minute{'s' if remaining_minutes > 1 else ''} and {remaining_secs} second{'s' if remaining_secs != 1 else ''}"
            else:
                time_message = f"{remaining_secs} second{'s' if remaining_secs != 1 else ''}"
            
            return Response(
                {
                    'success': False,
                    'error': f'Please wait {time_message} before requesting another username recovery. This helps prevent spam.'
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

    # Build email
    full_name = (user.get_full_name() or "").strip()
    if full_name:
        greeting_line = f"Hello {full_name},\n\n"
    else:
        greeting_line = "Hello,\n\n"

    message = (
        greeting_line
        + "You requested to recover your AcuRate account username.\n\n"
        + f"Username: {user.username}\n"
        + f"Email address: {user.email}\n\n"
        + "You can now log in using your username or email address.\n\n"
        + "If you did not request this, please contact your administrator."
    )

    try:
        send_mail(
            subject="AcuRate - Username Recovery",
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        # SECURITY: Set cache to prevent spam (15 minutes = 900 seconds)
        cache.set(cache_key, timezone.now(), 900)
    except Exception as e:
        return Response(
            {
                'success': False,
                'error': f'Failed to send email: {e}'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Log username recovery request
    institution = get_institution_for_user(user)
    log_activity(
        action_type=ActivityLog.ActionType.OTHER,
        user=user,
        institution=institution,
        department=user.department,
        description=f"Username recovery requested and emailed to user {user.email}",
        related_object_type='User',
        related_object_id=user.id,
    )

    return Response(
        {
            'success': True,
            'message': 'If an account with this email exists, your username has been sent.'
        }
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_teacher_view(request):
    """
    Admin/Institution creates a teacher with a backend-generated temporary password.

    POST /api/teachers/
    Body: { "email", "first_name", "last_name", "department" }
    """
    user = request.user
    if not hasattr(user, 'role') or (user.role != User.Role.INSTITUTION and not user.is_staff):
        return Response(
            {"detail": "Only institution admins can create teachers."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = TeacherCreateSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        teacher = serializer.save()
        
        # Check email sending status
        email_sent = getattr(teacher, '_email_sent', False)
        email_error = getattr(teacher, '_email_error', None)
        temp_password = getattr(teacher, '_temp_password', None)
        
        # Log teacher creation
        institution = get_institution_for_user(request.user) or (request.user if hasattr(request.user, 'role') and request.user.role == User.Role.INSTITUTION else None)
        log_activity(
            action_type=ActivityLog.ActionType.USER_CREATED,
            user=request.user,
            institution=institution,
            department=teacher.department,
            description=f"Teacher account created: {teacher.get_full_name() or teacher.username}",
            related_object_type='User',
            related_object_id=teacher.id,
            metadata={
                'role': 'TEACHER', 
                'created_by': request.user.username,
                'email_sent': email_sent,
                'email_error': email_error
            }
        )
        
        response_data = {
            "success": True,
            "teacher": UserDetailSerializer(teacher).data,
            "email_sent": email_sent,
        }
        
        if not email_sent:
            if email_error:
                response_data["email_warning"] = f"Email could not be sent: {email_error}"
            else:
                response_data["email_warning"] = "Email could not be sent"
            
            # SECURITY: Never return passwords in API response
            # Admin should check server logs or use password reset
            response_data["action_required"] = "Please use the password reset feature or check server logs for temporary credentials"
        
        if email_error:
            response_data["email_error"] = email_error
        
        return Response(
            response_data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        {"success": False, "errors": serializer.errors},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_student_view(request):
    """
    Admin/Institution creates a student with a backend-generated temporary password.

    POST /api/students/
    Body: { "email", "first_name", "last_name", "department", "student_id", "year_of_study" }
    """
    user = request.user
    if not hasattr(user, 'role') or (user.role != User.Role.INSTITUTION and not user.is_staff):
        return Response(
            {"detail": "Only institution admins can create students."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = StudentCreateSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        student = serializer.save()
        
        # Check email sending status
        email_sent = getattr(student, '_email_sent', False)
        email_error = getattr(student, '_email_error', None)
        temp_password = getattr(student, '_temp_password', None)
        
        # Log student creation
        institution = get_institution_for_user(request.user) or (request.user if hasattr(request.user, 'role') and request.user.role == User.Role.INSTITUTION else None)
        log_activity(
            action_type=ActivityLog.ActionType.USER_CREATED,
            user=request.user,
            institution=institution,
            department=student.department,
            description=f"Student account created: {student.get_full_name() or student.username} (Student ID: {student.student_id})",
            related_object_type='User',
            related_object_id=student.id,
            metadata={
                'role': 'STUDENT', 
                'created_by': request.user.username,
                'email_sent': email_sent,
                'email_error': email_error,
                'student_id': student.student_id
            }
        )
        
        response_data = {
            "success": True,
            "student": UserDetailSerializer(student).data,
            "email_sent": email_sent,
        }
        
        if not email_sent:
            if email_error:
                response_data["email_warning"] = f"Email could not be sent: {email_error}"
            else:
                response_data["email_warning"] = "Email could not be sent"
            
            # SECURITY: Never return passwords in API response
            # Admin should check server logs or use password reset
            response_data["action_required"] = "Please use the password reset feature or check server logs for temporary credentials"
        
        if email_error:
            response_data["email_error"] = email_error
        
        return Response(
            response_data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        {"success": False, "errors": serializer.errors},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint - Blacklists the refresh token
    
    POST /api/auth/logout/
    Body: {"refresh": "..."}
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({
            'success': True,
            'message': 'Logout successful'
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """
    Get current authenticated user info
    
    GET /api/auth/me/
    """
    serializer = UserDetailSerializer(request.user)
    return Response({
        'success': True,
        'user': serializer.data
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Register new user
    
    POST /api/auth/register/
    """
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'message': 'Registration successful',
            'user': UserDetailSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)
