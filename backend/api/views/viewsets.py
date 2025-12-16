"""VIEWSETS Module - All ModelViewSet classes

All database write operations use transactions to ensure data consistency.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q, Avg, Count, F, Min, Max, StdDev
from django.db import transaction
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
        # Optimize: select_related for foreign keys, prefetch_related for reverse relations
        # Note: 'department' is a CharField, not a ForeignKey, so it cannot be used in select_related
        queryset = User.objects.select_related('created_by').all()
        
        # CRITICAL: ALWAYS exclude super admin from ANY role filter
        # Super admin is NOT a student, teacher, or institution - it's a separate role
        queryset = queryset.exclude(is_superuser=True)
        
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
        
        if len(new_password) < 10:
            return Response({
                'success': False,
                'error': 'New password must be at least 10 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Only check old password if user doesn't have temporary password
        if not has_temporary_password:
            if not old_password:
                return Response({
                    'success': False,
                    'error': 'Current password is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not user.check_password(old_password):
                from ..utils import log_security_event, get_client_ip
                log_security_event(
                    event_type='failed_password_change',
                    user=user,
                    ip_address=get_client_ip(request),
                    details={'reason': 'incorrect_old_password'},
                    severity='WARNING'
                )
                return Response({
                    'success': False,
                    'error': 'Current password is incorrect'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # SECURITY: Check password history (prevent reuse of last 5 passwords)
        if user.check_password_history(new_password):
            return Response({
                'success': False,
                'error': 'You cannot reuse a recently used password. Please choose a different password.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            user.set_password(new_password)
            # If the user had a temporary password, mark it as no longer temporary
            if hasattr(user, "is_temporary_password"):
                user.is_temporary_password = False
            user.save()
        
        # SECURITY: Log password change
        from ..utils import log_security_event, get_client_ip
        log_security_event(
            event_type='password_changed',
            user=user,
            ip_address=get_client_ip(request),
            severity='INFO'
        )
        
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
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Only INSTITUTION can create departments. Uses transaction for atomicity."""
        if not hasattr(request.user, 'role') or (request.user.role != User.Role.INSTITUTION and not request.user.is_staff):
            return Response({
                'error': 'Only institution administrators can create departments'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """Only INSTITUTION can update departments. Uses transaction for atomicity."""
        if not hasattr(request.user, 'role') or (request.user.role != User.Role.INSTITUTION and not request.user.is_staff):
            return Response({
                'error': 'Only institution administrators can update departments'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """Only INSTITUTION can delete departments. Uses transaction for atomicity."""
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
        # Optimize: select_related for teacher to avoid N+1 queries
        # Note: 'department' is a CharField, not a ForeignKey, so it cannot be used in select_related
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
        # Optimize: select_related for all foreign keys to avoid N+1 queries
        # Note: 'department' fields are CharFields, not ForeignKeys, so they cannot be used in select_related
        queryset = Enrollment.objects.select_related('student', 'course', 'course__teacher')
        
        # CRITICAL: ALWAYS exclude super admin from enrollments
        # Super admin is NOT a student and should NEVER appear in enrollments
        queryset = queryset.exclude(student__is_superuser=True)
        
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
        # Optimize: select_related for course and course__teacher to avoid N+1 queries
        # Note: 'department' is a CharField, not a ForeignKey, so it cannot be used in select_related
        queryset = Assessment.objects.select_related('course', 'course__teacher')
        
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
        # Optimize: select_related for foreign keys
        grades = StudentGrade.objects.select_related('student', 'assessment').filter(assessment=assessment)
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
        # Optimize: select_related for all foreign keys to avoid N+1 queries
        # Note: 'department' fields are CharFields, not ForeignKeys, so they cannot be used in select_related
        queryset = StudentGrade.objects.select_related(
            'student',
            'assessment', 'assessment__course', 'assessment__course__teacher'
        )
        
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
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):  # type: ignore[override]
        """Override create to log activity. Uses transaction for atomicity."""
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
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):  # type: ignore[override]
        """Override update to log activity. Uses transaction for atomicity."""
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
        
        # CRITICAL: ALWAYS exclude super admin from PO achievements
        # Super admin is NOT a student and should NEVER appear in achievements
        queryset = queryset.exclude(student__is_superuser=True)
        
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
        queryset = queryset.select_related('student', 'learning_outcome', 'learning_outcome__course')
        
        # CRITICAL: ALWAYS exclude super admin from LO achievements
        # Super admin is NOT a student and should NEVER appear in achievements
        queryset = queryset.exclude(student__is_superuser=True)
        
        # Filter by course if specified
        course_id = self.request.query_params.get('course', None)
        if course_id:
            try:
                course_id_int = int(course_id)
                queryset = queryset.filter(learning_outcome__course_id=course_id_int)
            except (ValueError, TypeError):
                pass
        
        # Filter by student if specified
        student_id = self.request.query_params.get('student', None)
        if student_id:
            try:
                student_id_int = int(student_id)
                queryset = queryset.filter(student_id=student_id_int)
            except (ValueError, TypeError):
                pass
        
        # Filter by learning_outcome if specified
        learning_outcome_id = self.request.query_params.get('learning_outcome', None)
        if learning_outcome_id:
            try:
                lo_id_int = int(learning_outcome_id)
                queryset = queryset.filter(learning_outcome_id=lo_id_int)
            except (ValueError, TypeError):
                pass
        
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
