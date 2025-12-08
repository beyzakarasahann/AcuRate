"""DASHBOARDS Views Module"""

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
    
    # Get PO achievements for students in teacher's courses (aggregated by PO)
    # Get all students enrolled in teacher's courses
    enrolled_student_ids = Enrollment.objects.filter(
        course__teacher=user,
        is_active=True
    ).values_list('student_id', flat=True).distinct()
    
    # Get PO achievements for these students (aggregated by PO)
    po_achievements_data = []
    
    # Get all active POs for teacher's department
    teacher_dept = user.department
    if teacher_dept:
        program_outcomes = ProgramOutcome.objects.filter(
            department=teacher_dept,
            is_active=True
        )
        
        for po in program_outcomes:
            # Get average achievement for this PO across all teacher's students
            po_achievements = StudentPOAchievement.objects.filter(
                program_outcome=po,
                student_id__in=enrolled_student_ids
            )
            
            if po_achievements.exists():
                avg_achievement = po_achievements.aggregate(
                    avg=Avg('current_percentage')
                )['avg']
                
                po_achievements_data.append({
                    'po_code': po.code,
                    'po_title': po.title,
                    'achievement_percentage': round(float(avg_achievement), 2) if avg_achievement else 0,
                    'target_percentage': float(po.target_percentage),
                    'total_students': po_achievements.values('student').distinct().count(),
                    'students_achieved': po_achievements.filter(
                        current_percentage__gte=po.target_percentage
                    ).values('student').distinct().count()
                })
    
    # Calculate PO achievement per course for better frontend display
    courses_with_po = []
    for course in courses:
        # Get students enrolled in this course
        course_student_ids = Enrollment.objects.filter(
            course=course,
            is_active=True
        ).values_list('student_id', flat=True).distinct()
        
        # Calculate average PO achievement for this course's students
        course_po_avg = 0
        if course_student_ids and po_achievements_data:
            # Get PO achievements for students in this course
            course_po_achievements = StudentPOAchievement.objects.filter(
                student_id__in=course_student_ids,
                program_outcome__department=teacher_dept
            ) if teacher_dept else StudentPOAchievement.objects.none()
            
            if course_po_achievements.exists():
                course_avg = course_po_achievements.aggregate(
                    avg=Avg('current_percentage')
                )['avg']
                course_po_avg = round(float(course_avg), 2) if course_avg else 0
        
        courses_with_po.append({
            'course_id': course.id,
            'avg_po_achievement': course_po_avg
        })
    
    # Serialize data manually (like student_dashboard)
    # Add PO achievement to each course
    courses_data = []
    for course in courses:
        course_data = CourseDetailSerializer(course).data
        # Find PO achievement for this course
        course_po_info = next((c for c in courses_with_po if c['course_id'] == course.id), None)
        if course_po_info:
            course_data['avg_po_achievement'] = course_po_info['avg_po_achievement']
        courses_data.append(course_data)
    
    serializer_data = {
        'teacher': UserDetailSerializer(user).data,
        'courses': courses_data,
        'total_students': total_students,
        'pending_assessments': pending_assessments,
        'recent_submissions': [StudentGradeSerializer(submission).data for submission in recent_submissions],
        'po_achievements': po_achievements_data
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
