"""
AcuRate - API Views
REST API endpoints for the AcuRate system
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q, Avg, Count, F
from django.shortcuts import get_object_or_404

from .models import (
    User, ProgramOutcome, Course, CoursePO,
    Enrollment, Assessment, StudentGrade, StudentPOAchievement
)
from .serializers import (
    UserSerializer, UserDetailSerializer, UserCreateSerializer, LoginSerializer,
    ProgramOutcomeSerializer, ProgramOutcomeStatsSerializer,
    CourseSerializer, CourseDetailSerializer,
    EnrollmentSerializer, AssessmentSerializer,
    StudentGradeSerializer, StudentGradeDetailSerializer,
    StudentPOAchievementSerializer, StudentPOAchievementDetailSerializer,
    StudentDashboardSerializer, TeacherDashboardSerializer, InstitutionDashboardSerializer
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
    
    return Response({
        'success': False,
        'errors': serializer.errors
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
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


# =============================================================================
# PROGRAM OUTCOME VIEWSET
# =============================================================================

class ProgramOutcomeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ProgramOutcome CRUD operations
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
    ordering_fields = ['code', 'semester', 'year', 'created_at']
    ordering = ['code']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer
    
    def get_queryset(self):
        """Filter courses based on user role"""
        user = self.request.user
        queryset = Course.objects.all()
        
        # Filter by teacher
        if user.role == User.Role.TEACHER:
            queryset = queryset.filter(teacher=user)
        
        # Filter by semester/year if specified
        semester = self.request.query_params.get('semester', None)
        year = self.request.query_params.get('year', None)
        
        if semester:
            queryset = queryset.filter(semester=semester)
        if year:
            queryset = queryset.filter(year=year)
        
        # Only active courses for non-admin
        if not user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Get all students enrolled in this course"""
        course = self.get_object()
        enrollments = Enrollment.objects.filter(
            course=course,
            status=Enrollment.Status.ENROLLED
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
    ordering_fields = ['enrollment_date', 'final_grade']
    ordering = ['-enrollment_date']
    
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
                status=Enrollment.Status.ENROLLED
            ).values_list('course_id', flat=True)
            queryset = queryset.filter(course_id__in=enrolled_courses)
        
        # Filter by course if specified
        course_id = self.request.query_params.get('course', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset
    
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
        queryset = StudentGrade.objects.select_related('student', 'assessment', 'graded_by')
        
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
    
    def perform_create(self, serializer):
        """Set graded_by to current user"""
        serializer.save(graded_by=self.request.user)


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
    ordering_fields = ['achievement_percentage', 'year', 'semester']
    ordering = ['-year', '-semester']
    
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
        status=Enrollment.Status.ENROLLED
    ).select_related('course')
    
    # Get PO achievements
    po_achievements = StudentPOAchievement.objects.filter(
        student=user
    ).select_related('program_outcome')
    
    # Get recent grades
    recent_grades = StudentGrade.objects.filter(
        student=user
    ).select_related('assessment', 'graded_by').order_by('-graded_at')[:10]
    
    # Calculate GPA and stats
    completed_enrollments = Enrollment.objects.filter(
        student=user,
        status=Enrollment.Status.COMPLETED,
        final_grade__isnull=False
    )
    
    total_credits = sum([e.course.credits for e in enrollments])
    completed_courses = completed_enrollments.count()
    
    if completed_enrollments.exists():
        overall_gpa = completed_enrollments.aggregate(Avg('final_grade'))['final_grade__avg'] or 0
    else:
        overall_gpa = 0
    
    data = {
        'student': user,
        'enrollments': enrollments,
        'po_achievements': po_achievements,
        'recent_grades': recent_grades,
        'overall_gpa': round(overall_gpa, 2),
        'total_credits': total_credits,
        'completed_courses': completed_courses
    }
    
    serializer = StudentDashboardSerializer(data)
    return Response(serializer.data)


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
    
    # Get teacher's courses
    courses = Course.objects.filter(
        teacher=user,
        is_active=True
    ).prefetch_related('enrollment_set')
    
    # Calculate total students
    total_students = Enrollment.objects.filter(
        course__teacher=user,
        status=Enrollment.Status.ENROLLED
    ).values('student').distinct().count()
    
    # Pending assessments (assessments with no grades yet)
    pending_assessments = Assessment.objects.filter(
        course__teacher=user
    ).annotate(
        grade_count=Count('studentgrade')
    ).filter(grade_count=0).count()
    
    # Recent submissions
    recent_submissions = StudentGrade.objects.filter(
        assessment__course__teacher=user
    ).select_related('student', 'assessment').order_by('-graded_at')[:10]
    
    data = {
        'teacher': user,
        'courses': courses,
        'total_students': total_students,
        'pending_assessments': pending_assessments,
        'recent_submissions': recent_submissions
    }
    
    serializer = TeacherDashboardSerializer(data)
    return Response(serializer.data)


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
    total_courses = Course.objects.filter(is_active=True).count()
    active_enrollments = Enrollment.objects.filter(status=Enrollment.Status.ENROLLED).count()
    
    # PO achievements statistics
    po_achievements = ProgramOutcome.objects.filter(is_active=True).annotate(
        total_students=Count('studentpoachievement__student', distinct=True),
        students_achieved=Count(
            'studentpoachievement',
            filter=Q(studentpoachievement__achievement_percentage__gte=F('target_percentage')),
            distinct=True
        ),
        average_achievement=Avg('studentpoachievement__achievement_percentage')
    )
    
    # Department statistics
    department_stats = User.objects.filter(
        role=User.Role.STUDENT,
        is_active=True,
        department__isnull=False
    ).values('department').annotate(
        student_count=Count('id')
    ).order_by('-student_count')
    
    data = {
        'total_students': total_students,
        'total_teachers': total_teachers,
        'total_courses': total_courses,
        'active_enrollments': active_enrollments,
        'po_achievements': po_achievements,
        'department_stats': list(department_stats)
    }
    
    serializer = InstitutionDashboardSerializer(data)
    return Response(serializer.data)
