#!/usr/bin/env python
"""
Öğrenci Şifre Sıfırlama ve Listeleme Scripti

Kullanım:
    # Tüm öğrencileri listele
    python reset_student_password.py list
    
    # Belirli bir öğrencinin şifresini sıfırla
    python reset_student_password.py reset <username> [yeni_sifre]
    
    # Öğrenci ara
    python reset_student_password.py search <username_veya_email>
"""

import os
import sys
import django

# Django setup
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User


def list_all_students():
    """Tüm öğrencileri listele"""
    students = User.objects.filter(role=User.Role.STUDENT, is_active=True).order_by('username')
    
    if not students.exists():
        print("❌ Hiç aktif öğrenci bulunamadı!")
        return
    
    print("=" * 80)
    print("👨‍🎓 TÜM ÖĞRENCİLER")
    print("=" * 80)
    print(f"{'Username':<25} {'Email':<35} {'Student ID':<15} {'Department':<20}")
    print("-" * 80)
    
    for student in students:
        print(f"{student.username:<25} {student.email:<35} {student.student_id or 'N/A':<15} {student.department or 'N/A':<20}")
    
    print("=" * 80)
    print(f"\nToplam {students.count()} aktif öğrenci bulundu.")
    print("\n💡 Şifre sıfırlamak için: python reset_student_password.py reset <username>")


def search_student(query):
    """Öğrenci ara (username veya email ile)"""
    from django.db.models import Q
    students = User.objects.filter(
        role=User.Role.STUDENT,
        is_active=True
    ).filter(
        Q(username__icontains=query) | Q(email__icontains=query)
    )
    
    if not students.exists():
        print(f"❌ '{query}' ile eşleşen öğrenci bulunamadı!")
        return
    
    print("=" * 80)
    print(f"🔍 ARAMA SONUÇLARI: '{query}'")
    print("=" * 80)
    
    for student in students:
        print(f"\nUsername: {student.username}")
        print(f"Email: {student.email}")
        print(f"Student ID: {student.student_id or 'N/A'}")
        print(f"Department: {student.department or 'N/A'}")
        print(f"Year of Study: {student.year_of_study or 'N/A'}")
        print(f"Full Name: {student.get_full_name()}")
        print("-" * 80)
    
    print(f"\nToplam {students.count()} öğrenci bulundu.")


def reset_student_password(username, new_password=None):
    """Öğrenci şifresini sıfırla"""
    try:
        student = User.objects.get(username=username, role=User.Role.STUDENT)
    except User.DoesNotExist:
        print(f"❌ Hata: '{username}' kullanıcı adına sahip öğrenci bulunamadı!")
        print("\n💡 Mevcut öğrencileri görmek için: python reset_student_password.py list")
        return None
    
    # Varsayılan şifre
    if not new_password:
        new_password = 'student123'
    
    # Şifreyi değiştir
    student.set_password(new_password)
    student.is_temporary_password = False
    student.save()
    
    print("=" * 80)
    print("✅ ÖĞRENCİ ŞİFRESİ BAŞARIYLA SIFIRLANDI!")
    print("=" * 80)
    print(f"Username: {student.username}")
    print(f"Email: {student.email}")
    print(f"Student ID: {student.student_id or 'N/A'}")
    print(f"Department: {student.department or 'N/A'}")
    print(f"Yeni Şifre: {new_password}")
    print("=" * 80)
    print(f"\n🌐 Login URL: http://localhost:3000/login")
    print("=" * 80)
    
    return {
        'username': student.username,
        'email': student.email,
        'password': new_password
    }


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Kullanım:")
        print("  python reset_student_password.py list                    # Tüm öğrencileri listele")
        print("  python reset_student_password.py search <query>         # Öğrenci ara")
        print("  python reset_student_password.py reset <username> [şifre]  # Şifre sıfırla")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == 'list':
        list_all_students()
    elif command == 'search':
        if len(sys.argv) < 3:
            print("❌ Hata: Arama terimi gerekli!")
            print("Kullanım: python reset_student_password.py search <query>")
            sys.exit(1)
        search_student(sys.argv[2])
    elif command == 'reset':
        if len(sys.argv) < 3:
            print("❌ Hata: Username gerekli!")
            print("Kullanım: python reset_student_password.py reset <username> [yeni_sifre]")
            sys.exit(1)
        username = sys.argv[2]
        new_password = sys.argv[3] if len(sys.argv) > 3 else None
        reset_student_password(username, new_password)
    else:
        print(f"❌ Bilinmeyen komut: {command}")
        print("Kullanım:")
        print("  python reset_student_password.py list")
        print("  python reset_student_password.py search <query>")
        print("  python reset_student_password.py reset <username> [şifre]")
        sys.exit(1)

