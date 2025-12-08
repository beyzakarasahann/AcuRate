"""DASHBOARD Serializers Module"""

from rest_framework import serializers
from .user import UserDetailSerializer
from .course import EnrollmentSerializer, CourseDetailSerializer
from .achievement import StudentPOAchievementSerializer
from .assessment import StudentGradeSerializer


# =============================================================================
# DASHBOARD SERIALIZERS
# =============================================================================

class StudentDashboardSerializer(serializers.Serializer):
    """Serializer for student dashboard data"""
    student = UserDetailSerializer()
    enrollments = EnrollmentSerializer(many=True)
    po_achievements = StudentPOAchievementSerializer(many=True)
    recent_grades = StudentGradeSerializer(many=True)
    overall_gpa = serializers.FloatField()
    total_credits = serializers.IntegerField()
    completed_courses = serializers.IntegerField()
    gpa_ranking = serializers.DictField(required=False, allow_null=True)


class TeacherDashboardSerializer(serializers.Serializer):
    """Serializer for teacher dashboard data"""
    teacher = UserDetailSerializer()
    courses = CourseDetailSerializer(many=True)
    total_students = serializers.IntegerField()
    pending_assessments = serializers.IntegerField()
    recent_submissions = StudentGradeSerializer(many=True)
