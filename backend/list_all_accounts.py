#!/usr/bin/env python
"""
Tüm Hesapları Listeleme Scripti
Super Admin, Institution, Teacher ve Student hesaplarını gösterir
"""

import os
import sys
import django

# Django setup
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User


def get_default_password_for_user(user):
    """Kullanıcı tipine göre varsayılan şifreyi döndür"""
    if user.is_superuser:
        return "Şifre: reset_superadmin_password.py scripti ile sıfırlanmalı"
    elif user.role == User.Role.INSTITUTION:
        return "institution123"
    elif user.role == User.Role.TEACHER:
        if hasattr(user, 'is_temporary_password') and user.is_temporary_password:
            return "Geçici şifre (Email'de gönderilmiş)"
        return "teacher123"
    elif user.role == User.Role.STUDENT:
        if hasattr(user, 'is_temporary_password') and user.is_temporary_password:
            return "Geçici şifre (Email'de gönderilmiş)"
        return "student123"
    return "bilinmiyor"


def list_all_accounts():
    """Tüm hesapları listele"""
    print("\n" + "="*100)
    print("📋 TÜM HESAPLAR - GİRİŞ BİLGİLERİ")
    print("="*100 + "\n")
    
    # 1. SUPER ADMIN
    print("🔴 1. SUPER ADMIN HESAPLARI")
    print("-"*100)
    superadmins = User.objects.filter(is_superuser=True)
    if superadmins.exists():
        for admin in superadmins:
            print(f"   Username: {admin.username}")
            print(f"   Email: {admin.email}")
            print(f"   Full Name: {admin.get_full_name()}")
            print(f"   Login URL: http://localhost:3000/super-admin-x7k9m2p4q1w8r3n6")
            print(f"   Password: Şifreyi görmek için 'python reset_superadmin_password.py' çalıştırın")
            print()
    else:
        print("   ❌ Super Admin hesabı bulunamadı")
        print()
    
    # 2. INSTITUTION ADMIN
    print("🟠 2. INSTITUTION ADMIN HESAPLARI")
    print("-"*100)
    institutions = User.objects.filter(role=User.Role.INSTITUTION, is_active=True).order_by('username')
    if institutions.exists():
        for inst in institutions:
            print(f"   Username: {inst.username}")
            print(f"   Email: {inst.email}")
            print(f"   Full Name: {inst.get_full_name()}")
            print(f"   Department: {inst.department or 'N/A'}")
            print(f"   Login URL: http://localhost:3000/login")
            print(f"   Password: institution123 (varsayılan) - Değiştirilmiş olabilir")
            print()
        print(f"   📊 Toplam: {institutions.count()} Institution Admin\n")
    else:
        print("   ❌ Institution Admin hesabı bulunamadı\n")
    
    # 3. TEACHER
    print("🟡 3. TEACHER (ÖĞRETMEN) HESAPLARI")
    print("-"*100)
    teachers = User.objects.filter(role=User.Role.TEACHER, is_active=True).order_by('username')
    if teachers.exists():
        for teacher in teachers:
            temp_pass = " (Geçici şifre - Email'de gönderilmiş)" if hasattr(teacher, 'is_temporary_password') and getattr(teacher, 'is_temporary_password', False) else ""
            print(f"   Username: {teacher.username}")
            print(f"   Email: {teacher.email}")
            print(f"   Full Name: {teacher.get_full_name()}")
            print(f"   Department: {teacher.department or 'N/A'}")
            print(f"   Login URL: http://localhost:3000/login")
            print(f"   Password: Geçici şifre veya teacher123{temp_pass}")
            print()
        print(f"   📊 Toplam: {teachers.count()} Teacher\n")
    else:
        print("   ❌ Teacher hesabı bulunamadı\n")
    
    # 4. STUDENT
    print("🟢 4. STUDENT (ÖĞRENCİ) HESAPLARI")
    print("-"*100)
    students = User.objects.filter(role=User.Role.STUDENT, is_active=True).order_by('username')
    if students.exists():
        # İlk 20 öğrenciyi detaylı göster
        for i, student in enumerate(students[:20]):
            temp_pass = " (Geçici şifre - Email'de gönderilmiş)" if hasattr(student, 'is_temporary_password') and getattr(student, 'is_temporary_password', False) else ""
            print(f"   Username: {student.username}")
            print(f"   Email: {student.email}")
            print(f"   Full Name: {student.get_full_name()}")
            print(f"   Student ID: {student.student_id or 'N/A'}")
            print(f"   Department: {student.department or 'N/A'}")
            print(f"   Login URL: http://localhost:3000/login")
            print(f"   Password: student123 veya beyza123{temp_pass}")
            print()
        
        if students.count() > 20:
            print(f"   ... ve {students.count() - 20} öğrenci daha")
            print(f"   Tüm öğrencileri görmek için: python reset_student_password.py list")
            print()
        
        print(f"   📊 Toplam: {students.count()} Student\n")
    else:
        print("   ❌ Student hesabı bulunamadı\n")
    
    # ÖZET
    print("="*100)
    print("📊 ÖZET")
    print("="*100)
    print(f"   Super Admin: {superadmins.count()}")
    print(f"   Institution Admin: {institutions.count()}")
    print(f"   Teacher: {teachers.count()}")
    print(f"   Student: {students.count()}")
    print(f"   Toplam Aktif Kullanıcı: {User.objects.filter(is_active=True).count()}")
    print("="*100)
    
    # DEMO HESAPLARI
    print("\n💡 DEMO HESAPLARI (Test İçin):")
    print("-"*100)
    
    # Beyza2 student
    try:
        beyza2 = User.objects.get(username='beyza2')
        print(f"   👨‍🎓 Student: beyza2")
        print(f"      Email: {beyza2.email}")
        print(f"      Password: beyza123")
        print(f"      Login: http://localhost:3000/login")
    except User.DoesNotExist:
        pass
    
    # Ahmet Bulut teacher
    try:
        ahmet = User.objects.get(username='ahmet.bulut')
        print(f"\n   👨‍🏫 Teacher: ahmet.bulut")
        print(f"      Email: {ahmet.email}")
        print(f"      Password: ahmet123")
        print(f"      Login: http://localhost:3000/login")
    except User.DoesNotExist:
        pass
    
    # Institution
    try:
        inst = User.objects.get(username='institution')
        print(f"\n   🏛️  Institution: institution")
        print(f"      Email: {inst.email}")
        print(f"      Password: institution123")
        print(f"      Login: http://localhost:3000/login")
    except User.DoesNotExist:
        pass
    
    print("\n" + "="*100 + "\n")


if __name__ == '__main__':
    try:
        list_all_accounts()
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

