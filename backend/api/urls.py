"""
AcuRate - API URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    # Auth views
    login_view, logout_view, current_user_view, register_view, create_teacher_view, forgot_password_view, forgot_username_view,
    # Dashboard views
    student_dashboard, teacher_dashboard, institution_dashboard, super_admin_dashboard,
    # Super Admin views
    super_admin_institutions, super_admin_activity_logs, create_institution, delete_institution,
    # Course Analytics views
    course_analytics_overview, course_analytics_detail,
    # Institution Analytics views
    analytics_departments, analytics_po_trends,
    analytics_performance_distribution, analytics_course_success, analytics_alerts,
    department_curriculum,
    # Contact views
    create_contact_request,
    # ViewSets
    DepartmentViewSet, UserViewSet, ProgramOutcomeViewSet, LearningOutcomeViewSet, CourseViewSet,
    EnrollmentViewSet, AssessmentViewSet, StudentGradeViewSet,
    StudentPOAchievementViewSet, StudentLOAchievementViewSet, ContactRequestViewSet,
    AssessmentLOViewSet, LOPOViewSet
)
from .views_file_upload import upload_profile_picture, upload_file
from .views_bulk_operations import bulk_import_students, bulk_export_grades, bulk_import_grades

# Create router for ViewSets
router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'users', UserViewSet, basename='user')
router.register(r'program-outcomes', ProgramOutcomeViewSet, basename='programoutcome')
router.register(r'learning-outcomes', LearningOutcomeViewSet, basename='learningoutcome')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'assessments', AssessmentViewSet, basename='assessment')
router.register(r'grades', StudentGradeViewSet, basename='grade')
router.register(r'po-achievements', StudentPOAchievementViewSet, basename='poachievement')
router.register(r'lo-achievements', StudentLOAchievementViewSet, basename='loachievement')
router.register(r'contact-requests', ContactRequestViewSet, basename='contactrequest')
router.register(r'assessment-los', AssessmentLOViewSet, basename='assessmentlo')
router.register(r'lo-pos', LOPOViewSet, basename='lopo')

app_name = 'api'

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/register/', register_view, name='register'),
    path('auth/forgot-password/', forgot_password_view, name='forgot-password'),
    path('auth/forgot-username/', forgot_username_view, name='forgot-username'),
    path('auth/me/', current_user_view, name='current-user'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('teachers/', create_teacher_view, name='create-teacher'),
    
    # Dashboard endpoints
    path('dashboard/student/', student_dashboard, name='student-dashboard'),
    path('dashboard/teacher/', teacher_dashboard, name='teacher-dashboard'),
    path('dashboard/institution/', institution_dashboard, name='institution-dashboard'),
    path('dashboard/super-admin/', super_admin_dashboard, name='super-admin-dashboard'),
    
    # Super Admin endpoints
    path('super-admin/institutions/', super_admin_institutions, name='super-admin-institutions'),
    path('super-admin/institutions/create/', create_institution, name='create-institution'),
    path('super-admin/institutions/<int:institution_id>/', delete_institution, name='delete-institution'),
    path('super-admin/activity-logs/', super_admin_activity_logs, name='super-admin-activity-logs'),
    
    # Course Analytics endpoints
    path('course-analytics/', course_analytics_overview, name='course-analytics-overview'),
    path('course-analytics/<int:course_id>/', course_analytics_detail, name='course-analytics-detail'),
    
    # Institution Analytics endpoints
    path('analytics/departments/', analytics_departments, name='analytics-departments'),
    path('analytics/department-curriculum/', department_curriculum, name='department-curriculum'),
    path('analytics/po-trends/', analytics_po_trends, name='analytics-po-trends'),
    path('analytics/performance-distribution/', analytics_performance_distribution, name='analytics-performance-distribution'),
    path('analytics/course-success/', analytics_course_success, name='analytics-course-success'),
    path('analytics/alerts/', analytics_alerts, name='analytics-alerts'),
    
    # Contact endpoints
    path('contact/', create_contact_request, name='create-contact-request'),
    
    # File Upload endpoints
    path('files/upload/profile-picture/', upload_profile_picture, name='upload-profile-picture'),
    path('files/upload/', upload_file, name='upload-file'),
    
    # Bulk Operations endpoints
    path('bulk/import/students/', bulk_import_students, name='bulk-import-students'),
    path('bulk/import/grades/', bulk_import_grades, name='bulk-import-grades'),
    path('bulk/export/grades/', bulk_export_grades, name='bulk-export-grades'),
    
    # Router URLs (CRUD endpoints)
    path('', include(router.urls)),
]

