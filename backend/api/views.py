"""
AcuRate - API Views
REST API endpoints for the AcuRate system
"""

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

from .models import (
    User, Department, ProgramOutcome, Course, CoursePO,
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    ContactRequest, LearningOutcome, StudentLOAchievement, ActivityLog,
    AssessmentLO, LOPO
)
from .utils import log_activity, get_institution_for_user
from .cache_utils import cache_response, invalidate_dashboard_cache
from .serializers import (
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


# =============================================================================
# AUTHENTICATION VIEWS
# =============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login endpoint - Returns JWT tokens
    
    POST /api/auth/login/
    Body: {"username": "...", "password": "..."}
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
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
        
        return Response({
            'success': True,
            'message': 'Login successful',
            'user': UserDetailSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
    
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

    # Rate limiting: Check if password reset was requested recently (within 3 minutes)
    cache_key = f'password_reset_{user.id}_{user.email}'
    last_reset_time = cache.get(cache_key)
    
    if last_reset_time:
        # Calculate remaining time in seconds
        elapsed = (timezone.now() - last_reset_time).total_seconds()
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
        
        # Set cache to prevent spam (3 minutes = 180 seconds)
        cache.set(cache_key, timezone.now(), 180)
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
        
        # Set cache to prevent spam (3 minutes = 180 seconds)
        cache.set(cache_key, timezone.now(), 180)
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
            metadata={'role': 'TEACHER', 'created_by': request.user.username}
        )
        
        return Response(
            {
                "success": True,
                "teacher": UserDetailSerializer(teacher).data,
            },
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


# =============================================================================
# USER VIEWSET
# =============================================================================

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User CRUD operations
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name', 'student_id']
    ordering_fields = ['created_at', 'username', 'role']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['retrieve', 'me']:
            return UserDetailSerializer
        return UserSerializer
    
    def get_queryset(self):
        """Filter users based on role and permissions"""
        user = self.request.user
        queryset = User.objects.all()
        
        # Filter by role if specified
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by department if specified
        department = self.request.query_params.get('department', None)
        if department:
            queryset = queryset.filter(department=department)
        
        # Non-admin users can only see active users
        if not user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user info"""
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """Update current user's profile"""
        user = request.user
        serializer = UserDetailSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'user': serializer.data
            })
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change current user's password"""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        new_password_confirm = request.data.get('new_password_confirm')
        
        # Check if user has temporary password - if so, old_password is optional
        has_temporary_password = getattr(user, 'is_temporary_password', False)
        
        if not new_password or not new_password_confirm:
            return Response({
                'success': False,
                'error': 'New password fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != new_password_confirm:
            return Response({
                'success': False,
                'error': 'New passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({
                'success': False,
                'error': 'New password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Only check old password if user doesn't have temporary password
        if not has_temporary_password:
            if not old_password:
                return Response({
                    'success': False,
                    'error': 'Current password is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not user.check_password(old_password):
                return Response({
                    'success': False,
                    'error': 'Current password is incorrect'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        # If the user had a temporary password, mark it as no longer temporary
        if hasattr(user, "is_temporary_password"):
            user.is_temporary_password = False
        user.save()
        
        return Response({
            'success': True,
            'message': 'Password changed successfully'
        })
    
    def create(self, request, *args, **kwargs):
        """Override create to log activity"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        
        # Log user creation
        institution = get_institution_for_user(request.user) or (request.user if hasattr(request.user, 'role') and request.user.role == User.Role.INSTITUTION else None)
        log_activity(
            action_type=ActivityLog.ActionType.USER_CREATED,
            user=request.user,
            institution=institution,
            department=instance.department,
            description=f"{instance.get_role_display()} account created: {instance.get_full_name() or instance.username}",
            related_object_type='User',
            related_object_id=instance.id,
            metadata={'role': instance.role}
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Override update to log activity"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Log user update
        institution = get_institution_for_user(request.user) or (request.user if hasattr(request.user, 'role') and request.user.role == User.Role.INSTITUTION else None)
        log_activity(
            action_type=ActivityLog.ActionType.USER_UPDATED,
            user=request.user,
            institution=institution,
            department=instance.department,
            description=f"{instance.get_role_display()} account updated: {instance.get_full_name() or instance.username}",
            related_object_type='User',
            related_object_id=instance.id,
            metadata={'role': instance.role}
        )
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to add permission checks and return JSON response"""
        instance = self.get_object()
        user = request.user
        
        # Only INSTITUTION role or admin can delete users
        if not hasattr(user, 'role') or (user.role != User.Role.INSTITUTION and not user.is_staff):
            return Response({
                'error': 'Only institution admins can delete users'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Log user deletion before deleting
        institution = get_institution_for_user(user) or (user if hasattr(user, 'role') and user.role == User.Role.INSTITUTION else None)
        log_activity(
            action_type=ActivityLog.ActionType.USER_DELETED,
            user=user,
            institution=institution,
            department=instance.department,
            description=f"{instance.get_role_display()} account deleted: {instance.get_full_name() or instance.username}",
            related_object_type='User',
            related_object_id=instance.id,
            metadata={'role': instance.role}
        )
        
        # Only allow deleting teachers
        if instance.role != User.Role.TEACHER:
            return Response({
                'error': 'Only teachers can be deleted through this endpoint'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Prevent deleting yourself
        if instance.id == user.id:
            return Response({
                'error': 'You cannot delete your own account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete the user
        instance.delete()
        
        return Response({
            'success': True,
            'message': 'Teacher deleted successfully'
        }, status=status.HTTP_200_OK)


# =============================================================================
# DEPARTMENT VIEWSET
# =============================================================================

class DepartmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Department CRUD operations
    Only INSTITUTION role can create/update/delete departments
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        """Only allow INSTITUTION role to create/update/delete departments"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Check if user is INSTITUTION or staff
            if not hasattr(self.request.user, 'role') or (self.request.user.role != User.Role.INSTITUTION and not self.request.user.is_staff):
                return [IsAdminUser()]  # This will deny access
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """Only INSTITUTION can create departments"""
        if not hasattr(request.user, 'role') or (request.user.role != User.Role.INSTITUTION and not request.user.is_staff):
            return Response({
                'error': 'Only institution administrators can create departments'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Only INSTITUTION can update departments"""
        if not hasattr(request.user, 'role') or (request.user.role != User.Role.INSTITUTION and not request.user.is_staff):
            return Response({
                'error': 'Only institution administrators can update departments'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only INSTITUTION can delete departments"""
        if not hasattr(request.user, 'role') or (request.user.role != User.Role.INSTITUTION and not request.user.is_staff):
            return Response({
                'error': 'Only institution administrators can delete departments'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    
    def list(self, request, *args, **kwargs):
        """Override list to ensure proper response format"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# =============================================================================
# PROGRAM OUTCOME VIEWSET
# =============================================================================

class ProgramOutcomeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ProgramOutcome CRUD operations
    Only INSTITUTION role can create/update/delete POs
    """
    queryset = ProgramOutcome.objects.all()
    serializer_class = ProgramOutcomeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'title', 'description']
    ordering_fields = ['code', 'created_at']
    ordering = ['code']
    
    def get_queryset(self):
        """Filter active POs for non-admin users and filter by department if provided"""
        queryset = ProgramOutcome.objects.all()
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        # Filter by department if provided as query parameter
        department = self.request.query_params.get('department', None)
        if department:
            queryset = queryset.filter(department=department)
        
        return queryset
    
    def get_permissions(self):
        """Only allow INSTITUTION role to create/update/delete POs"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Check if user is INSTITUTION or staff
            if not hasattr(self.request.user, 'role') or (self.request.user.role != User.Role.INSTITUTION and not self.request.user.is_staff):
                return [IsAdminUser()]  # This will deny access
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """Only INSTITUTION can create POs"""
        if not hasattr(request.user, 'role') or (request.user.role != User.Role.INSTITUTION and not request.user.is_staff):
            return Response({
                'error': 'Only institution administrators can create Program Outcomes'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Only INSTITUTION can update POs"""
        if not hasattr(request.user, 'role') or (request.user.role != User.Role.INSTITUTION and not request.user.is_staff):
            return Response({
                'error': 'Only institution administrators can update Program Outcomes'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only INSTITUTION can delete POs"""
        if not hasattr(request.user, 'role') or (request.user.role != User.Role.INSTITUTION and not request.user.is_staff):
            return Response({
                'error': 'Only institution administrators can delete Program Outcomes'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    
    def list(self, request, *args, **kwargs):
        """Override list to ensure proper response format"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get PO statistics with achievement data"""
        pos = ProgramOutcome.objects.filter(is_active=True).annotate(
            total_students=Count('studentpoachievement__student', distinct=True),
            students_achieved=Count(
                'studentpoachievement',
                filter=Q(studentpoachievement__achievement_percentage__gte=F('target_percentage')),
                distinct=True
            ),
            average_achievement=Avg('studentpoachievement__achievement_percentage')
        )
        
        serializer = ProgramOutcomeStatsSerializer(pos, many=True)
        return Response(serializer.data)


# =============================================================================
# COURSE VIEWSET
# =============================================================================

class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Course CRUD operations
    """
    queryset = Course.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'semester', 'academic_year', 'created_at']
    ordering = ['code']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer
    
    def get_queryset(self):
        """Filter courses based on user role"""
        user = self.request.user
        queryset = Course.objects.select_related('teacher')
        
        # Filter by teacher
        if hasattr(user, 'role') and user.role == User.Role.TEACHER:
            queryset = queryset.filter(teacher=user)
        
        # Filter by department if specified
        department = self.request.query_params.get('department', None)
        if department:
            queryset = queryset.filter(department=department)
        
        # Filter by semester/academic_year if specified
        semester = self.request.query_params.get('semester', None)
        academic_year = self.request.query_params.get('academic_year', None)
        
        if semester:
            queryset = queryset.filter(semester=semester)
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Override create to log activity"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        
        # Log course creation
        institution = get_institution_for_user(request.user) or (request.user if hasattr(request.user, 'role') and request.user.role == User.Role.INSTITUTION else get_institution_for_user(instance.teacher))
        log_activity(
            action_type=ActivityLog.ActionType.COURSE_CREATED,
            user=request.user,
            institution=institution,
            department=instance.department,
            description=f"Course created: {instance.code} - {instance.name}",
            related_object_type='Course',
            related_object_id=instance.id,
            metadata={'code': instance.code, 'semester': instance.semester}
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Override update to log activity"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Log course update
        institution = get_institution_for_user(request.user) or (request.user if hasattr(request.user, 'role') and request.user.role == User.Role.INSTITUTION else get_institution_for_user(instance.teacher))
        log_activity(
            action_type=ActivityLog.ActionType.COURSE_UPDATED,
            user=request.user,
            institution=institution,
            department=instance.department,
            description=f"Course updated: {instance.code} - {instance.name}",
            related_object_type='Course',
            related_object_id=instance.id,
            metadata={'code': instance.code}
        )
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to log activity"""
        instance = self.get_object()
        
        # Log course deletion before deleting
        institution = get_institution_for_user(request.user) or (request.user if hasattr(request.user, 'role') and request.user.role == User.Role.INSTITUTION else get_institution_for_user(instance.teacher))
        log_activity(
            action_type=ActivityLog.ActionType.COURSE_DELETED,
            user=request.user,
            institution=institution,
            department=instance.department,
            description=f"Course deleted: {instance.code} - {instance.name}",
            related_object_type='Course',
            related_object_id=instance.id,
            metadata={'code': instance.code}
        )
        
        return super().destroy(request, *args, **kwargs)
    
    def list(self, request, *args, **kwargs):
        """Override list to ensure proper response format"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Get all students enrolled in this course"""
        course = self.get_object()
        enrollments = Enrollment.objects.filter(
            course=course,
            is_active=True
        ).select_related('student')
        
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def assessments(self, request, pk=None):
        """Get all assessments for this course"""
        course = self.get_object()
        assessments = Assessment.objects.filter(course=course)
        serializer = AssessmentSerializer(assessments, many=True)
        return Response(serializer.data)


# =============================================================================
# ENROLLMENT VIEWSET
# =============================================================================

class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Enrollment CRUD operations
    """
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['enrolled_at', 'final_grade']
    ordering = ['-enrolled_at']
    
    def get_queryset(self):
        """Filter enrollments based on user role"""
        user = self.request.user
        queryset = Enrollment.objects.select_related('student', 'course')
        
        # Students see only their enrollments
        if user.role == User.Role.STUDENT:
            queryset = queryset.filter(student=user)
        
        # Teachers see enrollments for their courses
        elif user.role == User.Role.TEACHER:
            queryset = queryset.filter(course__teacher=user)
        
        # Filter by course/student if specified
        course_id = self.request.query_params.get('course', None)
        student_id = self.request.query_params.get('student', None)
        
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Override create to log activity"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        
        # Log enrollment creation
        institution = get_institution_for_user(request.user) or get_institution_for_user(instance.student) or get_institution_for_user(instance.course.teacher)
        log_activity(
            action_type=ActivityLog.ActionType.ENROLLMENT_CREATED,
            user=request.user,
            institution=institution,
            department=instance.student.department or instance.course.department,
            description=f"Student enrolled in course: {instance.course.code} - {instance.course.name}",
            related_object_type='Enrollment',
            related_object_id=instance.id,
            metadata={'course_code': instance.course.code, 'student_id': instance.student.id}
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Override update to log activity"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Log enrollment update
        institution = get_institution_for_user(request.user) or get_institution_for_user(instance.student) or get_institution_for_user(instance.course.teacher)
        log_activity(
            action_type=ActivityLog.ActionType.ENROLLMENT_UPDATED,
            user=request.user,
            institution=institution,
            department=instance.student.department or instance.course.department,
            description=f"Enrollment updated for course: {instance.course.code}",
            related_object_type='Enrollment',
            related_object_id=instance.id,
            metadata={'course_code': instance.course.code}
        )
        
        return Response(serializer.data)
    
    def list(self, request, *args, **kwargs):
        """Override list to ensure proper response format"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# =============================================================================
# ASSESSMENT VIEWSET
# =============================================================================

class AssessmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Assessment CRUD operations
    """
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'created_at']
    ordering = ['-due_date']
    
    def get_queryset(self):
        """Filter assessments based on user role"""
        user = self.request.user
        queryset = Assessment.objects.select_related('course')
        
        # Teachers see only their course assessments
        if user.role == User.Role.TEACHER:
            queryset = queryset.filter(course__teacher=user)
        
        # Students see assessments for their enrolled courses
        elif user.role == User.Role.STUDENT:
            enrolled_courses = Enrollment.objects.filter(
                student=user,
                is_active=True
            ).values_list('course_id', flat=True)
            queryset = queryset.filter(course_id__in=enrolled_courses)
        
        # Filter by course if specified
        course_id = self.request.query_params.get('course', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override list to ensure proper response format"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def grades(self, request, pk=None):
        """Get all grades for this assessment"""
        assessment = self.get_object()
        grades = StudentGrade.objects.filter(assessment=assessment)
        serializer = StudentGradeSerializer(grades, many=True)
        return Response(serializer.data)


# =============================================================================
# STUDENT GRADE VIEWSET
# =============================================================================

class StudentGradeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for StudentGrade CRUD operations
    """
    queryset = StudentGrade.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['graded_at', 'score']
    ordering = ['-graded_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StudentGradeDetailSerializer
        return StudentGradeSerializer
    
    def get_queryset(self):
        """Filter grades based on user role"""
        user = self.request.user
        queryset = StudentGrade.objects.select_related('student', 'assessment')
        
        # Students see only their grades
        if user.role == User.Role.STUDENT:
            queryset = queryset.filter(student=user)
        
        # Teachers see grades for their courses
        elif user.role == User.Role.TEACHER:
            queryset = queryset.filter(assessment__course__teacher=user)
        
        # Filter by student/assessment if specified
        student_id = self.request.query_params.get('student', None)
        assessment_id = self.request.query_params.get('assessment', None)
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if assessment_id:
            queryset = queryset.filter(assessment_id=assessment_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):  # type: ignore[override]
        """Override create to log activity"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        
        # Log grade assignment
        institution = get_institution_for_user(request.user) or get_institution_for_user(instance.student) or get_institution_for_user(instance.assessment.course.teacher)
        log_activity(
            action_type=ActivityLog.ActionType.GRADE_ASSIGNED,
            user=request.user,
            institution=institution,
            department=instance.student.department or instance.assessment.course.department,
            description=f"Grade assigned: {instance.score}/{instance.assessment.max_score} for {instance.assessment.title}",
            related_object_type='StudentGrade',
            related_object_id=instance.id,
            metadata={'assessment_id': instance.assessment.id, 'course_code': instance.assessment.course.code}
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):  # type: ignore[override]
        """Override update to log activity"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Log grade update
        institution = get_institution_for_user(request.user) or get_institution_for_user(instance.student) or get_institution_for_user(instance.assessment.course.teacher)
        log_activity(
            action_type=ActivityLog.ActionType.GRADE_UPDATED,
            user=request.user,
            institution=institution,
            department=instance.student.department or instance.assessment.course.department,
            description=f"Grade updated: {instance.score}/{instance.assessment.max_score} for {instance.assessment.title}",
            related_object_type='StudentGrade',
            related_object_id=instance.id,
            metadata={'assessment_id': instance.assessment.id, 'course_code': instance.assessment.course.code}
        )
        
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Override create to log activity"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        
        # Log grade assignment
        institution = get_institution_for_user(request.user) or get_institution_for_user(instance.student) or get_institution_for_user(instance.assessment.course.teacher)
        log_activity(
            action_type=ActivityLog.ActionType.GRADE_ASSIGNED,
            user=request.user,
            institution=institution,
            department=instance.student.department or instance.assessment.course.department,
            description=f"Grade assigned: {instance.score}/{instance.assessment.max_score} for {instance.assessment.title}",
            related_object_type='StudentGrade',
            related_object_id=instance.id,
            metadata={'assessment_id': instance.assessment.id, 'course_code': instance.assessment.course.code}
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Override update to log activity"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Log grade update
        institution = get_institution_for_user(request.user) or get_institution_for_user(instance.student) or get_institution_for_user(instance.assessment.course.teacher)
        log_activity(
            action_type=ActivityLog.ActionType.GRADE_UPDATED,
            user=request.user,
            institution=institution,
            department=instance.student.department or instance.assessment.course.department,
            description=f"Grade updated: {instance.score}/{instance.assessment.max_score} for {instance.assessment.title}",
            related_object_type='StudentGrade',
            related_object_id=instance.id,
            metadata={'assessment_id': instance.assessment.id, 'course_code': instance.assessment.course.code}
        )
        
        return Response(serializer.data)
    
    def list(self, request, *args, **kwargs):
        """Override list to ensure proper response format"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """Save grade"""
        serializer.save()


# =============================================================================
# STUDENT PO ACHIEVEMENT VIEWSET
# =============================================================================

class StudentPOAchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for StudentPOAchievement (Read-only)
    Achievements are calculated automatically
    """
    queryset = StudentPOAchievement.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['current_percentage', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StudentPOAchievementDetailSerializer
        return StudentPOAchievementSerializer
    
    def get_queryset(self):
        """Filter achievements based on user role"""
        user = self.request.user
        queryset = StudentPOAchievement.objects.select_related('student', 'program_outcome')
        
        # Students see only their achievements
        if user.role == User.Role.STUDENT:
            queryset = queryset.filter(student=user)
        
        # Filter by student/PO if specified
        student_id = self.request.query_params.get('student', None)
        po_id = self.request.query_params.get('program_outcome', None)
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if po_id:
            queryset = queryset.filter(program_outcome_id=po_id)
        
        return queryset


# =============================================================================
# DASHBOARD VIEWS
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@cache_response(timeout=settings.CACHE_TIMEOUT_ANALYTICS, key_prefix='dashboard:student')
def student_dashboard(request):
    """
    Student dashboard with all relevant data
    
    GET /api/dashboard/student/
    Cached for 10 minutes
    """
    user = request.user
    
    if user.role != User.Role.STUDENT:
        return Response({
            'error': 'This endpoint is only for students'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get student's enrollments
    enrollments = Enrollment.objects.filter(
        student=user,
        is_active=True
    ).select_related('course')
    
    # Get PO achievements
    po_achievements = StudentPOAchievement.objects.filter(
        student=user
    ).select_related('program_outcome')
    
    # Get recent grades
    recent_grades = StudentGrade.objects.filter(
        student=user
    ).select_related('assessment').order_by('-created_at')[:10]
    
    # Calculate GPA and stats
    completed_enrollments = Enrollment.objects.filter(
        student=user,
        is_active=False,
        final_grade__isnull=False
    )
    
    total_credits = sum([e.course.credits for e in enrollments])
    completed_courses = completed_enrollments.count()
    
    if completed_enrollments.exists():
        # Calculate GPA on 4.0 scale (final_grade is 0-100, convert to 0-4.0)
        avg_grade_100 = completed_enrollments.aggregate(Avg('final_grade'))['final_grade__avg'] or 0
        # Convert Decimal to float for calculation
        overall_gpa = float(avg_grade_100) / 100.0 * 4.0 if avg_grade_100 else 0.0
    else:
        overall_gpa = 0.0
    
    # Calculate student ranking (anonymous) - Optimized version
    # Get all students' GPAs in one query using aggregation
    # Note: avg_gpa is calculated from final_grade (0-100), we'll convert to 4.0 scale
    students_with_gpa = User.objects.filter(
        role=User.Role.STUDENT,
        is_active=True
    ).annotate(
        avg_grade_100=Avg('enrollments__final_grade', filter=Q(enrollments__is_active=False, enrollments__final_grade__isnull=False))
    ).filter(avg_grade_100__isnull=False).values('id', 'avg_grade_100')
    
    # Convert to list and calculate GPA on 4.0 scale, then sort
    all_students_gpa = []
    for student_data in students_with_gpa:
        avg_grade_100 = float(student_data['avg_grade_100'])
        avg_gpa_4_0 = (avg_grade_100 / 100) * 4.0
        all_students_gpa.append({
            'id': student_data['id'],
            'avg_gpa': avg_gpa_4_0
        })
    
    # Sort by GPA descending (highest first)
    all_students_gpa.sort(key=lambda x: x['avg_gpa'], reverse=True)
    total_students_with_gpa = len(all_students_gpa)
    
    user_rank = None
    percentile = 0
    
    if overall_gpa > 0 and total_students_with_gpa > 0:
        # Find user's rank in the sorted list (highest GPA = rank 1)
        for i, student_data in enumerate(all_students_gpa):
            if student_data['id'] == user.id:
                user_rank = i + 1
                break
        
        # If user not found in list (shouldn't happen), calculate rank by GPA
        if user_rank is None:
            # Count students with higher GPA
            students_with_higher_gpa = sum(1 for s in all_students_gpa if s['avg_gpa'] > overall_gpa)
            user_rank = students_with_higher_gpa + 1
        
        percentile = round(((total_students_with_gpa - user_rank + 1) / total_students_with_gpa) * 100)

    # Serialize nested objects
    serializer_data = {
        'student': UserDetailSerializer(user).data,
        'enrollments': [EnrollmentSerializer(e).data for e in enrollments],
        'po_achievements': [StudentPOAchievementSerializer(po).data for po in po_achievements],
        'recent_grades': [StudentGradeSerializer(g).data for g in recent_grades],
        'overall_gpa': round(overall_gpa, 2),
        'total_credits': total_credits,
        'completed_courses': completed_courses,
        'gpa_ranking': {
            'rank': user_rank,
            'total_students': total_students_with_gpa,
            'percentile': percentile
        } if user_rank else None
    }
    
    return Response(serializer_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@cache_response(timeout=settings.CACHE_TIMEOUT_ANALYTICS, key_prefix='dashboard:teacher')
def teacher_dashboard(request):
    """
    Teacher dashboard with course and student data
    
    GET /api/dashboard/teacher/
    Cached for 10 minutes
    """
    user = request.user
    
    if user.role != User.Role.TEACHER:
        return Response({
            'error': 'This endpoint is only for teachers'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get teacher's courses with all necessary prefetches
    courses = Course.objects.filter(
        teacher=user
    ).prefetch_related(
        'enrollments',
        'course_pos__program_outcome',
        'learning_outcomes'
    ).select_related('teacher')
    
    # Calculate total students (active enrollments)
    total_students = Enrollment.objects.filter(
        course__teacher=user,
        is_active=True
    ).values('student').distinct().count()
    
    # Pending assessments (assessments with no grades yet)
    pending_assessments = Assessment.objects.filter(
        course__teacher=user
    ).annotate(
        grade_count=Count('grades')
    ).filter(grade_count=0).count()
    
    # Recent submissions
    recent_submissions = StudentGrade.objects.filter(
        assessment__course__teacher=user
    ).select_related('student', 'assessment').order_by('-graded_at')[:10]
    
    # Serialize data manually (like student_dashboard)
    serializer_data = {
        'teacher': UserDetailSerializer(user).data,
        'courses': [CourseDetailSerializer(course).data for course in courses],
        'total_students': total_students,
        'pending_assessments': pending_assessments,
        'recent_submissions': [StudentGradeSerializer(submission).data for submission in recent_submissions]
    }
    
    return Response(serializer_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@cache_response(timeout=settings.CACHE_TIMEOUT_ANALYTICS, key_prefix='dashboard:institution')
def institution_dashboard(request):
    """
    Institution dashboard with overall statistics
    
    GET /api/dashboard/institution/
    Cached for 10 minutes
    """
    user = request.user
    
    if user.role != User.Role.INSTITUTION and not user.is_staff:
        return Response({
            'error': 'This endpoint is only for institution admins'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Overall statistics
    total_students = User.objects.filter(role=User.Role.STUDENT, is_active=True).count()
    total_teachers = User.objects.filter(role=User.Role.TEACHER, is_active=True).count()
    total_courses = Course.objects.all().count()  # Course model doesn't have is_active field
    active_enrollments = Enrollment.objects.filter(is_active=True).count()
    
    # PO achievements statistics
    po_achievements = ProgramOutcome.objects.filter(is_active=True).annotate(
        total_students=Count('student_achievements__student', distinct=True),
        students_achieved=Count(
            'student_achievements',
            filter=Q(student_achievements__current_percentage__gte=F('target_percentage')),
            distinct=True
        ),
        average_achievement=Avg('student_achievements__current_percentage')
    )
    
    # Department statistics with detailed calculations
    # Get all unique departments and normalize them
    department_list_raw = User.objects.filter(
        role=User.Role.STUDENT,
        is_active=True,
        department__isnull=False
    ).exclude(department='').values_list('department', flat=True).distinct()
    
    # Normalize department names (remove duplicates with different whitespace/case)
    def normalize_dept(name):
        return ' '.join(name.strip().split())
    
    # Group by normalized name, keep the first occurrence
    seen_normalized = {}
    department_list = []
    for dept in department_list_raw:
        normalized = normalize_dept(dept)
        if normalized.lower() not in seen_normalized:
            seen_normalized[normalized.lower()] = dept
            department_list.append(dept)
    
    department_stats = []
    for dept in department_list:
        # Student count
        student_count = User.objects.filter(
            role=User.Role.STUDENT,
            is_active=True,
            department=dept
        ).count()
        
        # Course count for this department
        course_count = Course.objects.filter(department=dept).count()
        
        # Faculty count for this department
        faculty_count = User.objects.filter(
            role=User.Role.TEACHER,
            is_active=True,
            department=dept
        ).count()
        
        # Average grade for students in this department
        # Get all enrollments for students in this department
        dept_students = User.objects.filter(
            role=User.Role.STUDENT,
            is_active=True,
            department=dept
        )
        dept_enrollments = Enrollment.objects.filter(
            student__in=dept_students,
            final_grade__isnull=False
        )
        avg_grade = dept_enrollments.aggregate(
            avg=Avg('final_grade')
        )['avg']
        avg_grade = round(float(avg_grade), 1) if avg_grade else None
        
        # PO Achievement average for students in this department
        # Get all PO achievements for students in this department
        dept_po_achievements = StudentPOAchievement.objects.filter(
            student__in=dept_students
        )
        po_achievement_avg = dept_po_achievements.aggregate(
            avg=Avg('current_percentage')
        )['avg']
        po_achievement_avg = round(float(po_achievement_avg), 1) if po_achievement_avg else None
        
        department_stats.append({
            'department': dept,
            'student_count': student_count,
            'course_count': course_count,
            'faculty_count': faculty_count,
            'avg_grade': avg_grade,
            'po_achievement': po_achievement_avg
        })
    
    # Sort by student_count descending
    department_stats.sort(key=lambda x: x['student_count'], reverse=True)
    
    # Serialize PO achievements
    po_achievements_data = ProgramOutcomeStatsSerializer(po_achievements, many=True).data
    
    data = {
        'total_students': total_students,
        'total_teachers': total_teachers,
        'total_courses': total_courses,
        'active_enrollments': active_enrollments,
        'po_achievements': po_achievements_data,
        'department_stats': department_stats
    }
    
    serializer = InstitutionDashboardSerializer(data=data)
    if serializer.is_valid():
        return Response(serializer.validated_data)
    else:
        # If validation fails, return data directly
        return Response(data)


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
            institution = serializer.save()
            
            # Log institution creation
            log_activity(
                action_type=ActivityLog.ActionType.USER_CREATED,
                user=user,
                institution=None,  # New institution, no parent
                department=institution.department,
                description=f"Institution admin account created: {institution.get_full_name() or institution.username}",
                related_object_type='User',
                related_object_id=institution.id,
                metadata={'role': 'INSTITUTION', 'created_by': user.username}
            )
            
            return Response({
                'success': True,
                'message': 'Institution created successfully. Credentials have been sent to the email.',
                'institution': UserDetailSerializer(institution).data
            }, status=status.HTTP_201_CREATED)
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
        
        # Count students in this institution's department
        student_count = 0
        if inst_dept:
            student_count = User.objects.filter(
                role=User.Role.STUDENT,
                is_active=True,
                department=inst_dept
            ).count()
        
        # Count teachers created by this institution or in same department
        teacher_count = User.objects.filter(
            role=User.Role.TEACHER,
            is_active=True,
            created_by=inst
        ).count()
        
        # If no teachers created by institution, try to match by department
        if teacher_count == 0 and inst_dept:
            teacher_count = User.objects.filter(
                role=User.Role.TEACHER,
                is_active=True,
                department=inst_dept
            ).count()
        
        # Count courses in this institution's department
        course_count = 0
        if inst_dept:
            course_count = Course.objects.filter(department=inst_dept).count()
        
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
    
    return Response(institutions_data)


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


# =============================================================================
# COURSE ANALYTICS VIEWS
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_analytics_overview(request):
    """
    Get course analytics overview for all student's courses
    
    GET /api/course-analytics/
    Returns anonymized, aggregated analytics for each course
    """
    user = request.user
    
    if user.role != User.Role.STUDENT:
        return Response({
            'error': 'This endpoint is only for students'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get student's enrollments
    enrollments = Enrollment.objects.filter(
        student=user
    ).select_related('course', 'course__teacher')
    
    # Use a set to track unique course codes to avoid duplicates
    seen_courses = set()
    course_analytics_list = []
    
    for enrollment in enrollments:
        course = enrollment.course
        
        # Create unique key: course_code + academic_year
        course_key = f"{course.code}_{course.academic_year}"
        
        # Skip if we've already processed this course
        if course_key in seen_courses:
            continue
        
        seen_courses.add(course_key)
        
        # Get all enrollments for this course (for class statistics)
        # Include both active and inactive enrollments with final grades
        all_course_enrollments = Enrollment.objects.filter(
            course=course,
            final_grade__isnull=False
        )
        
        # Calculate class statistics (anonymized)
        class_stats = all_course_enrollments.aggregate(
            avg=Avg('final_grade'),
            count=Count('id'),
            min_score=Min('final_grade'),
            max_score=Max('final_grade')
        )
        
        # Calculate median manually
        scores_list = sorted([float(e.final_grade) for e in all_course_enrollments])
        n = len(scores_list)
        median = scores_list[n // 2] if n > 0 else 0
        
        # Calculate user's percentile
        user_percentile = None
        user_score = enrollment.final_grade
        if user_score is not None and class_stats['count'] > 0:
            students_below = all_course_enrollments.filter(final_grade__lt=user_score).count()
            user_percentile = round((students_below / class_stats['count']) * 100)
        
        class_stats['median'] = median
        
        # Determine trend (simplified - compare with previous semester if available)
        trend = 'neutral'  # Will be calculated based on historical data
        
        course_analytics_list.append({
            'course_id': course.id,
            'course_code': course.code,
            'course_name': course.name,
            'instructor': course.teacher.get_full_name() if course.teacher else 'TBA',
            'semester': f"{course.get_semester_display()} {course.academic_year}",
            'class_average': float(class_stats['avg']) if class_stats['avg'] else 0,
            'class_median': float(class_stats.get('median', 0)),
            'class_size': class_stats['count'],
            'user_score': float(user_score) if user_score else None,
            'user_percentile': user_percentile,
            'trend': trend
        })
    
    return Response({
        'success': True,
        'courses': course_analytics_list
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_analytics_detail(request, course_id):
    """
    Get detailed course analytics for a specific course
    
    GET /api/course-analytics/<course_id>/
    Returns detailed, anonymized analytics including distributions and comparisons
    """
    user = request.user
    
    if user.role != User.Role.STUDENT:
        return Response({
            'error': 'This endpoint is only for students'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get course
    course = get_object_or_404(Course, id=course_id)
    
    # Verify student is enrolled in this course
    enrollment = Enrollment.objects.filter(
        student=user,
        course=course
    ).first()
    
    if not enrollment:
        return Response({
            'error': 'You are not enrolled in this course'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get all enrollments for this course (for class statistics)
    all_enrollments = Enrollment.objects.filter(
        course=course,
        is_active=False,
        final_grade__isnull=False
    )
    
    # Get all grades for this course's assessments
    course_assessments = Assessment.objects.filter(course=course)
    all_grades = StudentGrade.objects.filter(
        assessment__in=course_assessments
    ).select_related('assessment', 'student')
    
    # Calculate class statistics
    class_stats = all_enrollments.aggregate(
        avg=Avg('final_grade'),
        count=Count('id'),
        min_score=Min('final_grade'),
        max_score=Max('final_grade'),
        std_dev=StdDev('final_grade')
    )
    
    # Calculate median manually
    scores_list_for_median = sorted([float(e.final_grade) for e in all_enrollments])
    n_median = len(scores_list_for_median)
    median = scores_list_for_median[n_median // 2] if n_median > 0 else 0
    class_stats['median'] = median
    
    # Calculate user's percentile
    user_percentile = None
    user_score = enrollment.final_grade
    if user_score is not None and class_stats['count'] > 0:
        students_below = all_enrollments.filter(final_grade__lt=user_score).count()
        user_percentile = round((students_below / class_stats['count']) * 100)
    
    # Calculate score distribution (histogram bins: 0-20, 21-40, 41-60, 61-80, 81-100)
    distribution = [0, 0, 0, 0, 0]
    for enroll in all_enrollments:
        score = float(enroll.final_grade)
        if score <= 20:
            distribution[0] += 1
        elif score <= 40:
            distribution[1] += 1
        elif score <= 60:
            distribution[2] += 1
        elif score <= 80:
            distribution[3] += 1
        else:
            distribution[4] += 1
    
    # Calculate boxplot data (simplified - using quartiles)
    scores_list = sorted([float(e.final_grade) for e in all_enrollments])
    n = len(scores_list)
    boxplot_data = {
        'min': float(class_stats['min_score']) if class_stats['min_score'] else 0,
        'q1': scores_list[n // 4] if n > 0 else 0,
        'median': scores_list[n // 2] if n > 0 else 0,
        'q3': scores_list[3 * n // 4] if n > 0 else 0,
        'max': float(class_stats['max_score']) if class_stats['max_score'] else 0
    }
    
    # Calculate assessment comparison
    assessment_comparison = []
    for assessment in course_assessments:
        assessment_grades = all_grades.filter(assessment=assessment)
        if assessment_grades.exists():
            class_avg = assessment_grades.aggregate(avg=Avg('score'))['avg']
            user_grade = assessment_grades.filter(student=user).first()
            
            assessment_comparison.append({
                'assessment': assessment.title,
                'class_average': float(class_avg) if class_avg else 0,
                'user_score': float(user_grade.score) if user_grade else None
            })
    
    return Response({
        'success': True,
        'course': {
            'id': course.id,
            'code': course.code,
            'name': course.name,
            'instructor': course.teacher.get_full_name() if course.teacher else 'TBA',
            'semester': f"{course.get_semester_display()} {course.academic_year}"
        },
        'analytics': {
            'class_average': float(class_stats['avg']) if class_stats['avg'] else 0,
            'class_median': float(class_stats.get('median', 0)),
            'class_size': class_stats['count'],
            'highest_score': float(class_stats['max_score']) if class_stats['max_score'] else 0,
            'lowest_score': float(class_stats['min_score']) if class_stats['min_score'] else 0,
            'user_score': float(user_score) if user_score else None,
            'user_percentile': user_percentile,
            'score_distribution': distribution,
            'boxplot_data': boxplot_data,
            'assessment_comparison': assessment_comparison
        }
    })


# =============================================================================
# INSTITUTION ANALYTICS VIEWS
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_departments(request):
    """
    Get department comparison analytics
    
    GET /api/analytics/departments/
    Returns department statistics for comparison charts
    """
    user = request.user
    
    if user.role != User.Role.INSTITUTION and not user.is_staff:
        return Response({
            'error': 'This endpoint is only for institution admins'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get all departments and normalize them
    department_list_raw = User.objects.filter(
        role=User.Role.STUDENT,
        is_active=True,
        department__isnull=False
    ).exclude(department='').values_list('department', flat=True).distinct()
    
    # Normalize department names (remove duplicates with different whitespace/case)
    def normalize_dept(name):
        return ' '.join(name.strip().split())
    
    # Group by normalized name, keep the first occurrence
    seen_normalized = {}
    department_list = []
    for dept in department_list_raw:
        normalized = normalize_dept(dept)
        if normalized.lower() not in seen_normalized:
            seen_normalized[normalized.lower()] = dept
            department_list.append(dept)
    
    departments = []
    for dept in department_list:
        # Student count
        student_count = User.objects.filter(
            role=User.Role.STUDENT,
            is_active=True,
            department=dept
        ).count()
        
        # Course count
        course_count = Course.objects.filter(department=dept).count()
        
        # Faculty count
        faculty_count = User.objects.filter(
            role=User.Role.TEACHER,
            is_active=True,
            department=dept
        ).count()
        
        # Average grade
        dept_students = User.objects.filter(
            role=User.Role.STUDENT,
            is_active=True,
            department=dept
        )
        dept_enrollments = Enrollment.objects.filter(
            student__in=dept_students,
            final_grade__isnull=False
        )
        avg_grade = dept_enrollments.aggregate(avg=Avg('final_grade'))['avg']
        avg_grade = round(float(avg_grade), 1) if avg_grade else None
        
        # PO Achievement average
        dept_po_achievements = StudentPOAchievement.objects.filter(
            student__in=dept_students
        )
        po_achievement = dept_po_achievements.aggregate(
            avg=Avg('current_percentage')
        )['avg']
        po_achievement = round(float(po_achievement), 1) if po_achievement else None
        
        # Determine status
        if po_achievement:
            if po_achievement >= 80:
                dept_status = 'excellent'
            elif po_achievement >= 70:
                dept_status = 'good'
            else:
                dept_status = 'needs-attention'
        else:
            dept_status = 'needs-attention'
        
        departments.append({
            'name': dept,
            'students': student_count,
            'courses': course_count,
            'faculty': faculty_count,
            'avg_grade': avg_grade,
            'po_achievement': po_achievement,
            'status': dept_status
        })
    
    # Sort by student count descending
    departments.sort(key=lambda x: x['students'], reverse=True)
    
    return Response({
        'success': True,
        'departments': departments
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_po_trends(request):
    """
    Get PO trends over time (by semester/academic year)
    
    GET /api/analytics/po-trends/
    Query params: ?semester=FALL&academic_year=2024-2025
    Returns PO achievement trends for chart visualization
    """
    user = request.user
    
    if user.role != User.Role.INSTITUTION and not user.is_staff:
        return Response({
            'error': 'This endpoint is only for institution admins'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get filter parameters
    semester = request.query_params.get('semester', None)
    academic_year = request.query_params.get('academic_year', None)
    
    # Get all active POs
    pos = ProgramOutcome.objects.filter(is_active=True)
    
    # Get courses based on filters
    courses_query = Course.objects.all()
    if semester:
        try:
            semester_int = int(semester)
            courses_query = courses_query.filter(semester=semester_int)
        except ValueError:
            pass
    if academic_year:
        courses_query = courses_query.filter(academic_year=academic_year)
    
    # Get enrollments for filtered courses
    enrollments = Enrollment.objects.filter(
        course__in=courses_query,
        final_grade__isnull=False
    ).select_related('course', 'student')
    
    # Get students from enrollments
    student_ids = list(enrollments.values_list('student_id', flat=True).distinct())
    
    # Calculate PO trends
    po_trends = []
    for po in pos:
        # Get PO achievements for students in filtered courses
        # If no student_ids, get all PO achievements for this PO
        if student_ids:
            po_achievements = StudentPOAchievement.objects.filter(
                program_outcome=po,
                student_id__in=student_ids
            )
        else:
            # If no filtered students, get all achievements for this PO
            po_achievements = StudentPOAchievement.objects.filter(
                program_outcome=po
            )
        
        avg_achievement = po_achievements.aggregate(
            avg=Avg('current_percentage')
        )['avg']
        avg_achievement = round(float(avg_achievement), 1) if avg_achievement is not None else None
        
        total_students = po_achievements.values('student').distinct().count()
        target_percentage_float = float(po.target_percentage)
        students_achieved = po_achievements.filter(
            current_percentage__gte=po.target_percentage
        ).values('student').distinct().count()
        
        achievement_rate = round((students_achieved / total_students * 100), 1) if total_students > 0 else 0
        
        # Determine status
        if avg_achievement is not None:
            if avg_achievement >= target_percentage_float * 1.1:
                po_status = 'excellent'
            elif avg_achievement >= target_percentage_float:
                po_status = 'achieved'
            else:
                po_status = 'not-achieved'
        else:
            po_status = 'not-achieved'
        
        po_trends.append({
            'code': po.code,
            'title': po.title,
            'target_percentage': target_percentage_float,
            'current_percentage': avg_achievement,
            'total_students': total_students,
            'students_achieved': students_achieved,
            'achievement_rate': achievement_rate,
            'status': po_status
        })
    
    return Response({
        'success': True,
        'program_outcomes': po_trends,
        'filters': {
            'semester': semester,
            'academic_year': academic_year
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_performance_distribution(request):
    """
    Get student performance distribution (histogram data)
    
    GET /api/analytics/performance-distribution/
    Query params: ?department=Computer Science
    Returns performance distribution for histogram chart
    """
    user = request.user
    
    if user.role != User.Role.INSTITUTION and not user.is_staff:
        return Response({
            'error': 'This endpoint is only for institution admins'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get filter parameters
    department = request.query_params.get('department', None)
    
    # Get enrollments with final grades
    enrollments_query = Enrollment.objects.filter(
        final_grade__isnull=False
    )
    
    # Filter by department if specified
    if department:
        dept_students = User.objects.filter(
            role=User.Role.STUDENT,
            is_active=True,
            department=department
        )
        enrollments_query = enrollments_query.filter(student__in=dept_students)
    
    enrollments = enrollments_query.select_related('student')
    
    # Calculate distribution (bins: 0-20, 21-40, 41-60, 61-80, 81-100)
    distribution = {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
    }
    
    for enrollment in enrollments:
        score = float(enrollment.final_grade)
        if score <= 20:
            distribution['0-20'] += 1
        elif score <= 40:
            distribution['21-40'] += 1
        elif score <= 60:
            distribution['41-60'] += 1
        elif score <= 80:
            distribution['61-80'] += 1
        else:
            distribution['81-100'] += 1
    
    # Calculate statistics
    scores = [float(e.final_grade) for e in enrollments]
    total_students = len(scores)
    
    stats = {
        'total_students': total_students,
        'average': round(sum(scores) / total_students, 1) if total_students > 0 else 0,
        'median': round(sorted(scores)[total_students // 2], 1) if total_students > 0 else 0,
        'min': round(min(scores), 1) if scores else 0,
        'max': round(max(scores), 1) if scores else 0
    }
    
    return Response({
        'success': True,
        'distribution': distribution,
        'statistics': stats,
        'filters': {
            'department': department
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_course_success(request):
    """
    Get course success rates
    
    GET /api/analytics/course-success/
    Query params: ?department=Computer Science&semester=FALL
    Returns course success rates for bar chart
    """
    user = request.user
    
    if user.role != User.Role.INSTITUTION and not user.is_staff:
        return Response({
            'error': 'This endpoint is only for institution admins'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get filter parameters
    department = request.query_params.get('department', None)
    semester = request.query_params.get('semester', None)
    academic_year = request.query_params.get('academic_year', None)
    
    # Get courses based on filters
    courses_query = Course.objects.all()
    if department:
        courses_query = courses_query.filter(department=department)
    if semester:
        try:
            semester_int = int(semester)
            courses_query = courses_query.filter(semester=semester_int)
        except ValueError:
            pass
    if academic_year:
        courses_query = courses_query.filter(academic_year=academic_year)
    
    courses = courses_query.select_related('teacher')
    
    course_success = []
    for course in courses:
        # Get all enrollments for this course
        enrollments = Enrollment.objects.filter(
            course=course,
            final_grade__isnull=False
        )
        
        total_students = enrollments.count()
        
        # Success rate: students with grade >= 60
        successful_students = enrollments.filter(final_grade__gte=60).count()
        success_rate = round((successful_students / total_students * 100), 1) if total_students > 0 else 0
        
        # Average grade
        avg_grade = enrollments.aggregate(avg=Avg('final_grade'))['avg']
        avg_grade = round(float(avg_grade), 1) if avg_grade else None
        
        course_success.append({
            'course_id': course.id,
            'course_code': course.code,
            'course_name': course.name,
            'department': course.department,
            'semester': course.get_semester_display(),
            'academic_year': course.academic_year,
            'instructor': course.teacher.get_full_name() if course.teacher else 'TBA',
            'total_students': total_students,
            'successful_students': successful_students,
            'success_rate': success_rate,
            'average_grade': avg_grade
        })
    
    # Sort by success rate descending
    course_success.sort(key=lambda x: x['success_rate'], reverse=True)
    
    return Response({
        'success': True,
        'courses': course_success,
        'filters': {
            'department': department,
            'semester': semester,
            'academic_year': academic_year
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_alerts(request):
    """
    Get recent alerts for institution dashboard
    
    GET /api/analytics/alerts/
    Returns alerts about PO achievements, departments, etc.
    """
    user = request.user
    
    if user.role != User.Role.INSTITUTION and not user.is_staff:
        return Response({
            'error': 'This endpoint is only for institution admins'
        }, status=status.HTTP_403_FORBIDDEN)
    
    alerts = []
    
    # Check for POs below target
    pos_below_target = ProgramOutcome.objects.filter(is_active=True).annotate(
        avg_achievement=Avg('student_achievements__current_percentage')
    ).filter(
        avg_achievement__lt=F('target_percentage')
    )
    
    for po in pos_below_target:
        avg = float(po.avg_achievement) if po.avg_achievement else 0
        target = float(po.target_percentage)
        alerts.append({
            'type': 'warning',
            'title': f'{po.code} Below Target',
            'description': f'Current: {avg:.1f}% (Target: {target:.1f}%)',
            'created_at': timezone.now().isoformat(),
            'time': 'Recently'
        })
    
    # Check for departments with low PO achievement
    department_list = User.objects.filter(
        role=User.Role.STUDENT,
        is_active=True,
        department__isnull=False
    ).values_list('department', flat=True).distinct()
    
    for dept in department_list[:3]:  # Limit to 3 departments
        dept_students = User.objects.filter(
            role=User.Role.STUDENT,
            is_active=True,
            department=dept
        )
        dept_po_achievements = StudentPOAchievement.objects.filter(
            student__in=dept_students
        )
        po_avg = dept_po_achievements.aggregate(avg=Avg('current_percentage'))['avg']
        
        if po_avg and po_avg < 70:
            alerts.append({
                'type': 'warning',
                'title': f'{dept} - Low PO Achievement',
                'description': f'Average PO achievement: {float(po_avg):.1f}%',
                'created_at': timezone.now().isoformat(),
                'time': 'Recently'
            })
    
    # Success alerts for departments exceeding targets
    for dept in department_list[:2]:  # Limit to 2
        dept_students = User.objects.filter(
            role=User.Role.STUDENT,
            is_active=True,
            department=dept
        )
        dept_po_achievements = StudentPOAchievement.objects.filter(
            student__in=dept_students
        )
        po_avg = dept_po_achievements.aggregate(avg=Avg('current_percentage'))['avg']
        
        if po_avg and po_avg >= 80:
            alerts.append({
                'type': 'success',
                'title': f'{dept} Exceeds All Targets',
                'description': f'All POs above target (Avg: {float(po_avg):.1f}%)',
                'created_at': timezone.now().isoformat(),
                'time': 'Recently'
            })
            break  # Only one success alert
    
    # Sort by created_at (most recent first) and limit to 5
    alerts = sorted(alerts, key=lambda x: x.get('created_at', ''), reverse=True)[:5]
    
    return Response({
        'success': True,
        'alerts': alerts
    })


# =============================================================================
# DEPARTMENT CURRICULUM VIEW
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def department_curriculum(request):
    """
    Get department curriculum organized by year of study
    
    GET /api/analytics/department-curriculum/?department=Computer Science
    Returns curriculum structure with courses organized by year and semester
    """
    user = request.user
    
    if user.role != User.Role.INSTITUTION and not user.is_staff:
        return Response({
            'error': 'This endpoint is only for institution admins'
        }, status=status.HTTP_403_FORBIDDEN)
    
    department = request.query_params.get('department', None)
    if not department:
        return Response({
            'error': 'Department parameter is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get all courses for this department
    courses = Course.objects.filter(department=department).select_related('teacher').order_by('code', 'academic_year')
    
    # Helper function to extract year of study from course code
    # Examples: CS101 -> 1, CS201 -> 2, CS301 -> 3, CS401 -> 4
    def extract_year_from_code(course_code):
        """Extract year of study from course code (assuming format like CS101, CS201, CS301, CS401, etc.)"""
        import re
        # Try to find a 3-digit number pattern (e.g., 101, 201, 301, 401)
        # This matches patterns like: CS101, CS201, CS301, CS401, MATH101, etc.
        match = re.search(r'(\d{3})', course_code)
        if match:
            code_number = int(match.group(1))
            # Extract the hundreds digit
            hundreds = code_number // 100
            # Course codes typically follow: 1xx = year 1, 2xx = year 2, 3xx = year 3, 4xx = year 4, 5xx = year 5, 6xx = year 6
            if 1 <= hundreds <= 6:
                return hundreds
        # Fallback: try to find any first digit
        match = re.search(r'(\d)', course_code)
        if match:
            first_digit = int(match.group(1))
            if 1 <= first_digit <= 6:
                return first_digit
        return 0  # Unknown year
    
    # Initialize all 6 years (1-6) with empty data (to support 2, 4, and 6 year programs)
    curriculum_by_year = {}
    for year in range(1, 7):
        curriculum_by_year[year] = {
            'year': year,
            'fall_semester': [],
            'spring_semester': [],
            'summer_semester': [],
            'total_credits_fall': 0,
            'total_credits_spring': 0,
            'total_credits_summer': 0,
        }
    
    # Group courses by year of study
    for course in courses:
        year = extract_year_from_code(course.code)
        if year == 0 or year > 6:
            continue  # Skip courses we can't categorize or beyond year 6
        
        # Get enrollment count for this course
        enrollment_count = Enrollment.objects.filter(
            course=course,
            is_active=True
        ).count()
        
        course_data = {
            'course_id': course.id,
            'course_code': course.code,
            'course_name': course.name,
            'credits': course.credits,
            'semester': course.get_semester_display(),
            'academic_year': course.academic_year,
            'teacher': course.teacher.get_full_name() if course.teacher else 'TBA',
            'enrollment_count': enrollment_count,
            'description': course.description or '',
        }
        
        # Add to appropriate semester
        if course.semester == Course.Semester.FALL:
            curriculum_by_year[year]['fall_semester'].append(course_data)
            curriculum_by_year[year]['total_credits_fall'] += course.credits
        elif course.semester == Course.Semester.SPRING:
            curriculum_by_year[year]['spring_semester'].append(course_data)
            curriculum_by_year[year]['total_credits_spring'] += course.credits
        elif course.semester == Course.Semester.SUMMER:
            curriculum_by_year[year]['summer_semester'].append(course_data)
            curriculum_by_year[year]['total_credits_summer'] += course.credits
    
    # Convert to list and sort by year (should already be sorted 1-4)
    curriculum_list = sorted(curriculum_by_year.values(), key=lambda x: x['year'])
    
    # Calculate totals
    total_credits = sum(
        year_data['total_credits_fall'] + 
        year_data['total_credits_spring'] + 
        year_data['total_credits_summer']
        for year_data in curriculum_list
    )
    
    return Response({
        'success': True,
        'department': department,
        'curriculum': curriculum_list,
        'total_credits': total_credits,
        'total_years': len(curriculum_list),
    })


# =============================================================================
# STUDENT LO ACHIEVEMENT VIEWSET
# =============================================================================

class StudentLOAchievementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Student LO Achievement model
    Endpoints: /api/lo-achievements/
    """
    queryset = StudentLOAchievement.objects.all()
    serializer_class = StudentLOAchievementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['student__username', 'student__student_id', 
                     'learning_outcome__code', 'learning_outcome__title',
                     'learning_outcome__course__code']
    ordering_fields = ['last_calculated', 'current_percentage']
    ordering = ['-last_calculated']
    
    def get_queryset(self):
        """Filter based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role == User.Role.STUDENT:
            # Students can only see their own LO achievements
            return queryset.filter(student=user)
        elif user.role == User.Role.TEACHER:
            # Teachers can see LO achievements for their courses
            teacher_courses = Course.objects.filter(teacher=user)
            return queryset.filter(learning_outcome__course__in=teacher_courses)
        elif user.role == User.Role.INSTITUTION:
            # Institution can see all
            return queryset
        
        return queryset.none()
    
    @action(detail=False, methods=['get'])
    def by_student(self, request):
        """Get LO achievements by student"""
        student_id = request.query_params.get('student_id', None)
        if not student_id:
            return Response({'error': 'student_id parameter required'}, status=400)
        
        # Check permission
        if hasattr(request.user, 'role') and request.user.role == User.Role.STUDENT and str(request.user.id) != student_id:
            raise PermissionDenied("You can only view your own LO achievements")
        
        achievements = self.get_queryset().filter(student_id=student_id)
        serializer = self.get_serializer(achievements, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_course(self, request):
        """Get LO achievements by course"""
        course_id = request.query_params.get('course_id', None)
        if not course_id:
            return Response({'error': 'course_id parameter required'}, status=400)
        
        # Check if teacher has access to this course
        if hasattr(request.user, 'role') and request.user.role == User.Role.TEACHER:
            course = get_object_or_404(Course, id=course_id)
            if course.teacher != request.user:
                raise PermissionDenied("You can only view LO achievements for your own courses")
        
        achievements = self.get_queryset().filter(learning_outcome__course_id=course_id)
        serializer = self.get_serializer(achievements, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_learning_outcome(self, request):
        """Get LO achievements by learning outcome"""
        lo_id = request.query_params.get('lo_id', None)
        if not lo_id:
            return Response({'error': 'lo_id parameter required'}, status=400)
        
        achievements = self.get_queryset().filter(learning_outcome_id=lo_id)
        serializer = self.get_serializer(achievements, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary statistics for LO achievements"""
        queryset = self.get_queryset()
        
        total_achievements = queryset.count()
        targets_met = queryset.filter(
            current_percentage__gte=F('learning_outcome__target_percentage')
        ).count()
        
        avg_percentage = queryset.aggregate(
            avg=Avg('current_percentage')
        )['avg'] or 0
        
        avg_completion = queryset.aggregate(
            avg=Avg('completion_rate')
        )['avg'] or 0
        
        return Response({
            'total_achievements': total_achievements,
            'targets_met': targets_met,
            'targets_not_met': total_achievements - targets_met,
            'average_percentage': round(avg_percentage, 2),
            'average_completion_rate': round(avg_completion, 2),
            'success_rate': round((targets_met / total_achievements * 100) if total_achievements > 0 else 0, 2)
        })


class AssessmentLOViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Assessment-LO mapping CRUD operations
    Teachers can manage which assessments contribute to which LOs and their weights
    
    Query Parameters:
    - courseId: Filter by course ID
    - assessment: Filter by assessment ID
    - learning_outcome: Filter by learning outcome ID
    """
    queryset = AssessmentLO.objects.all()
    serializer_class = AssessmentLOSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['assessment__title', 'learning_outcome__code', 'learning_outcome__title']
    ordering_fields = ['weight', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter by teacher's courses and optional query parameters"""
        user = self.request.user
        queryset = AssessmentLO.objects.all()
        
        # Filter by course if courseId parameter is provided
        course_id = self.request.query_params.get('courseId') or self.request.query_params.get('course')
        if course_id:
            try:
                queryset = queryset.filter(assessment__course_id=int(course_id))
            except (ValueError, TypeError):
                pass  # Invalid courseId, ignore it
        
        # Filter by assessment if provided
        assessment_id = self.request.query_params.get('assessment')
        if assessment_id:
            try:
                queryset = queryset.filter(assessment_id=int(assessment_id))
            except (ValueError, TypeError):
                pass
        
        # Filter by learning outcome if provided
        learning_outcome_id = self.request.query_params.get('learning_outcome')
        if learning_outcome_id:
            try:
                queryset = queryset.filter(learning_outcome_id=int(learning_outcome_id))
            except (ValueError, TypeError):
                pass
        
        # Apply role-based filtering
        if user.role == User.Role.TEACHER:
            # Only show AssessmentLOs for assessments in teacher's courses
            queryset = queryset.filter(assessment__course__teacher=user)
        elif user.role == User.Role.STUDENT:
            # Students can only view AssessmentLOs for their enrolled courses
            queryset = queryset.filter(assessment__course__enrollments__student=user)
        elif user.role == User.Role.INSTITUTION:
            # Institution can view all AssessmentLOs in their institution
            institution = get_institution_for_user(user)
            if institution:
                queryset = queryset.filter(assessment__course__department__institution=institution)
        
        return queryset.distinct()
    
    def perform_create(self, serializer):
        """Only allow teachers to create AssessmentLO mappings for their courses
        
        Validates that:
        - User is a teacher
        - Assessment belongs to teacher's course
        - Optional courseId matches assessment's course (for frontend validation)
        """
        user = self.request.user
        if user.role != User.Role.TEACHER:
            raise PermissionDenied("Only teachers can create Assessment-LO mappings")
        
        assessment = serializer.validated_data['assessment']
        
        # Validate that assessment belongs to teacher's course
        if assessment.course.teacher != user:
            raise PermissionDenied("You can only create mappings for assessments in your courses")
        
        # Optional: Validate courseId if provided in request data
        request_data = self.request.data
        if 'courseId' in request_data or 'course_id' in request_data:
            course_id = request_data.get('courseId') or request_data.get('course_id')
            try:
                if int(course_id) != assessment.course.id:
                    raise PermissionDenied("courseId does not match the assessment's course")
            except (ValueError, TypeError):
                pass  # Invalid courseId format, ignore it
        
        serializer.save()


class LOPOViewSet(viewsets.ModelViewSet):
    """
    ViewSet for LO-PO mapping CRUD operations
    Teachers can manage which LOs contribute to which POs and their weights
    
    Query Parameters:
    - courseId: Filter by course ID
    - learning_outcome: Filter by learning outcome ID
    - program_outcome: Filter by program outcome ID
    """
    queryset = LOPO.objects.all()
    serializer_class = LOPOSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['learning_outcome__code', 'learning_outcome__title', 'program_outcome__code', 'program_outcome__title']
    ordering_fields = ['weight', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter by teacher's courses and optional query parameters"""
        user = self.request.user
        queryset = LOPO.objects.all()
        
        # Filter by course if courseId parameter is provided
        course_id = self.request.query_params.get('courseId') or self.request.query_params.get('course')
        if course_id:
            try:
                queryset = queryset.filter(learning_outcome__course_id=int(course_id))
            except (ValueError, TypeError):
                pass  # Invalid courseId, ignore it
        
        # Filter by learning outcome if provided
        learning_outcome_id = self.request.query_params.get('learning_outcome')
        if learning_outcome_id:
            try:
                queryset = queryset.filter(learning_outcome_id=int(learning_outcome_id))
            except (ValueError, TypeError):
                pass
        
        # Filter by program outcome if provided
        program_outcome_id = self.request.query_params.get('program_outcome')
        if program_outcome_id:
            try:
                queryset = queryset.filter(program_outcome_id=int(program_outcome_id))
            except (ValueError, TypeError):
                pass
        
        # Apply role-based filtering
        if user.role == User.Role.TEACHER:
            # Only show LOPOs for LOs in teacher's courses
            queryset = queryset.filter(learning_outcome__course__teacher=user)
        elif user.role == User.Role.STUDENT:
            # Students can only view LOPOs for their enrolled courses
            queryset = queryset.filter(learning_outcome__course__enrollments__student=user)
        elif user.role == User.Role.INSTITUTION:
            # Institution can view all LOPOs in their institution
            institution = get_institution_for_user(user)
            if institution:
                queryset = queryset.filter(learning_outcome__course__department__institution=institution)
        
        return queryset.distinct()
    
    def perform_create(self, serializer):
        """Only allow teachers to create LOPO mappings for their courses
        
        Validates that:
        - User is a teacher
        - Learning outcome belongs to teacher's course
        - Optional courseId matches LO's course (for frontend validation)
        """
        user = self.request.user
        if user.role != User.Role.TEACHER:
            raise PermissionDenied("Only teachers can create LO-PO mappings")
        
        learning_outcome = serializer.validated_data['learning_outcome']
        
        # Validate that learning outcome belongs to teacher's course
        if learning_outcome.course.teacher != user:
            raise PermissionDenied("You can only create mappings for LOs in your courses")
        
        # Optional: Validate courseId if provided in request data
        request_data = self.request.data
        if 'courseId' in request_data or 'course_id' in request_data:
            course_id = request_data.get('courseId') or request_data.get('course_id')
            try:
                if int(course_id) != learning_outcome.course.id:
                    raise PermissionDenied("courseId does not match the learning outcome's course")
            except (ValueError, TypeError):
                pass  # Invalid courseId format, ignore it
        
        serializer.save()
