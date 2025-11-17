"""
AcuRate - API URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    # Auth views
    login_view, logout_view, current_user_view, register_view,
    # Dashboard views
    student_dashboard, teacher_dashboard, institution_dashboard,
    # Course Analytics views
    course_analytics_overview, course_analytics_detail,
    # Contact views
    create_contact_request,
    # ViewSets
    UserViewSet, ProgramOutcomeViewSet, CourseViewSet,
    EnrollmentViewSet, AssessmentViewSet, StudentGradeViewSet,
    StudentPOAchievementViewSet, ContactRequestViewSet
)

# Create router for ViewSets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'program-outcomes', ProgramOutcomeViewSet, basename='programoutcome')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'assessments', AssessmentViewSet, basename='assessment')
router.register(r'grades', StudentGradeViewSet, basename='grade')
router.register(r'po-achievements', StudentPOAchievementViewSet, basename='poachievement')
router.register(r'contact-requests', ContactRequestViewSet, basename='contactrequest')

app_name = 'api'

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/register/', register_view, name='register'),
    path('auth/me/', current_user_view, name='current-user'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Dashboard endpoints
    path('dashboard/student/', student_dashboard, name='student-dashboard'),
    path('dashboard/teacher/', teacher_dashboard, name='teacher-dashboard'),
    path('dashboard/institution/', institution_dashboard, name='institution-dashboard'),
    
    # Course Analytics endpoints
    path('course-analytics/', course_analytics_overview, name='course-analytics-overview'),
    path('course-analytics/<int:course_id>/', course_analytics_detail, name='course-analytics-detail'),
    
    # Contact endpoints
    path('contact/', create_contact_request, name='create-contact-request'),
    
    # Router URLs (CRUD endpoints)
    path('', include(router.urls)),
]

