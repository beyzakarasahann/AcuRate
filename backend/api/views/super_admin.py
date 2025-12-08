"""SUPER ADMIN Views Module"""

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
