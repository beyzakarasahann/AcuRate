"""USER Serializers Module"""

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
        if role in ['TEACHER', 'INSTITUTION']:
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
            role='TEACHER',
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
            role='INSTITUTION',
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
