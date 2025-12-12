"""
AcuRate - Custom Validators
Password complexity and other validation utilities
"""

import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


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

