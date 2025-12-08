"""ANALYTICS Views Module"""

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
