"""ACHIEVEMENT Serializers Module"""

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
# STUDENT PO ACHIEVEMENT SERIALIZERS
# =============================================================================

class StudentPOAchievementSerializer(serializers.ModelSerializer):
    """Serializer for StudentPOAchievement model"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    po_code = serializers.CharField(source='program_outcome.code', read_only=True)
    po_title = serializers.CharField(source='program_outcome.title', read_only=True)
    target_percentage = serializers.DecimalField(source='program_outcome.target_percentage', max_digits=5, decimal_places=2, read_only=True)
    achievement_percentage = serializers.DecimalField(source='current_percentage', max_digits=5, decimal_places=2, read_only=True)
    is_achieved = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = StudentPOAchievement
        fields = [
            'id', 'student', 'student_name', 'student_id',
            'program_outcome', 'po_code', 'po_title',
            'achievement_percentage', 'target_percentage', 'is_achieved',
            'completed_assessments', 'total_assessments',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_achieved', 'created_at', 'updated_at']


class StudentPOAchievementDetailSerializer(serializers.ModelSerializer):
    """Detailed PO achievement with student and PO info"""
    is_achieved = serializers.BooleanField(read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentPOAchievement
        fields = [
            'id', 'student', 'program_outcome',
            'current_percentage', 'is_achieved',
            'completed_assessments', 'total_assessments',
            'progress_percentage', 'last_calculated',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_achieved', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        """Override to use nested serializers"""
        from .user import UserSerializer
        from .outcome import ProgramOutcomeSerializer
        
        ret = super().to_representation(instance)
        ret['student'] = UserSerializer(instance.student).data
        ret['program_outcome'] = ProgramOutcomeSerializer(instance.program_outcome).data
        return ret
    
    def get_progress_percentage(self, obj):
        """Calculate progress towards target"""
        target = obj.program_outcome.target_percentage
        return min(100, (obj.current_percentage / target * 100)) if target > 0 else 0


# =============================================================================
# STUDENT LO ACHIEVEMENT SERIALIZER
# =============================================================================

class StudentLOAchievementSerializer(serializers.ModelSerializer):
    """Serializer for Student LO Achievement model"""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id_number = serializers.CharField(source='student.student_id', read_only=True)
    lo_code = serializers.CharField(source='learning_outcome.code', read_only=True)
    lo_title = serializers.CharField(source='learning_outcome.title', read_only=True)
    course_code = serializers.CharField(source='learning_outcome.course.code', read_only=True)
    course_name = serializers.CharField(source='learning_outcome.course.name', read_only=True)
    target_percentage = serializers.DecimalField(
        source='learning_outcome.target_percentage', 
        max_digits=5, 
        decimal_places=2, 
        read_only=True
    )
    is_target_met = serializers.BooleanField(read_only=True)
    gap_to_target = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    completion_rate = serializers.FloatField(read_only=True)
    
    class Meta:
        model = StudentLOAchievement
        fields = [
            'id', 'student', 'student_name', 'student_id_number',
            'learning_outcome', 'lo_code', 'lo_title',
            'course_code', 'course_name',
            'current_percentage', 'target_percentage', 'is_target_met', 'gap_to_target',
            'total_assessments', 'completed_assessments', 'completion_rate',
            'last_calculated', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_calculated', 'created_at', 'updated_at']
