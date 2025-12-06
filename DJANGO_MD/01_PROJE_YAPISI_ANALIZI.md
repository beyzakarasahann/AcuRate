# 📁 Django Proje Yapısı - Detaylı Analiz

**Tarih:** Aralık 2024  
**Django Versiyon:** 5.2.1  
**Proje:** AcuRate Backend

---

## 📂 Mevcut Klasör Yapısı

```
backend/
├── api/                          # Ana Django app
│   ├── __init__.py
│   ├── admin.py                  # ✅ Admin panel customization
│   ├── apps.py                   # ✅ App configuration
│   ├── models.py                 # ✅ Database models
│   ├── serializers.py            # ✅ API serializers
│   ├── views.py                  # ⚠️ Tüm view'lar tek dosyada (3000+ satır)
│   ├── views_bulk_operations.py  # ✅ Bulk operations ayrı dosya
│   ├── views_file_upload.py      # ✅ File upload ayrı dosya
│   ├── urls.py                   # ✅ URL routing
│   ├── utils.py                  # ✅ Utility functions
│   ├── exceptions.py             # ✅ Custom exception handler
│   ├── middleware.py             # ✅ Custom middleware
│   ├── signals.py                # ✅ Django signals
│   ├── cache_utils.py             # ✅ Caching utilities
│   ├── tests.py                  # ✅ Test suite
│   ├── tests_signal.py           # ✅ Signal tests
│   ├── migrations/               # ✅ Database migrations
│   └── management/
│       └── commands/              # ✅ Custom management commands
│
├── backend/                      # Django project settings
│   ├── __init__.py
│   ├── settings.py               # ✅ Main settings
│   ├── test_settings.py          # ✅ Test settings
│   ├── urls.py                   # ✅ Root URL config
│   ├── wsgi.py                   # ✅ WSGI config
│   └── asgi.py                   # ✅ ASGI config
│
├── manage.py                     # ✅ Django management script
├── requirements.txt              # ✅ Dependencies
├── .env.example                  # ✅ Environment variables template
│
├── logs/                         # ⚠️ Log dosyaları (git'te olmamalı)
│   └── acurate.log
│
└── [Çok sayıda test scripti]     # ❌ Root'ta olmamalı
    ├── create_test_data.py
    ├── create_student.py
    ├── setup_beyza2_scores_data.py
    ├── reset_*.py
    └── ...
```

---

## ✅ İYİ OLAN YAPILAR

### 1. App Yapısı
- ✅ Tek bir `api` app'i ile organize edilmiş
- ✅ Models, views, serializers ayrı dosyalarda
- ✅ Custom management commands mevcut
- ✅ Signals ayrı dosyada

### 2. Settings Yapısı
- ✅ `settings.py` ve `test_settings.py` ayrı
- ✅ Environment variables kullanılıyor
- ✅ `.env.example` dosyası mevcut

### 3. URL Yapısı
- ✅ Router kullanımı (DRF DefaultRouter)
- ✅ ViewSet'ler router'da register edilmiş
- ✅ Function-based views ayrı endpoint'lerde

### 4. Admin Panel
- ✅ Custom admin configuration
- ✅ Model admin'leri register edilmiş

---

## ❌ EKSİK VE SORUNLU YAPILAR

### 🚨 KRİTİK SORUNLAR

#### 1. Views.py Çok Büyük (3000+ Satır)
**Sorun:** Tüm view'lar tek dosyada, bakımı zor.

**Mevcut Durum:**
```
api/views.py - 3477 satır
├── Authentication views
├── Dashboard views
├── Super Admin views
├── Analytics views
├── ViewSets (10+ ViewSet)
└── Helper functions
```

**Çözüm:** Views'ları modüllere ayır:
```
api/
├── views/
│   ├── __init__.py
│   ├── auth.py              # Authentication views
│   ├── dashboards.py        # Dashboard views
│   ├── super_admin.py       # Super admin views
│   ├── analytics.py         # Analytics views
│   ├── viewsets/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── grade.py
│   │   └── ...
│   └── contact.py           # Contact views
```

#### 2. Permissions Dosyası Yok
**Sorun:** Custom permission class'ları yok.

**Eksik:**
- `api/permissions.py` dosyası yok
- Permission logic views içinde dağınık
- Role-based permissions için reusable class'lar yok

**Çözüm:** `api/permissions.py` oluştur:
```python
# api/permissions.py
from rest_framework import permissions

class IsStudent(permissions.BasePermission):
    """Only students can access"""
    
class IsTeacher(permissions.BasePermission):
    """Only teachers can access"""
    
class IsInstitution(permissions.BasePermission):
    """Only institution admins can access"""
    
class IsSuperAdmin(permissions.BasePermission):
    """Only super admins can access"""
```

#### 3. Filters Dosyası Yok
**Sorun:** DRF filter backend'leri yok.

**Eksik:**
- `api/filters.py` dosyası yok
- Filtering logic views içinde
- Reusable filter class'ları yok

**Çözüm:** `api/filters.py` oluştur:
```python
# api/filters.py
import django_filters
from rest_framework import filters

class CourseFilter(filters.FilterSet):
    # Filter definitions
    pass
```

#### 4. Pagination Dosyası Yok
**Sorun:** Custom pagination class'ları yok.

**Eksik:**
- `api/pagination.py` dosyası yok
- Sadece default pagination kullanılıyor

**Çözüm:** `api/pagination.py` oluştur:
```python
# api/pagination.py
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
```

#### 5. Test Scriptleri Root'ta
**Sorun:** Test scriptleri root dizinde, organize değil.

**Eksik Dosyalar:**
- `create_test_data.py`
- `create_student.py`
- `setup_beyza2_scores_data.py`
- `reset_*.py` (3 dosya)
- `list_all_accounts.py`
- `fix_beyza2_mappings.py`
- `create_beyza2_mappings.py`
- `populate_all_data.py`

**Çözüm:** `scripts/` klasörü oluştur:
```
backend/
└── scripts/
    ├── __init__.py
    ├── create_test_data.py
    ├── create_student.py
    ├── setup_beyza2_scores_data.py
    ├── reset_admin_password.py
    ├── reset_student_password.py
    ├── reset_superadmin_password.py
    └── list_all_accounts.py
```

#### 6. Log Dosyaları Git'te
**Sorun:** `logs/acurate.log` git'te olmamalı.

**Çözüm:** `.gitignore`'a ekle (zaten var ama dosya git'te kalmış):
```bash
# Git'ten kaldır
git rm --cached backend/logs/acurate.log
```

---

### ⚠️ ORTA ÖNCELİKLİ SORUNLAR

#### 7. Validators Dosyası Yok
**Sorun:** Custom validators yok.

**Eksik:**
- `api/validators.py` dosyası yok
- Validation logic serializers içinde

**Çözüm:** `api/validators.py` oluştur:
```python
# api/validators.py
from rest_framework import validators

def validate_student_id(value):
    # Custom validation
    pass
```

#### 8. Managers Dosyası Yok
**Sorun:** Custom model manager'lar yok.

**Eksik:**
- `api/managers.py` dosyası yok
- Model query'leri her yerde tekrarlanıyor

**Çözüm:** `api/managers.py` oluştur:
```python
# api/managers.py
from django.db import models

class ActiveUserManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)
```

#### 9. Constants Dosyası Yok
**Sorun:** Magic number'lar ve string'ler kod içinde.

**Eksik:**
- `api/constants.py` dosyası yok
- Hardcoded değerler her yerde

**Çözüm:** `api/constants.py` oluştur:
```python
# api/constants.py
# Assessment types
ASSESSMENT_TYPES = [
    ('MIDTERM', 'Midterm Exam'),
    ('FINAL', 'Final Exam'),
    # ...
]

# Default values
DEFAULT_TARGET_PERCENTAGE = 70
DEFAULT_PAGE_SIZE = 20
```

#### 10. Forms Dosyası Yok (Opsiyonel)
**Sorun:** Admin panel için custom form'lar yok.

**Eksik:**
- `api/forms.py` dosyası yok
- Admin'de default form'lar kullanılıyor

**Not:** REST API projesi olduğu için forms opsiyonel.

#### 11. Mixins Dosyası Yok
**Sorun:** Reusable view mixin'leri yok.

**Eksik:**
- `api/mixins.py` dosyası yok
- Ortak logic her view'da tekrarlanıyor

**Çözüm:** `api/mixins.py` oluştur:
```python
# api/mixins.py
from rest_framework import mixins

class LoggedInUserMixin:
    """Mixin to add logged in user to context"""
    pass
```

#### 12. Throttling Dosyası Yok
**Sorun:** Custom throttling class'ları yok.

**Eksik:**
- `api/throttling.py` dosyası yok
- Rate limiting sadece middleware'de

**Çözüm:** `api/throttling.py` oluştur:
```python
# api/throttling.py
from rest_framework.throttling import UserRateThrottle

class LoginThrottle(UserRateThrottle):
    rate = '5/minute'
```

---

### 📋 DÜŞÜK ÖNCELİKLİ EKSİKLER

#### 13. Schemas Dosyası Yok (drf-spectacular için)
**Sorun:** API schema customization yok.

**Eksik:**
- `api/schemas.py` dosyası yok
- Swagger dokümantasyonu otomatik

**Not:** drf-spectacular otomatik schema oluşturuyor, opsiyonel.

#### 14. Renderers Dosyası Yok
**Sorun:** Custom response renderer'lar yok.

**Eksik:**
- `api/renderers.py` dosyası yok
- Sadece JSON renderer kullanılıyor

**Not:** JSON yeterli, opsiyonel.

#### 15. Parsers Dosyası Yok
**Sorun:** Custom request parser'lar yok.

**Eksik:**
- `api/parsers.py` dosyası yok
- Sadece JSON parser kullanılıyor

**Not:** JSON yeterli, opsiyonel.

---

## 📊 ÖNERİLEN KLASÖR YAPISI

### İdeal Django REST API Yapısı

```
backend/
├── api/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── urls.py
│   ├── utils.py
│   ├── exceptions.py
│   ├── middleware.py
│   ├── signals.py
│   ├── cache_utils.py
│   │
│   ├── permissions.py          # ❌ EKSİK
│   ├── filters.py              # ❌ EKSİK
│   ├── pagination.py           # ❌ EKSİK
│   ├── validators.py           # ❌ EKSİK
│   ├── managers.py             # ❌ EKSİK
│   ├── constants.py            # ❌ EKSİK
│   ├── mixins.py               # ❌ EKSİK
│   ├── throttling.py           # ❌ EKSİK
│   │
│   ├── views/                  # ⚠️ views.py yerine klasör
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── dashboards.py
│   │   ├── super_admin.py
│   │   ├── analytics.py
│   │   ├── contact.py
│   │   └── viewsets/
│   │       ├── __init__.py
│   │       ├── user.py
│   │       ├── course.py
│   │       ├── grade.py
│   │       └── ...
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_models.py
│   │   ├── test_views.py
│   │   ├── test_serializers.py
│   │   ├── test_signals.py
│   │   └── test_permissions.py
│   │
│   ├── migrations/
│   │   └── ...
│   │
│   └── management/
│       └── commands/
│           └── ...
│
├── backend/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py           # Base settings
│   │   ├── development.py    # Development settings
│   │   ├── production.py     # Production settings
│   │   └── test.py           # Test settings
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
│
├── scripts/                   # ⚠️ Test scriptleri buraya
│   ├── __init__.py
│   ├── create_test_data.py
│   ├── reset_passwords.py
│   └── ...
│
├── static/                     # ⚠️ Static files
├── media/                      # ⚠️ Media files
├── logs/                       # ⚠️ Log files (git'te olmamalı)
│
├── manage.py
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🎯 ÖNCELİKLİ DÜZELTMELER

### 🔴 Hemen Yapılmalı (1 Hafta)

1. **Views.py'yı Modüllere Ayır**
   - `api/views/` klasörü oluştur
   - View'ları kategorilere göre ayır
   - `urls.py`'yi güncelle

2. **Permissions Dosyası Oluştur**
   - `api/permissions.py` oluştur
   - Custom permission class'ları ekle
   - View'ları güncelle

3. **Test Scriptlerini Taşı**
   - `scripts/` klasörü oluştur
   - Tüm test scriptlerini taşı
   - README'yi güncelle

4. **Log Dosyasını Git'ten Kaldır**
   - `git rm --cached backend/logs/acurate.log`
   - `.gitignore` kontrol et

### 🟡 Yakın Zamanda (2-4 Hafta)

5. **Filters Dosyası Oluştur**
   - `api/filters.py` oluştur
   - DRF FilterSet class'ları ekle

6. **Pagination Dosyası Oluştur**
   - `api/pagination.py` oluştur
   - Custom pagination class'ları ekle

7. **Validators Dosyası Oluştur**
   - `api/validators.py` oluştur
   - Custom validators ekle

8. **Constants Dosyası Oluştur**
   - `api/constants.py` oluştur
   - Magic number'ları ve string'leri taşı

### 🟢 Gelecekte (1-3 Ay)

9. **Managers Dosyası Oluştur**
10. **Mixins Dosyası Oluştur**
11. **Throttling Dosyası Oluştur**
12. **Settings'i Modüllere Ayır**

---

## 📝 SONUÇ

### Mevcut Durum
- ✅ Temel yapı iyi
- ⚠️ Views.py çok büyük (refactor gerekli)
- ❌ Birçok standart Django dosyası eksik

### Öncelikler
1. **Views refactoring** - En yüksek öncelik
2. **Permissions** - Güvenlik için önemli
3. **Test scriptleri** - Organizasyon için
4. **Filters & Pagination** - API kalitesi için

### Tahmini Süre
- **Hemen yapılmalı:** 1 hafta
- **Yakın zamanda:** 2-4 hafta
- **Toplam:** 1-2 ay

---

**Son Güncelleme:** Aralık 2024


