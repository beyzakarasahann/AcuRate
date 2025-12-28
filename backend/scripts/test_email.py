#!/usr/bin/env python
"""
Test SendGrid email configuration
Run: python test_email.py
"""

import os
import sys
import django

# Setup Django - Add backend directory to Python path
# Script is in backend/scripts/, so we need to go up one level to backend/
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)  # Go up one level to backend/
sys.path.insert(0, backend_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail

def test_email_config():
    """Test SendGrid email configuration"""
    print("=" * 60)
    print("🔍 SendGrid Email Configuration Test")
    print("=" * 60)
    print()
    
    # Check API Key
    api_key = getattr(settings, 'SENDGRID_API_KEY', '')
    print(f"📋 SendGrid API Key Status:")
    if not api_key:
        print("   ❌ SENDGRID_API_KEY is not set or empty")
        print("   ⚠️  Email sending will fail!")
    elif api_key == 'your-sendgrid-api-key-here':
        print("   ❌ SENDGRID_API_KEY is still set to placeholder value")
        print("   ⚠️  Please update it with your actual SendGrid API key")
        print("   📝 Edit backend/.env and set:")
        print("      SENDGRID_API_KEY=your-actual-api-key-here")
    else:
        # Mask the API key for security
        masked_key = api_key[:8] + '...' + api_key[-4:] if len(api_key) > 12 else '***'
        print(f"   ✅ SENDGRID_API_KEY is set: {masked_key}")
    
    print()
    
    # Check Email Backend
    email_backend = getattr(settings, 'EMAIL_BACKEND', '')
    print(f"📧 Email Backend: {email_backend}")
    
    # Check From Email
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '')
    print(f"📨 From Email: {from_email}")
    print()
    
    # Test email sending
    if not api_key or api_key == 'your-sendgrid-api-key-here':
        print("=" * 60)
        print("❌ Cannot test email sending - API key not configured")
        print("=" * 60)
        print()
        print("📝 To fix this:")
        print("   1. Go to https://app.sendgrid.com/")
        print("   2. Navigate to Settings > API Keys")
        print("   3. Create a new API key with 'Mail Send' permissions")
        print("   4. Copy the API key")
        print("   5. Edit backend/.env file:")
        print("      SENDGRID_API_KEY=your-actual-api-key-here")
        print("   6. Restart Django server")
        return False
    
    # Ask for test email
    print("=" * 60)
    print("🧪 Test Email Sending")
    print("=" * 60)
    test_email = input("Enter your email address to test (or press Enter to skip): ").strip()
    
    if not test_email:
        print("⏭️  Skipping email test")
        return True
    
    print()
    print(f"📤 Sending test email to {test_email}...")
    
    try:
        result = send_mail(
            subject="AcuRate - Test Email",
            message=(
                "This is a test email from AcuRate.\n\n"
                "If you received this email, your SendGrid configuration is working correctly!\n\n"
                "Best regards,\n"
                "AcuRate Team"
            ),
            from_email=from_email,
            recipient_list=[test_email],
            fail_silently=False,
        )
        
        if result > 0:
            print(f"✅ Email sent successfully! ({result} email(s) sent)")
            print(f"📬 Check your inbox at {test_email}")
            return True
        else:
            print("❌ Email sending returned 0 (no emails sent)")
            return False
            
    except Exception as e:
        print(f"❌ Email sending failed: {str(e)}")
        print()
        print("🔍 Common issues:")
        print("   1. Invalid API key - check your SendGrid API key")
        print("   2. SSL certificate error - try setting SENDGRID_SKIP_SSL_VERIFY=true in .env")
        print("   3. From email not verified in SendGrid")
        print("   4. API key doesn't have 'Mail Send' permissions")
        return False

if __name__ == '__main__':
    success = test_email_config()
    sys.exit(0 if success else 1)

