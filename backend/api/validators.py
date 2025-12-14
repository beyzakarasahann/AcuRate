"""
AcuRate - Custom Validators
Password complexity, input sanitization, and other validation utilities
SECURITY: XSS prevention through HTML sanitization
"""

import re
import html
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


# =============================================================================
# INPUT SANITIZATION (XSS PROTECTION)
# =============================================================================

# Dangerous HTML tags that should be removed
DANGEROUS_TAGS = re.compile(
    r'<\s*(script|iframe|object|embed|form|input|button|style|link|meta|base)[^>]*>.*?</\s*\1\s*>|'
    r'<\s*(?:script|iframe|object|embed|form|input|button|style|link|meta|base)[^>]*/?\s*>',
    re.IGNORECASE | re.DOTALL
)

# JavaScript event handlers (onclick, onerror, etc.)
EVENT_HANDLERS = re.compile(
    r'\s*on\w+\s*=\s*["\'][^"\']*["\']',
    re.IGNORECASE
)

# JavaScript URLs
JS_URLS = re.compile(
    r'(?:javascript|vbscript|data):\s*',
    re.IGNORECASE
)


def sanitize_html(value):
    """
    Remove dangerous HTML content to prevent XSS attacks.
    Use this for fields that might contain HTML or user-generated content.
    
    Args:
        value: String to sanitize
        
    Returns:
        Sanitized string with dangerous content removed
    """
    if not value or not isinstance(value, str):
        return value
    
    # Remove dangerous tags completely
    sanitized = DANGEROUS_TAGS.sub('', value)
    
    # Remove event handlers
    sanitized = EVENT_HANDLERS.sub('', sanitized)
    
    # Remove javascript: URLs
    sanitized = JS_URLS.sub('', sanitized)
    
    return sanitized.strip()


def escape_html(value):
    """
    Escape HTML characters to prevent XSS.
    Use this for fields that should never contain HTML.
    
    Args:
        value: String to escape
        
    Returns:
        HTML-escaped string
    """
    if not value or not isinstance(value, str):
        return value
    
    return html.escape(value, quote=True)


def sanitize_text_field(value, max_length=None, allow_newlines=True):
    """
    Sanitize a plain text field.
    - Escapes HTML
    - Removes control characters
    - Optionally limits length
    
    Args:
        value: String to sanitize
        max_length: Optional maximum length
        allow_newlines: Whether to allow newline characters
        
    Returns:
        Sanitized string
    """
    if not value or not isinstance(value, str):
        return value
    
    # Remove null bytes and other control chars (except newlines if allowed)
    if allow_newlines:
        sanitized = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', value)
    else:
        sanitized = re.sub(r'[\x00-\x1f\x7f]', '', value)
    
    # Escape HTML
    sanitized = escape_html(sanitized)
    
    # Limit length
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized.strip()


class SanitizedCharField:
    """
    Mixin for serializers to automatically sanitize string fields.
    
    Usage in serializer:
        def validate_field_name(self, value):
            return sanitize_text_field(value)
    """
    pass


def validate_no_html(value):
    """
    Django validator that rejects any HTML content.
    Use with model fields or serializer fields.
    
    Usage:
        name = models.CharField(validators=[validate_no_html])
    """
    if not value:
        return value
    
    if '<' in value and '>' in value:
        # Check for actual HTML tags
        if re.search(r'<\s*\w+[^>]*>', value):
            raise ValidationError(
                _('HTML content is not allowed in this field.'),
                code='no_html'
            )
    
    return value


def validate_safe_string(value):
    """
    Django validator that ensures a string doesn't contain potential XSS vectors.
    """
    if not value:
        return value
    
    # Check for script tags
    if re.search(r'<\s*script', value, re.IGNORECASE):
        raise ValidationError(
            _('Script tags are not allowed.'),
            code='no_scripts'
        )
    
    # Check for javascript: URLs
    if re.search(r'javascript:', value, re.IGNORECASE):
        raise ValidationError(
            _('JavaScript URLs are not allowed.'),
            code='no_js_urls'
        )
    
    # Check for event handlers
    if re.search(r'\bon\w+\s*=', value, re.IGNORECASE):
        raise ValidationError(
            _('Event handlers are not allowed.'),
            code='no_event_handlers'
        )
    
    return value


class PasswordComplexityValidator:
    """
    Validate that the password meets complexity requirements:
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    
    def __init__(self, min_uppercase=1, min_lowercase=1, min_digits=1, min_special=1):
        self.min_uppercase = min_uppercase
        self.min_lowercase = min_lowercase
        self.min_digits = min_digits
        self.min_special = min_special
    
    def validate(self, password, user=None):
        errors = []
        
        # Check for uppercase letters
        if len(re.findall(r'[A-Z]', password)) < self.min_uppercase:
            errors.append(
                _('Password must contain at least %(min)d uppercase letter(s).') 
                % {'min': self.min_uppercase}
            )
        
        # Check for lowercase letters
        if len(re.findall(r'[a-z]', password)) < self.min_lowercase:
            errors.append(
                _('Password must contain at least %(min)d lowercase letter(s).') 
                % {'min': self.min_lowercase}
            )
        
        # Check for digits
        if len(re.findall(r'[0-9]', password)) < self.min_digits:
            errors.append(
                _('Password must contain at least %(min)d digit(s).') 
                % {'min': self.min_digits}
            )
        
        # Check for special characters
        special_chars = re.findall(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;\'`~]', password)
        if len(special_chars) < self.min_special:
            errors.append(
                _('Password must contain at least %(min)d special character(s) (!@#$%^&*(),.?":{}|<>).') 
                % {'min': self.min_special}
            )
        
        if errors:
            raise ValidationError(errors)
    
    def get_help_text(self):
        return _(
            'Your password must contain at least: '
            '%(uppercase)d uppercase letter(s), '
            '%(lowercase)d lowercase letter(s), '
            '%(digits)d digit(s), and '
            '%(special)d special character(s).'
        ) % {
            'uppercase': self.min_uppercase,
            'lowercase': self.min_lowercase,
            'digits': self.min_digits,
            'special': self.min_special,
        }


class EmailDomainValidator:
    """
    Validate that the email domain is allowed.
    Useful for restricting registration to specific domains.
    """
    
    def __init__(self, allowed_domains=None, blocked_domains=None):
        self.allowed_domains = allowed_domains or []
        self.blocked_domains = blocked_domains or []
    
    def __call__(self, value):
        if not value:
            return
        
        domain = value.split('@')[-1].lower()
        
        # Check blocked domains
        if self.blocked_domains and domain in self.blocked_domains:
            raise ValidationError(
                _('Email addresses from %(domain)s are not allowed.') 
                % {'domain': domain}
            )
        
        # Check allowed domains (if specified)
        if self.allowed_domains and domain not in self.allowed_domains:
            raise ValidationError(
                _('Please use an email address from an allowed domain.')
            )


