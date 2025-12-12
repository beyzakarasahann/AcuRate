"""USER Serializers Module"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db.models import Q
import secrets
import string
import logging
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

        # Send email with credentials (handle SSL/email errors gracefully)
        email_sent = False
        email_error_message = None
        
        # Check if SendGrid is configured
        sendgrid_api_key = getattr(settings, "SENDGRID_API_KEY", "")
        if not sendgrid_api_key or sendgrid_api_key == "your-sendgrid-api-key-here":
            logger = logging.getLogger(__name__)
            logger.warning(
                f"SendGrid API key not configured. Email not sent to {user.email}. "
                f"User created successfully. Username: {user.username}. Use password reset if needed."
            )
            email_error_message = "SendGrid API key not configured"
        else:
            try:
                result = send_mail(
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
                    fail_silently=False,  # Set to False to catch errors
                )
                email_sent = result > 0  # send_mail returns number of emails sent
                if not email_sent:
                    email_error_message = "Email sending returned 0 (no emails sent)"
            except Exception as email_error:
                # Log the error but don't fail user creation
                logger = logging.getLogger(__name__)
                error_str = str(email_error)
                logger.error(
                    f"Failed to send email to {user.email} for teacher account creation: {error_str}. "
                    f"User was created successfully. Username: {user.username}. Use password reset if needed.",
                    exc_info=True
                )
                email_error_message = f"Email sending failed: {error_str}"
        
        # Store email status in user instance for later retrieval
        user._email_sent = email_sent
        user._email_error = email_error_message
        user._temp_password = temp_password  # Store temp password for response

        return user


class StudentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer used by Institution/Admin to create student accounts with a
    backend-generated temporary password.
    """

    # Make some fields optional so that the endpoint is easier to use
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    student_id = serializers.CharField(required=False, allow_blank=True)
    year_of_study = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["email", "first_name", "last_name", "department", "student_id", "year_of_study"]

    def validate_student_id(self, value):
        """Check if student_id is unique if provided"""
        if value:
            if User.objects.filter(student_id=value).exists():
                raise serializers.ValidationError("A student with this student ID already exists.")
        return value

    def create(self, validated_data):
        request = self.context["request"]
        temp_password = generate_temp_password()

        # Generate student_id if not provided
        student_id = validated_data.get("student_id")
        if not student_id:
            # Generate a unique student_id based on year and a random number
            from datetime import datetime
            current_year = datetime.now().year
            import random
            while True:
                student_id = f"{current_year}{random.randint(1000, 9999)}"
                if not User.objects.filter(student_id=student_id).exists():
                    break

        # Provide safe fallbacks if optional fields are missing
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            first_name=validated_data.get("first_name") or "",
            last_name=validated_data.get("last_name") or "",
            role='STUDENT',
            password=temp_password,
            is_temporary_password=True,
            department=validated_data.get("department") or "",
            student_id=student_id,
            year_of_study=validated_data.get("year_of_study") or 1,
            created_by=request.user,
        )

        from django.core.mail import send_mail
        from django.conf import settings
        import ssl
        import os

        # Build a friendly display name
        full_name = (user.get_full_name() or "").strip()
        if full_name:
            greeting_line = f"Hello {full_name},\n\n"
        else:
            greeting_line = "Hello,\n\n"

        # Send email with credentials (handle SSL/email errors gracefully)
        email_sent = False
        email_error_message = None
        
        # Ensure SSL skip is applied if needed
        if os.environ.get("SENDGRID_SKIP_SSL_VERIFY", "").lower() == "true":
            ssl._create_default_https_context = ssl._create_unverified_context
        
        # Check if SendGrid is configured
        sendgrid_api_key = getattr(settings, "SENDGRID_API_KEY", "")
        if not sendgrid_api_key or sendgrid_api_key == "your-sendgrid-api-key-here":
            logger = logging.getLogger(__name__)
            logger.warning(
                f"SendGrid API key not configured. Email not sent to {user.email}. "
                f"User created successfully. Username: {user.username}. Use password reset if needed."
            )
            email_error_message = "SendGrid API key not configured"
        else:
            try:
                result = send_mail(
                    subject="Your AcuRate Student Account",
                    message=(
                        greeting_line
                        + "Your AcuRate student account has been created.\n\n"
                        + f"Username: {user.username}\n"
                        + f"Email: {user.email}\n"
                        + f"Student ID: {user.student_id}\n"
                        + f"Temporary password: {temp_password}\n\n"
                        + "Please log in using your EMAIL ADDRESS or USERNAME and this temporary password.\n"
                        + "After logging in, you will be REQUIRED to change your password immediately.\n"
                        + "You will not be able to use the system until you update your password.\n"
                    ),
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                email_sent = result > 0
                if not email_sent:
                    email_error_message = "Email sending returned 0 (no emails sent)"
            except Exception as email_error:
                logger = logging.getLogger(__name__)
                error_str = str(email_error)
                logger.error(
                    f"Failed to send email to {user.email} for student account creation: {error_str}. "
                    f"User was created successfully. Username: {user.username}. Use password reset if needed.",
                    exc_info=True
                )
                email_error_message = f"Email sending failed: {error_str}"
        
        # Store email status in user instance for later retrieval
        user._email_sent = email_sent
        user._email_error = email_error_message
        user._temp_password = temp_password

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
        
        # Send email with credentials (handle SSL/email errors gracefully)
        email_sent = False
        email_error_message = None
        
        # Check if SendGrid is configured
        sendgrid_api_key = getattr(settings, "SENDGRID_API_KEY", "")
        if not sendgrid_api_key or sendgrid_api_key == "your-sendgrid-api-key-here":
            logger = logging.getLogger(__name__)
            logger.warning(
                f"SendGrid API key not configured. Email not sent to {user.email}. "
                f"User created successfully. Username: {user.username}. Use password reset if needed."
            )
            email_error_message = "SendGrid API key not configured"
        else:
            try:
                # Log email attempt
                logger = logging.getLogger(__name__)
                logger.info(f"Attempting to send email to {user.email} for institution account creation")
                
                result = send_mail(
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
                    fail_silently=False,  # Set to False to catch errors
                )
                
                # Log result
                logger.info(f"send_mail returned: {result} for {user.email}")
                
                email_sent = result > 0  # send_mail returns number of emails sent
                if not email_sent:
                    email_error_message = "Email sending returned 0 (no emails sent)"
                    logger.warning(f"Email sending returned 0 for {user.email}")
                else:
                    logger.info(f"Email sent successfully to {user.email} (result: {result})")
            except Exception as email_error:
                # Log the error but don't fail user creation
                logger = logging.getLogger(__name__)
                error_str = str(email_error)
                error_type = type(email_error).__name__
                
                # Check if it's an SSL error and suggest fix
                if 'SSL' in error_str or 'CERTIFICATE' in error_str.upper():
                    logger.error(
                        f"SSL Certificate error when sending email to {user.email}. "
                        f"Make sure SENDGRID_SKIP_SSL_VERIFY=true is set in .env and Django server is restarted. "
                        f"Error: {error_str}"
                    )
                    email_error_message = f"SSL Certificate error. Please set SENDGRID_SKIP_SSL_VERIFY=true in .env and restart Django server. Error: {error_str}"
                else:
                    logger.error(
                        f"Failed to send email to {user.email} for institution account creation. "
                        f"Error type: {error_type}, Error: {error_str}. "
                        f"User was created successfully. Username: {user.username}. Use password reset if needed.",
                        exc_info=True
                    )
                    email_error_message = f"Email sending failed ({error_type}): {error_str}"
        
        # Store email status in user instance for later retrieval
        user._email_sent = email_sent
        user._email_error = email_error_message
        user._temp_password = temp_password  # Store temp password for response

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
