"""
AcuRate - API Serializers
Converts Django models to/from JSON for REST API endpoints
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db.models import Q
import secrets
import string
from .models import (
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
            'is_active', 'is_staff', 'is_superuser', 'is_temporary_password',
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
        # Prevent self-registration as TEACHER or INSTITUTION via public register endpoint
        role = data.get('role')
        if role in [User.Role.TEACHER, User.Role.INSTITUTION]:
            raise serializers.ValidationError({"role": "You cannot register as a teacher or institution directly."})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        # Users created via public registration choose their own password,
        # so they should not be marked as temporary-password users.
        if hasattr(user, "is_temporary_password"):
            user.is_temporary_password = False
        user.save()
        return user


def generate_temp_password(length: int = 12) -> str:
    """
    Generate a secure random temporary password consisting of letters and digits.
    """
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


class TeacherCreateSerializer(serializers.ModelSerializer):
    """
    Serializer used by Institution/Admin to create teacher accounts with a
    backend-generated temporary password.
    """

    # Make some fields optional so that the endpoint is easier to use
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "first_name", "last_name", "department"]

    def create(self, validated_data):
        request = self.context["request"]
        temp_password = generate_temp_password()

        # Provide safe fallbacks if optional fields are missing
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            first_name=validated_data.get("first_name") or "",
            last_name=validated_data.get("last_name") or "",
            role=User.Role.TEACHER,
            password=temp_password,
            is_temporary_password=True,
            department=validated_data.get("department") or "",
            created_by=request.user,
        )

        from django.core.mail import send_mail
        from django.conf import settings

        # Build a friendly display name and make username explicit in the email
        full_name = (user.get_full_name() or "").strip()
        if full_name:
            greeting_line = f"Hello {full_name},\n\n"
        else:
            greeting_line = "Hello,\n\n"

        send_mail(
            subject="Your AcuRate Teacher Account",
            message=(
                greeting_line
                + "Your AcuRate teacher account has been created.\n\n"
                + f"Username: {user.username}\n"
                + f"Temporary password: {temp_password}\n\n"
                + "Please log in and change your password immediately. "
                + "You will not be allowed to use the system until you update it.\n"
            ),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[user.email],
            fail_silently=False,
        )

        return user


class InstitutionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new institutions by super admin"""
    # Admin contact info
    email = serializers.EmailField()
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    
    # Institution details
    institution_name = serializers.CharField(required=True)
    institution_type = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "email", "first_name", "last_name", "phone",
            "institution_name", "institution_type", "department",
            "address", "city", "country", "website", "description"
        ]

    def validate_email(self, value):
        """Check if email is already in use"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(self, validated_data):
        temp_password = generate_temp_password()

        # Create institution user
        # Use institution_name as username if provided, otherwise use email
        username = validated_data.get("institution_name", validated_data["email"])
        # Make username unique by appending email if needed
        base_username = username.lower().replace(" ", "_").replace(".", "_")
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1
        
        user = User.objects.create_user(
            username=username,
            email=validated_data["email"],
            first_name=validated_data.get("first_name") or "",
            last_name=validated_data.get("last_name") or "",
            role=User.Role.INSTITUTION,
            password=temp_password,
            is_temporary_password=True,
            department=validated_data.get("department") or validated_data.get("institution_name") or "",
            phone=validated_data.get("phone") or "",
        )

        from django.core.mail import send_mail
        from django.conf import settings

        # Build a friendly display name
        full_name = (user.get_full_name() or "").strip()
        if full_name:
            greeting_line = f"Hello {full_name},\n\n"
        else:
            greeting_line = "Hello,\n\n"

        # Build institution info for email
        institution_name = validated_data.get("institution_name", "")
        institution_type = validated_data.get("institution_type", "")
        address = validated_data.get("address", "")
        city = validated_data.get("city", "")
        country = validated_data.get("country", "")
        
        institution_info = ""
        if institution_name:
            institution_info += f"Institution: {institution_name}\n"
        if institution_type:
            institution_info += f"Type: {institution_type}\n"
        if address or city or country:
            address_line = ", ".join(filter(None, [address, city, country]))
            institution_info += f"Address: {address_line}\n"
        
        # Send email with credentials
        send_mail(
            subject="Your AcuRate Institution Admin Account",
            message=(
                greeting_line
                + "Your AcuRate institution admin account has been created.\n\n"
                + (f"{institution_info}\n" if institution_info else "")
                + "Account Details:\n"
                + f"Login with: {user.email} (you can use your email to login)\n"
                + f"Username: {user.username}\n"
                + f"Temporary password: {temp_password}\n\n"
                + "IMPORTANT: You can login using your EMAIL ADDRESS or username.\n"
                + "Please log in at http://localhost:3000/login and change your password immediately.\n"
                + "You will not be allowed to use the system until you update it.\n\n"
                + "Best regards,\n"
                + "AcuRate Team"
            ),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[user.email],
            fail_silently=False,
        )

        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login - supports both username and email"""
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username_or_email = data.get('username', '').strip()
        password = data.get('password')
        
        if not username_or_email or not password:
            raise serializers.ValidationError("Username/email and password are required")
        
        user = None
        
        # Try to find user by username (case-insensitive) or email (case-insensitive)
        try:
            # First try to find by username (case-insensitive)
            user_obj = User.objects.filter(
                Q(username__iexact=username_or_email) | 
                Q(email__iexact=username_or_email)
            ).first()
            
            if user_obj:
                # Authenticate with the actual username from database
                user = authenticate(username=user_obj.username, password=password)
        except Exception:
            user = None
        
        # Fallback: try direct authentication (in case of encoding issues)
        if not user:
            user = authenticate(username=username_or_email, password=password)
        
        # If still not authenticated, try email lookup
        if not user:
            try:
                user_obj = User.objects.get(email__iexact=username_or_email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled")
        
        data['user'] = user
        return data


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
    
    def get_teacher_name(self, obj) -> str | None:
        """Safely get teacher's full name, handling null teacher"""
        if obj.teacher:
            return obj.teacher.get_full_name() or obj.teacher.username
        return None
    
    def get_enrollment_count(self, obj) -> int:
        """Get count of active enrollments for this course"""
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
        
        return value
    
    def update(self, instance, validated_data):
        """Update assessment - related_los handled through AssessmentLO model"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
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

