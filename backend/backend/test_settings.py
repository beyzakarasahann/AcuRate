"""
Test settings for AcuRate backend.
Uses SQLite for faster test execution.
"""

from .settings import *  # noqa

# Use SQLite for testing (faster, no Docker needed)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
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
