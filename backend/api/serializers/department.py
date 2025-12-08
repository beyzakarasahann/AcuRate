"""DEPARTMENT Serializers Module"""

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
# DEPARTMENT SERIALIZERS
# =============================================================================

class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department model"""
    
    class Meta:
        model = Department
        fields = [
            'id', 'name', 'code', 'description',
            'contact_email', 'contact_phone',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
