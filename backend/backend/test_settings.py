"""
Test settings for AcuRate backend.
Uses PostgreSQL for testing (same as production).
PostgreSQL must be running in Docker.
"""

import os

# Set DEBUG before importing settings to ensure CORS_ALLOWED_ORIGINS is defined correctly
os.environ.setdefault('DJANGO_DEBUG', 'True')

from .settings import *  # noqa

# Use PostgreSQL for testing (same as production)
# Database credentials from environment variables or defaults
# PostgreSQL must be running in Docker
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'acurate_db'),
        'USER': os.environ.get('POSTGRES_USER', 'acurate_user'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'acurate_pass_2024'),
        'HOST': os.environ.get('POSTGRES_HOST', 'localhost'),
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        'OPTIONS': {
            'connect_timeout': 10,
        },
        # Don't reuse connections in tests
        'CONN_MAX_AGE': 0,
    }
}

# Disable rate limiting for tests
RATELIMIT_ENABLE = False

# Speed up password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Use console email backend for tests
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
