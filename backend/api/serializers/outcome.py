"""OUTCOME Serializers Module"""

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
# PROGRAM OUTCOME SERIALIZERS
# =============================================================================

class ProgramOutcomeSerializer(serializers.ModelSerializer):
    """Serializer for ProgramOutcome model"""
    
    class Meta:
        model = ProgramOutcome
        fields = [
            'id', 'code', 'title', 'description', 'department',
            'target_percentage', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProgramOutcomeStatsSerializer(serializers.ModelSerializer):
    """PO with achievement statistics"""
    total_students = serializers.IntegerField(read_only=True)
    students_achieved = serializers.IntegerField(read_only=True)
    average_achievement = serializers.FloatField(read_only=True)
    achievement_rate = serializers.FloatField(read_only=True)
    
    class Meta:
        model = ProgramOutcome
        fields = [
            'id', 'code', 'title', 'description', 'department', 'target_percentage',
            'total_students', 'students_achieved', 'average_achievement', 'achievement_rate'
        ]


# =============================================================================
# LEARNING OUTCOME SERIALIZERS
# =============================================================================

class LearningOutcomeSerializer(serializers.ModelSerializer):
    """Serializer for LearningOutcome model"""
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    
    class Meta:
        model = LearningOutcome
        fields = [
            'id', 'code', 'title', 'description',
            'course', 'course_code', 'course_name',
            'target_percentage', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
