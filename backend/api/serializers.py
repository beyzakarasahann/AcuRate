"""
AcuRate - API Serializers
Converts Django models to/from JSON for REST API endpoints
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import (
    User, ProgramOutcome, Course, CoursePO, 
    Enrollment, Assessment, StudentGrade, StudentPOAchievement
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
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    semester_display = serializers.CharField(source='get_semester_display', read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'code', 'name', 'description', 'credits',
            'semester', 'semester_display', 'year',
            'teacher', 'teacher_name', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CourseDetailSerializer(serializers.ModelSerializer):
    """Detailed course serializer with PO mappings"""
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    semester_display = serializers.CharField(source='get_semester_display', read_only=True)
    program_outcomes = CoursePOSerializer(source='coursepo_set', many=True, read_only=True)
    enrollment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'code', 'name', 'description', 'credits',
            'semester', 'semester_display', 'year',
            'teacher', 'teacher_name', 'program_outcomes',
            'enrollment_count', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_enrollment_count(self, obj):
        return obj.enrollment_set.filter(status=Enrollment.Status.ENROLLED).count()


# =============================================================================
# ENROLLMENT SERIALIZERS
# =============================================================================

class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for Enrollment model"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'student_name', 'student_id',
            'course', 'course_code', 'course_name',
            'enrollment_date', 'status', 'status_display',
            'final_grade', 'letter_grade', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'enrollment_date', 'created_at', 'updated_at']


# =============================================================================
# ASSESSMENT SERIALIZERS
# =============================================================================

class AssessmentSerializer(serializers.ModelSerializer):
    """Serializer for Assessment model"""
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = Assessment
        fields = [
            'id', 'course', 'course_code', 'course_name',
            'title', 'description', 'type', 'type_display',
            'weight', 'max_score', 'due_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# =============================================================================
# STUDENT GRADE SERIALIZERS
# =============================================================================

class StudentGradeSerializer(serializers.ModelSerializer):
    """Serializer for StudentGrade model"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    assessment_title = serializers.CharField(source='assessment.title', read_only=True)
    assessment_type = serializers.CharField(source='assessment.get_type_display', read_only=True)
    percentage = serializers.FloatField(read_only=True)
    
    class Meta:
        model = StudentGrade
        fields = [
            'id', 'student', 'student_name',
            'assessment', 'assessment_title', 'assessment_type',
            'score', 'max_score', 'percentage',
            'feedback', 'graded_at', 'graded_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'percentage', 'created_at', 'updated_at']


class StudentGradeDetailSerializer(serializers.ModelSerializer):
    """Detailed grade serializer with all info"""
    student = UserSerializer(read_only=True)
    assessment = AssessmentSerializer(read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.get_full_name', read_only=True)
    percentage = serializers.FloatField(read_only=True)
    
    class Meta:
        model = StudentGrade
        fields = [
            'id', 'student', 'assessment', 'score', 'max_score',
            'percentage', 'feedback', 'graded_at',
            'graded_by', 'graded_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'percentage', 'created_at', 'updated_at']


# =============================================================================
# STUDENT PO ACHIEVEMENT SERIALIZERS
# =============================================================================

class StudentPOAchievementSerializer(serializers.ModelSerializer):
    """Serializer for StudentPOAchievement model"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    po_code = serializers.CharField(source='program_outcome.code', read_only=True)
    po_title = serializers.CharField(source='program_outcome.title', read_only=True)
    target_percentage = serializers.FloatField(source='program_outcome.target_percentage', read_only=True)
    is_achieved = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = StudentPOAchievement
        fields = [
            'id', 'student', 'student_name', 'student_id',
            'program_outcome', 'po_code', 'po_title',
            'achievement_percentage', 'target_percentage', 'is_achieved',
            'completed_assessments', 'total_assessments',
            'semester', 'year',
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
            'achievement_percentage', 'is_achieved',
            'completed_assessments', 'total_assessments',
            'progress_percentage', 'semester', 'year',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_achieved', 'created_at', 'updated_at']
    
    def get_progress_percentage(self, obj):
        """Calculate progress towards target"""
        target = obj.program_outcome.target_percentage
        return min(100, (obj.achievement_percentage / target * 100)) if target > 0 else 0


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


class TeacherDashboardSerializer(serializers.Serializer):
    """Serializer for teacher dashboard data"""
    teacher = UserDetailSerializer()
    courses = CourseDetailSerializer(many=True)
    total_students = serializers.IntegerField()
    pending_assessments = serializers.IntegerField()
    recent_submissions = StudentGradeSerializer(many=True)


class InstitutionDashboardSerializer(serializers.Serializer):
    """Serializer for institution dashboard data"""
    total_students = serializers.IntegerField()
    total_teachers = serializers.IntegerField()
    total_courses = serializers.IntegerField()
    active_enrollments = serializers.IntegerField()
    po_achievements = ProgramOutcomeStatsSerializer(many=True)
    department_stats = serializers.ListField()

