"""CONTACT Serializers Module
SECURITY: Input sanitization for user-submitted content
"""

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
from ..validators import sanitize_text_field, sanitize_html, validate_no_html


# =============================================================================
# CONTACT REQUEST SERIALIZERS
# =============================================================================

class ContactRequestSerializer(serializers.ModelSerializer):
    """Serializer for Contact Request model"""
    
    institution_type_display = serializers.CharField(source='get_institution_type_display', read_only=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ContactRequest
        fields = [
            'id', 'institution_name', 'institution_type', 'institution_type_display',
            'contact_name', 'contact_email', 'contact_phone',
            'request_type', 'request_type_display',
            'message', 'status', 'status_display', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'status_display', 'notes', 'created_at', 'updated_at']


class ContactRequestCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating contact requests (public endpoint)
    SECURITY: All text fields are sanitized to prevent XSS attacks
    """
    
    class Meta:
        model = ContactRequest
        fields = [
            'institution_name', 'institution_type',
            'contact_name', 'contact_email', 'contact_phone',
            'request_type', 'message'
        ]
    
    def validate_contact_email(self, value):
        """Validate email format"""
        if not value:
            raise serializers.ValidationError("Email is required")
        # SECURITY: Sanitize email (escape HTML)
        return sanitize_text_field(value, max_length=254, allow_newlines=False)
    
    def validate_institution_name(self, value):
        """Validate institution name"""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Institution name must be at least 2 characters")
        # SECURITY: Sanitize to prevent XSS
        return sanitize_text_field(value, max_length=255, allow_newlines=False)
    
    def validate_contact_name(self, value):
        """SECURITY: Sanitize contact name"""
        if value:
            return sanitize_text_field(value, max_length=255, allow_newlines=False)
        return value
    
    def validate_contact_phone(self, value):
        """SECURITY: Sanitize phone number"""
        if value:
            return sanitize_text_field(value, max_length=20, allow_newlines=False)
        return value
    
    def validate_message(self, value):
        """SECURITY: Sanitize message content (allow newlines for multiline text)"""
        if value:
            # Remove dangerous HTML but allow plain text with newlines
            return sanitize_html(value)
        return value


# =============================================================================
# INSTITUTION DASHBOARD SERIALIZER
# =============================================================================

class InstitutionDashboardSerializer(serializers.Serializer):
    """Serializer for institution dashboard data"""
    total_students = serializers.IntegerField()
    total_teachers = serializers.IntegerField()
    total_courses = serializers.IntegerField()
    total_departments = serializers.IntegerField(required=False)
    active_enrollments = serializers.IntegerField()
    po_achievements = serializers.ListField()  # Will be ProgramOutcomeStatsSerializer instances
    department_stats = serializers.ListField()
