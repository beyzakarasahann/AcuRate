#!/usr/bin/env python
"""
Super Admin Şifre Sıfırlama Scripti

Kullanım:
    python manage.py shell < reset_superadmin_password.py
    veya
    python reset_superadmin_password.py
"""

import os
import sys
import django

# Django setup
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acurate.settings')
django.setup()

from api.models import User
import secrets

def reset_superadmin_password(username=None, new_password=None):
    """
    Super admin şifresini sıfırlar
    
    Args:
        username: Super admin kullanıcı adı (opsiyonel, ilk super admin bulunur)
        new_password: Yeni şifre (opsiyonel, otomatik oluşturulur)
    """
    # Super admin bul
    if username:
        try:
            superadmin = User.objects.get(username=username, is_superuser=True)
        except User.DoesNotExist:
            print(f"❌ Hata: '{username}' kullanıcı adına sahip super admin bulunamadı!")
            return None
    else:
        superadmin = User.objects.filter(is_superuser=True).first()
        if not superadmin:
            print("❌ Hata: Hiç super admin bulunamadı!")
            return None
    
    # Yeni şifre oluştur
    if not new_password:
        new_password = secrets.token_urlsafe(16)
    
    # Şifreyi değiştir
    superadmin.set_password(new_password)
    superadmin.save()
    
    print("=" * 60)
    print("✅ SUPER ADMIN ŞİFRESİ BAŞARIYLA SIFIRLANDI!")
    print("=" * 60)
    print(f"Username: {superadmin.username}")
    print(f"Email: {superadmin.email}")
    print(f"Yeni Şifre: {new_password}")
    print("=" * 60)
    print("\n⚠️  Bu şifreyi güvenli bir yerde saklayın!")
    print(f"Super Admin Login: http://localhost:3000/super-admin-x7k9m2p4q1w8r3n6")
    print("=" * 60)
    
    return {
        'username': superadmin.username,
        'email': superadmin.email,
        'password': new_password
    }

if __name__ == '__main__':
    # Komut satırı argümanlarını kontrol et
    username = sys.argv[1] if len(sys.argv) > 1 else None
    new_password = sys.argv[2] if len(sys.argv) > 2 else None
    
    reset_superadmin_password(username, new_password)


