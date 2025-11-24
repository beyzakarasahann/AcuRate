"""
AcuRate - API Serializers
Converts Django models to/from JSON for REST API endpoints
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import (
    User, ProgramOutcome, Course, CoursePO, 
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    ContactRequest, LearningOutcome
)


# =============================================================================
# USER SERIALIZERS
# =============================================================================

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model (basic info)"""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'profile_picture',
            'student_id', 'department', 'year_of_study',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed user serializer with extra info"""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'phone', 'profile_picture',
            'student_id', 'department', 'year_of_study',
            'is_active', 'is_staff', 'is_superuser',
            'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_login']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role',
            'phone', 'student_id', 'department', 'year_of_study'
        ]
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError("Invalid credentials")
            if not user.is_active:
                raise serializers.ValidationError("User account is disabled")
            data['user'] = user
        else:
            raise serializers.ValidationError("Must include username and password")
        
        return data


# =============================================================================
# PROGRAM OUTCOME SERIALIZERS
# =============================================================================

class ProgramOutcomeSerializer(serializers.ModelSerializer):
    """Serializer for ProgramOutcome model"""
    
    class Meta:
        model = ProgramOutcome
        fields = [
            'id', 'code', 'title', 'description',
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
            'id', 'code', 'title', 'description', 'target_percentage',
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
    learning_outcomes = LearningOutcomeSerializer(many=True, read_only=True)
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
    
    def get_teacher_name(self, obj):
        """Safely get teacher's full name, handling null teacher"""
        if obj.teacher:
            return obj.teacher.get_full_name() or obj.teacher.username
        return None
    
    def get_enrollment_count(self, obj):
        return obj.enrollments.filter(is_active=True).count()


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
# ASSESSMENT SERIALIZERS
# =============================================================================

class AssessmentSerializer(serializers.ModelSerializer):
    """Serializer for Assessment model"""
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    type_display = serializers.CharField(source='get_assessment_type_display', read_only=True)
    related_pos = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=ProgramOutcome.objects.all(),
        required=False
    )
    
    class Meta:
        model = Assessment
        fields = [
            'id', 'course', 'course_code', 'course_name',
            'title', 'description', 'assessment_type', 'type_display',
            'weight', 'max_score', 'due_date', 'is_active',
            'related_pos', 'feedback_ranges', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Handle ManyToMany relationship for related_pos"""
        related_pos = validated_data.pop('related_pos', [])
        assessment = Assessment.objects.create(**validated_data)
        if related_pos:
            assessment.related_pos.set(related_pos)
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
        
        return value
    
    def update(self, instance, validated_data):
        """Handle ManyToMany relationship for related_pos"""
        related_pos = validated_data.pop('related_pos', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if related_pos is not None:
            instance.related_pos.set(related_pos)
        return instance


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
    student = UserSerializer(read_only=True)
    assessment = AssessmentSerializer(read_only=True)
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
    student = UserSerializer(read_only=True)
    program_outcome = ProgramOutcomeSerializer(read_only=True)
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
    
    def get_progress_percentage(self, obj):
        """Calculate progress towards target"""
        target = obj.program_outcome.target_percentage
        return min(100, (obj.current_percentage / target * 100)) if target > 0 else 0


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
    """Serializer for creating contact requests (public endpoint)"""
    
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
        return value
    
    def validate_institution_name(self, value):
        """Validate institution name"""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Institution name must be at least 2 characters")
        return value.strip()


class InstitutionDashboardSerializer(serializers.Serializer):
    """Serializer for institution dashboard data"""
    total_students = serializers.IntegerField()
    total_teachers = serializers.IntegerField()
    total_courses = serializers.IntegerField()
    active_enrollments = serializers.IntegerField()
    po_achievements = ProgramOutcomeStatsSerializer(many=True)
    department_stats = serializers.ListField()

