"""COURSE Serializers Module"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db.models import Q
import secrets
import string
from ..models import (
    User, Department, ProgramOutcome, Course, CoursePO, 
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    ContactRequest, LearningOutcome, StudentLOAchievement,
    AssessmentLO, LOPO
)


# =============================================================================
# COURSE SERIALIZERS
# =============================================================================

class CoursePOSerializer(serializers.ModelSerializer):
    """Serializer for Course-PO mapping"""
    po_code = serializers.CharField(source='program_outcome.code', read_only=True)
    po_title = serializers.CharField(source='program_outcome.title', read_only=True)
    
    class Meta:
        model = CoursePO
        fields = ['id', 'program_outcome', 'po_code', 'po_title', 'weight']


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model"""
    teacher_name = serializers.SerializerMethodField()
    semester_display = serializers.CharField(source='get_semester_display', read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'code', 'name', 'description', 'credits',
            'semester', 'semester_display', 'academic_year',
            'department', 'teacher', 'teacher_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_teacher_name(self, obj):
        """Safely get teacher's full name, handling null teacher"""
        if obj.teacher:
            return obj.teacher.get_full_name() or obj.teacher.username
        return None


class CourseDetailSerializer(serializers.ModelSerializer):
    """Detailed course serializer with PO mappings"""
    teacher_name = serializers.SerializerMethodField()
    semester_display = serializers.CharField(source='get_semester_display', read_only=True)
    program_outcomes = CoursePOSerializer(source='course_pos', many=True, read_only=True)
    learning_outcomes = serializers.SerializerMethodField()
    enrollment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'code', 'name', 'description', 'credits',
            'semester', 'semester_display', 'academic_year',
            'department', 'teacher', 'teacher_name', 'program_outcomes',
            'learning_outcomes', 'enrollment_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_teacher_name(self, obj) -> str | None:
        """Safely get teacher's full name, handling null teacher"""
        if obj.teacher:
            return obj.teacher.get_full_name() or obj.teacher.username
        return None
    
    def get_enrollment_count(self, obj) -> int:
        """Get count of active enrollments for this course"""
        return obj.enrollments.filter(is_active=True).count()
    
    def get_learning_outcomes(self, obj):
        """Get learning outcomes with serializer"""
        from .outcome import LearningOutcomeSerializer
        return LearningOutcomeSerializer(obj.learning_outcomes.all(), many=True).data


# =============================================================================
# ENROLLMENT SERIALIZERS
# =============================================================================

class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for Enrollment model"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'student_name', 'student_id',
            'course', 'course_code', 'course_name',
            'enrolled_at', 'is_active',
            'final_grade', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'enrolled_at', 'created_at', 'updated_at']


# =============================================================================
# ENROLLMENT SERIALIZERS
# =============================================================================
