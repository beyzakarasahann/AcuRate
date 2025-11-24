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

from .models import (
    User, ProgramOutcome, Course, CoursePO,
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    ContactRequest, LearningOutcome
)
from .serializers import (
    UserSerializer, UserDetailSerializer, UserCreateSerializer, LoginSerializer,
    ProgramOutcomeSerializer, ProgramOutcomeStatsSerializer,
    LearningOutcomeSerializer,
    CourseSerializer, CourseDetailSerializer,
    EnrollmentSerializer, AssessmentSerializer,
    StudentGradeSerializer, StudentGradeDetailSerializer,
    StudentPOAchievementSerializer, StudentPOAchievementDetailSerializer,
    StudentDashboardSerializer, TeacherDashboardSerializer, InstitutionDashboardSerializer,
    ContactRequestSerializer, ContactRequestCreateSerializer
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
        
        if not old_password or not new_password or not new_password_confirm:
            return Response({
                'success': False,
                'error': 'All password fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != new_password_confirm:
            return Response({
                'success': False,
                'error': 'New passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(old_password):
            return Response({
                'success': False,
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({
                'success': False,
                'error': 'New password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'success': True,
            'message': 'Password changed successfully'
        })


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
        """Filter active POs for non-admin users"""
        queryset = ProgramOutcome.objects.all()
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        return queryset
    
    def get_permissions(self):
        """Only allow INSTITUTION role to create/update/delete POs"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Check if user is INSTITUTION or staff
            if self.request.user.role != User.Role.INSTITUTION and not self.request.user.is_staff:
                return [IsAdminUser()]  # This will deny access
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """Only INSTITUTION can create POs"""
        if request.user.role != User.Role.INSTITUTION and not request.user.is_staff:
            return Response({
                'error': 'Only institution administrators can create Program Outcomes'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Only INSTITUTION can update POs"""
        if request.user.role != User.Role.INSTITUTION and not request.user.is_staff:
            return Response({
                'error': 'Only institution administrators can update Program Outcomes'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only INSTITUTION can delete POs"""
        if request.user.role != User.Role.INSTITUTION and not request.user.is_staff:
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
        if user.role == User.Role.TEACHER:
            queryset = queryset.filter(teacher=user)
        
        # Filter by semester/academic_year if specified
        semester = self.request.query_params.get('semester', None)
        academic_year = self.request.query_params.get('academic_year', None)
        
        if semester:
            queryset = queryset.filter(semester=semester)
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        
        return queryset
    
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
def student_dashboard(request):
    """
    Student dashboard with all relevant data
    
    GET /api/dashboard/student/
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
def teacher_dashboard(request):
    """
    Teacher dashboard with course and student data
    
    GET /api/dashboard/teacher/
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
def institution_dashboard(request):
    """
    Institution dashboard with overall statistics
    
    GET /api/dashboard/institution/
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
    
    # Department statistics
    department_stats = User.objects.filter(
        role=User.Role.STUDENT,
        is_active=True,
        department__isnull=False
    ).values('department').annotate(
        student_count=Count('id')
    ).order_by('-student_count')
    
    # Serialize PO achievements
    po_achievements_data = ProgramOutcomeStatsSerializer(po_achievements, many=True).data
    
    data = {
        'total_students': total_students,
        'total_teachers': total_teachers,
        'total_courses': total_courses,
        'active_enrollments': active_enrollments,
        'po_achievements': po_achievements_data,
        'department_stats': list(department_stats)
    }
    
    serializer = InstitutionDashboardSerializer(data=data)
    if serializer.is_valid():
        return Response(serializer.validated_data)
    else:
        # If validation fails, return data directly
        return Response(data)


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
    
    def list(self, request, *args, **kwargs):
        """Override list to ensure proper response format"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


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
        
        # Only staff/admin can view all requests
        if not user.is_staff:
            return ContactRequest.objects.none()
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            return ContactRequest.objects.filter(status=status_filter)
        
        return ContactRequest.objects.all()
    
    def get_permissions(self):
        """Only allow staff/admin to access"""
        # Public create is handled by create_contact_request view
        # This ViewSet is only for admin CRUD operations
        return [IsAdminUser()]


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
