"""ASSESSMENT Serializers Module"""

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
# ASSESSMENT SERIALIZERS
# =============================================================================

class AssessmentSerializer(serializers.ModelSerializer):
    """Serializer for Assessment model"""
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    type_display = serializers.CharField(source='get_assessment_type_display', read_only=True)
    # NOTE: related_pos removed - use related_los instead (POs are accessed through LO → PO path)
    
    class Meta:
        model = Assessment
        fields = [
            'id', 'course', 'course_code', 'course_name',
            'title', 'description', 'assessment_type', 'type_display',
            'weight', 'max_score', 'due_date', 'is_active',
            'related_los', 'feedback_ranges', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create assessment - related_los handled through AssessmentLO model"""
        assessment = Assessment.objects.create(**validated_data)
        return assessment
    
    def validate_feedback_ranges(self, value):
        """Validate feedback_ranges format"""
        if value is None:
            return []
        
        if not isinstance(value, list):
            raise serializers.ValidationError("feedback_ranges must be a list")
        
        for i, range_item in enumerate(value):
            if not isinstance(range_item, dict):
                raise serializers.ValidationError(f"feedback_ranges[{i}] must be a dictionary")
            
            required_fields = ['min_score', 'max_score', 'feedback']
            for field in required_fields:
                if field not in range_item:
                    raise serializers.ValidationError(f"feedback_ranges[{i}] missing required field: {field}")
            
            min_score = range_item.get('min_score')
            max_score = range_item.get('max_score')
            
            if not isinstance(min_score, (int, float)) or not isinstance(max_score, (int, float)):
                raise serializers.ValidationError(f"feedback_ranges[{i}] min_score and max_score must be numbers")
            
            if min_score < 0 or min_score > 100:
                raise serializers.ValidationError(f"feedback_ranges[{i}] min_score must be between 0 and 100")
            
            if max_score < 0 or max_score > 100:
                raise serializers.ValidationError(f"feedback_ranges[{i}] max_score must be between 0 and 100")
            
            if min_score > max_score:
                raise serializers.ValidationError(f"feedback_ranges[{i}] min_score cannot be greater than max_score")
        
        # Additional validation: ranges must be proper non-overlapping intervals
        # Sort by min_score to make interval checking order-independent
        sorted_ranges = sorted(value, key=lambda r: r.get('min_score', 0))
        prev_max = None
        for i, range_item in enumerate(sorted_ranges):
            min_score = range_item.get('min_score', 0)
            max_score = range_item.get('max_score', 100)
            
            # Ensure that ranges do not overlap:
            # current min must be strictly greater than previous max
            # (e.g. [0, 49], [50, 74], [75, 100] is valid;
            #  [0, 50], [50, 100] would be ambiguous and is rejected)
            if prev_max is not None and min_score <= prev_max:
                raise serializers.ValidationError(
                    "feedback_ranges must define non-overlapping intervals. "
                    "Each range's min_score must be greater than the previous range's max_score."
                )
            prev_max = max_score
        
        return value
    
    def update(self, instance, validated_data):
        """Update assessment - related_los handled through AssessmentLO model"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# =============================================================================
# ASSESSMENT-LO MAPPING SERIALIZERS
# =============================================================================

class AssessmentLOSerializer(serializers.ModelSerializer):
    """Serializer for Assessment-LO mapping
    
    Supports both field naming conventions:
    - Backend standard: assessment, learning_outcome
    - Frontend alternative: assessmentId, learningOutcomeId, courseId
    """
    # Standard fields
    assessment_title = serializers.CharField(source='assessment.title', read_only=True)
    assessment_type = serializers.CharField(source='assessment.assessment_type', read_only=True)
    lo_code = serializers.CharField(source='learning_outcome.code', read_only=True)
    lo_title = serializers.CharField(source='learning_outcome.title', read_only=True)
    course_code = serializers.CharField(source='assessment.course.code', read_only=True)
    
    # Alternative field names for frontend compatibility
    assessmentId = serializers.IntegerField(source='assessment.id', read_only=True)
    learningOutcomeId = serializers.IntegerField(source='learning_outcome.id', read_only=True)
    courseId = serializers.IntegerField(source='assessment.course.id', read_only=True)
    
    class Meta:
        model = AssessmentLO
        fields = [
            'id', 'assessment', 'learning_outcome', 'weight',
            # Standard read-only fields
            'assessment_title', 'assessment_type', 'lo_code', 'lo_title', 'course_code',
            # Alternative field names
            'assessmentId', 'learningOutcomeId', 'courseId',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_internal_value(self, data):
        """Convert frontend field names to backend field names"""
        # Create a copy to avoid modifying the original
        data = dict(data)
        
        # Convert frontend field names to backend field names if present
        if 'assessmentId' in data and 'assessment' not in data:
            data['assessment'] = data.pop('assessmentId')
        if 'learningOutcomeId' in data and 'learning_outcome' not in data:
            data['learning_outcome'] = data.pop('learningOutcomeId')
        
        # courseId is only used for validation, not stored directly
        # It can be validated in perform_create in the view
        
        return super().to_internal_value(data)


# =============================================================================
# LO-PO MAPPING SERIALIZERS
# =============================================================================

class LOPOSerializer(serializers.ModelSerializer):
    """Serializer for LO-PO mapping
    
    Supports both field naming conventions:
    - Backend standard: learning_outcome, program_outcome
    - Frontend alternative: learningOutcomeId, programOutcomeId, courseId
    """
    # Standard fields
    lo_code = serializers.CharField(source='learning_outcome.code', read_only=True)
    lo_title = serializers.CharField(source='learning_outcome.title', read_only=True)
    po_code = serializers.CharField(source='program_outcome.code', read_only=True)
    po_title = serializers.CharField(source='program_outcome.title', read_only=True)
    course_code = serializers.CharField(source='learning_outcome.course.code', read_only=True)
    
    # Alternative field names for frontend compatibility
    learningOutcomeId = serializers.IntegerField(source='learning_outcome.id', read_only=True)
    programOutcomeId = serializers.IntegerField(source='program_outcome.id', read_only=True)
    courseId = serializers.IntegerField(source='learning_outcome.course.id', read_only=True)
    
    class Meta:
        model = LOPO
        fields = [
            'id', 'learning_outcome', 'program_outcome', 'weight',
            # Standard read-only fields
            'lo_code', 'lo_title', 'po_code', 'po_title', 'course_code',
            # Alternative field names
            'learningOutcomeId', 'programOutcomeId', 'courseId',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_internal_value(self, data):
        """Convert frontend field names to backend field names"""
        # Create a copy to avoid modifying the original
        data = dict(data)
        
        # Convert frontend field names to backend field names if present
        if 'learningOutcomeId' in data and 'learning_outcome' not in data:
            data['learning_outcome'] = data.pop('learningOutcomeId')
        if 'programOutcomeId' in data and 'program_outcome' not in data:
            data['program_outcome'] = data.pop('programOutcomeId')
        
        return super().to_internal_value(data)


# =============================================================================
# STUDENT GRADE SERIALIZERS
# =============================================================================

class StudentGradeSerializer(serializers.ModelSerializer):
    """Serializer for StudentGrade model"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    assessment_title = serializers.CharField(source='assessment.title', read_only=True)
    assessment_type = serializers.CharField(source='assessment.get_assessment_type_display', read_only=True)
    max_score = serializers.DecimalField(source='assessment.max_score', max_digits=6, decimal_places=2, read_only=True)
    percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentGrade
        fields = [
            'id', 'student', 'student_name',
            'assessment', 'assessment_title', 'assessment_type',
            'score', 'max_score', 'percentage',
            'feedback', 'graded_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'percentage', 'created_at', 'updated_at']
    
    def get_percentage(self, obj):
        """Calculate percentage score"""
        if obj.assessment.max_score > 0:
            return float((obj.score / obj.assessment.max_score) * 100)
        return 0.0


class StudentGradeDetailSerializer(serializers.ModelSerializer):
    """Detailed grade serializer with all info"""
    student = serializers.SerializerMethodField()
    assessment = serializers.SerializerMethodField()
    max_score = serializers.DecimalField(source='assessment.max_score', max_digits=6, decimal_places=2, read_only=True)
    percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentGrade
        fields = [
            'id', 'student', 'assessment', 'score', 'max_score',
            'percentage', 'feedback', 'graded_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'percentage', 'created_at', 'updated_at']
    
    def get_percentage(self, obj):
        """Calculate percentage score"""
        if obj.assessment.max_score > 0:
            return float((obj.score / obj.assessment.max_score) * 100)
        return 0.0
