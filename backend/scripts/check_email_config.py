#!/usr/bin/env python
"""
Quick check for email configuration
Run this to verify email settings are loaded correctly
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Load .env BEFORE Django setup
from dotenv import load_dotenv
load_dotenv()

# Apply SSL skip if needed
import ssl
if os.environ.get("SENDGRID_SKIP_SSL_VERIFY", "").lower() == "true":
    ssl._create_default_https_context = ssl._create_unverified_context

django.setup()

from django.conf import settings

print("=" * 60)
print("📧 Email Configuration Check")
print("=" * 60)
print()

# Check API Key
api_key = getattr(settings, 'SENDGRID_API_KEY', '')
if api_key and api_key != 'your-sendgrid-api-key-here':
    masked = api_key[:8] + '...' + api_key[-4:] if len(api_key) > 12 else '***'
    print(f"✅ SENDGRID_API_KEY: {masked}")
else:
    print(f"❌ SENDGRID_API_KEY: Not configured or placeholder")

# Check SSL Skip
ssl_skip = os.environ.get('SENDGRID_SKIP_SSL_VERIFY', '').lower()
if ssl_skip == 'true':
    print(f"✅ SENDGRID_SKIP_SSL_VERIFY: {ssl_skip}")
    print(f"   SSL verification is DISABLED")
else:
    print(f"⚠️  SENDGRID_SKIP_SSL_VERIFY: {ssl_skip or 'not set'}")
    print(f"   SSL verification is ENABLED (may cause errors)")

# Check Email Backend
email_backend = getattr(settings, 'EMAIL_BACKEND', '')
print(f"✅ EMAIL_BACKEND: {email_backend}")

# Check From Email
from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '')
print(f"✅ DEFAULT_FROM_EMAIL: {from_email}")

print()
print("=" * 60)
print("💡 If SSL_SKIP_VERIFY is not 'true', add to .env:")
print("   SENDGRID_SKIP_SSL_VERIFY=true")
print("   Then RESTART Django server!")
print("=" * 60)

