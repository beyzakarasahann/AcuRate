#!/usr/bin/env python
"""
Admin/Institution Şifre Sıfırlama Scripti

Kullanım:
    # Tüm admin/institution kullanıcılarını listele
    python reset_admin_password.py list
    
    # Email veya username ile kullanıcı ara
    python reset_admin_password.py search <email_veya_username>
    
    # Şifre sıfırla (email veya username ile)
    python reset_admin_password.py reset <email_veya_username> [yeni_sifre]
"""

import os
import sys
import django

# Django setup
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User
from django.db.models import Q


def list_all_admins():
    """Tüm admin/institution kullanıcılarını listele"""
    admins = User.objects.filter(
        Q(role=User.Role.INSTITUTION) | Q(role=User.Role.TEACHER)
    ).filter(is_active=True).order_by('role', 'username')
    
    if not admins.exists():
        print("❌ Hiç aktif admin/institution kullanıcısı bulunamadı!")
        return
    
    print("=" * 80)
    print("👨‍💼 TÜM ADMIN/INSTITUTION KULLANICILARI")
    print("=" * 80)
    print(f"{'Username':<25} {'Email':<40} {'Role':<15}")
    print("-" * 80)
    
    for admin in admins:
        print(f"{admin.username:<25} {admin.email:<40} {admin.get_role_display():<15}")
    
    print("=" * 80)
    print(f"\nToplam {admins.count()} aktif admin/institution kullanıcısı bulundu.")
    print("\n💡 Şifre sıfırlamak için: python reset_admin_password.py reset <email_veya_username>")


def search_admin(query):
    """Admin ara (username veya email ile)"""
    admins = User.objects.filter(
        Q(role=User.Role.INSTITUTION) | Q(role=User.Role.TEACHER),
        is_active=True
    ).filter(
        Q(username__icontains=query) | Q(email__icontains=query)
    )
    
    if not admins.exists():
        print(f"❌ '{query}' ile eşleşen admin/institution kullanıcısı bulunamadı!")
        return
    
    print("=" * 80)
    print(f"🔍 ARAMA SONUÇLARI: '{query}'")
    print("=" * 80)
    
    for admin in admins:
        print(f"\nUsername: {admin.username}")
        print(f"Email: {admin.email}")
        print(f"Role: {admin.get_role_display()}")
        print(f"Full Name: {admin.get_full_name()}")
        print(f"Is Active: {admin.is_active}")
        print(f"Is Staff: {admin.is_staff}")
        print(f"Is Superuser: {admin.is_superuser}")
        print("-" * 80)
    
    print(f"\nToplam {admins.count()} kullanıcı bulundu.")


def reset_admin_password(query, new_password=None):
    """Admin/Institution şifresini sıfırla (email veya username ile)"""
    try:
        admin = User.objects.filter(
            Q(role=User.Role.INSTITUTION) | Q(role=User.Role.TEACHER)
        ).filter(
            Q(username=query) | Q(email=query)
        ).first()
    except User.DoesNotExist:
        admin = None
    
    if not admin:
        # Daha esnek arama yap
        admin = User.objects.filter(
            Q(role=User.Role.INSTITUTION) | Q(role=User.Role.TEACHER)
        ).filter(
            Q(username__icontains=query) | Q(email__icontains=query)
        ).first()
    
    if not admin:
        print(f"❌ Hata: '{query}' ile eşleşen admin/institution kullanıcısı bulunamadı!")
        print("\n💡 Mevcut kullanıcıları görmek için: python reset_admin_password.py list")
        print("💡 Arama yapmak için: python reset_admin_password.py search <query>")
        return None
    
    # Varsayılan şifre
    if not new_password:
        new_password = 'admin123'
    
    # Şifreyi değiştir
    admin.set_password(new_password)
    if hasattr(admin, 'is_temporary_password'):
        admin.is_temporary_password = False
    admin.save()
    
    print("=" * 80)
    print("✅ ADMIN/INSTITUTION ŞİFRESİ BAŞARIYLA SIFIRLANDI!")
    print("=" * 80)
    print(f"Username: {admin.username}")
    print(f"Email: {admin.email}")
    print(f"Role: {admin.get_role_display()}")
    print(f"Full Name: {admin.get_full_name()}")
    print(f"Yeni Şifre: {new_password}")
    print("=" * 80)
    print(f"\n🌐 Login URL: http://localhost:3000/login")
    print("=" * 80)
    
    return {
        'username': admin.username,
        'email': admin.email,
        'password': new_password
    }


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Kullanım:")
        print("  python reset_admin_password.py list                          # Tüm admin/institution kullanıcılarını listele")
        print("  python reset_admin_password.py search <email_veya_username>  # Kullanıcı ara")
        print("  python reset_admin_password.py reset <email_veya_username> [şifre]  # Şifre sıfırla")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == 'list':
        list_all_admins()
    elif command == 'search':
        if len(sys.argv) < 3:
            print("❌ Hata: Arama terimi gerekli!")
            print("Kullanım: python reset_admin_password.py search <email_veya_username>")
            sys.exit(1)
        search_admin(sys.argv[2])
    elif command == 'reset':
        if len(sys.argv) < 3:
            print("❌ Hata: Email veya username gerekli!")
            print("Kullanım: python reset_admin_password.py reset <email_veya_username> [yeni_sifre]")
            sys.exit(1)
        query = sys.argv[2]
        new_password = sys.argv[3] if len(sys.argv) > 3 else None
        reset_admin_password(query, new_password)
    else:
        print(f"❌ Bilinmeyen komut: {command}")
        print("Kullanım:")
        print("  python reset_admin_password.py list")
        print("  python reset_admin_password.py search <email_veya_username>")
        print("  python reset_admin_password.py reset <email_veya_username> [şifre]")
        sys.exit(1)

