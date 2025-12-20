#!/usr/bin/env python3
"""
Test Before Push Script (Python version)
Bu script, GitHub'a push etmeden önce testlerin geçip geçmediğini kontrol eder
Kullanım: python scripts/test_before_push.py
"""

import os
import sys
import subprocess
from pathlib import Path

# Backend dizinine geç
backend_dir = Path(__file__).parent.parent
os.chdir(backend_dir)

# Renk kodları
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
NC = '\033[0m'  # No Color

def print_header(text):
    """Header yazdır"""
    print(f"\n{BLUE}{'='*60}{NC}")
    print(f"{BLUE}{text}{NC}")
    print(f"{BLUE}{'='*60}{NC}\n")

def print_success(text):
    """Başarı mesajı yazdır"""
    print(f"{GREEN}✅ {text}{NC}")

def print_warning(text):
    """Uyarı mesajı yazdır"""
    print(f"{YELLOW}⚠️  {text}{NC}")

def print_error(text):
    """Hata mesajı yazdır"""
    print(f"{RED}❌ {text}{NC}")

def check_docker_postgresql():
    """Docker PostgreSQL bağlantısını kontrol et"""
    try:
        import psycopg2
        conn = psycopg2.connect(
            dbname='acurate_db',
            user='acurate_user',
            password='acurate_pass_2024',
            host='localhost',
            port='5432',
            connect_timeout=5
        )
        conn.close()
        return True, None
    except ImportError:
        return False, "psycopg2 paketi yüklü değil. 'pip install psycopg2-binary' komutu ile yükleyin."
    except Exception as e:
        return False, str(e)

def check_docker_running():
    """Docker'ın çalışıp çalışmadığını kontrol et"""
    try:
        result = subprocess.run(
            ['docker', 'ps'],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
        return False

def check_postgresql_container():
    """PostgreSQL container'ının çalışıp çalışmadığını kontrol et"""
    try:
        result = subprocess.run(
            ['docker', 'ps', '--filter', 'name=acurate_postgres', '--format', '{{.Names}}'],
            capture_output=True,
            text=True,
            timeout=5
        )
        return 'acurate_postgres' in result.stdout
    except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
        return False

def run_tests():
    """Testleri çalıştır"""
    print_header("🧪 Test Before Push - AcuRate Backend")
    
    # Docker kontrolü
    print("🐳 Docker kontrol ediliyor...")
    if not check_docker_running():
        print_error("Docker çalışmıyor!")
        print()
        print("Docker'ı başlatmak için:")
        print("  docker-compose up -d")
        print()
        return 1
    
    # PostgreSQL container kontrolü
    print("📦 PostgreSQL container kontrol ediliyor...")
    if not check_postgresql_container():
        print_warning("PostgreSQL container (acurate_postgres) çalışmıyor!")
        print()
        print("PostgreSQL container'ını başlatmak için:")
        print("  cd ..  # Proje root dizinine")
        print("  docker-compose up -d postgres")
        print()
        print("veya tüm servisleri başlatmak için:")
        print("  docker-compose up -d")
        print()
        return 1
    
    print_success("PostgreSQL container çalışıyor")
    
    # PostgreSQL bağlantı kontrolü
    print("📊 Docker PostgreSQL bağlantısı kontrol ediliyor...")
    pg_available, pg_error = check_docker_postgresql()
    if not pg_available:
        print_error(f"PostgreSQL bağlantısı başarısız: {pg_error}")
        print()
        print("PostgreSQL container'ının hazır olmasını bekleyin:")
        print("  docker logs acurate_postgres")
        print()
        print("Container'ı yeniden başlatmak için:")
        print("  docker-compose restart postgres")
        print()
        return 1
    
    print_success("Docker PostgreSQL bağlantısı başarılı")
    
    # Environment variables
    os.environ.setdefault('DJANGO_SECRET_KEY', 'test-secret-key-for-local-testing')
    os.environ.setdefault('DJANGO_DEBUG', 'False')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.test_settings')
    
    # Deprecated test dosyalarını hariç tut
    exclude_patterns = [
        '--ignore=api/tests/test_models.py',
        '--ignore=api/tests/test_api.py',
        '--ignore=api/tests/test_serializers.py',
        '--ignore=api/tests/test_permissions.py',
        '--ignore=api/tests/test_integration.py',
    ]
    
    # Test veritabanını kontrol et (pytest-django --reuse-db için)
    # Not: Test veritabanı pytest-django tarafından otomatik oluşturulur
    # --reuse-db flag'i mevcut test veritabanını kullanır
    print("🗄️  Test veritabanı kontrol ediliyor...")
    try:
        import psycopg2
        # Test veritabanına bağlanmayı dene
        test_conn = psycopg2.connect(
            dbname='test_acurate_db',
            user='acurate_user',
            password='acurate_pass_2024',
            host='localhost',
            port='5432',
            connect_timeout=2
        )
        test_conn.close()
        print_success("Test veritabanı mevcut ve erişilebilir")
    except psycopg2.OperationalError:
        # Test veritabanı yok, pytest-django oluşturacak
        print_warning("Test veritabanı mevcut değil, pytest-django oluşturacak")
        print_warning("Not: Eğer izin hatası alırsanız, test veritabanını manuel oluşturun:")
        print_warning("  docker exec acurate_postgres psql -U acurate_user -d postgres -c \"CREATE DATABASE test_acurate_db OWNER acurate_user;\"")
    except Exception as e:
        print_warning(f"Test veritabanı kontrolü başarısız: {e}")
    
    # Test komutu
    # --reuse-db: Reuse test database if it exists (faster, avoids permission issues)
    cmd = [
        sys.executable, '-m', 'pytest',
        'api/tests/',
        *exclude_patterns,
        '-v',
        '--tb=short',
        '--strict-markers',
        '-m', 'not slow',
        '--cov=api',
        '--cov-report=term-missing',
        '--cov-report=html',
        '--reuse-db',  # Reuse existing test database
        '--nomigrations',
    ]
    
    print("\n🚀 Testler çalıştırılıyor...\n")
    
    try:
        result = subprocess.run(cmd, check=True, cwd=backend_dir)
        print()
        print_success("Tüm testler başarıyla geçti!")
        print()
        print("📊 Coverage raporu: htmlcov/index.html")
        print()
        return 0
    except subprocess.CalledProcessError:
        print()
        print_error("Testler başarısız oldu!")
        print_error("⚠️  GitHub'a push etmeden önce testleri düzeltin.")
        print()
        return 1

if __name__ == '__main__':
    sys.exit(run_tests())

