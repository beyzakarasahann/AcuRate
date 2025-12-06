# 📄 Django Projesi - Eksik Dosyalar ve Gereksinimler

**Tarih:** Aralık 2024  
**Proje:** AcuRate Backend

---

## ❌ EKSİK DOSYALAR

### 🔴 Yüksek Öncelikli Eksikler

#### 1. `api/permissions.py` ❌
**Durum:** Yok  
**Gereklilik:** Yüksek  
**Açıklama:** Custom permission class'ları için ayrı dosya yok.

**İçermesi Gerekenler:**
```python
# api/permissions.py
from rest_framework import permissions
from .models import User

class IsStudent(permissions.BasePermission):
    """Only students can access"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == User.Role.STUDENT

class IsTeacher(permissions.BasePermission):
    """Only teachers can access"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == User.Role.TEACHER

class IsInstitution(permissions.BasePermission):
    """Only institution admins can access"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == User.Role.INSTITUTION

class IsSuperAdmin(permissions.BasePermission):
    """Only super admins can access"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser

class IsOwnerOrReadOnly(permissions.BasePermission):
    """Object-level permission"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user
```

**Kullanım:**
```python
# views.py
from .permissions import IsStudent, IsTeacher

class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStudent]
```

---

#### 2. `api/filters.py` ❌
**Durum:** Yok  
**Gereklilik:** Yüksek  
**Açıklama:** DRF FilterSet class'ları için ayrı dosya yok.

**İçermesi Gerekenler:**
```python
# api/filters.py
import django_filters
from django_filters import rest_framework as filters
from .models import Course, Assessment, StudentGrade, User

class CourseFilter(filters.FilterSet):
    """Filter for Course model"""
    code = filters.CharFilter(lookup_expr='icontains')
    name = filters.CharFilter(lookup_expr='icontains')
    department = filters.CharFilter(field_name='department', lookup_expr='icontains')
    semester = filters.NumberFilter()
    academic_year = filters.CharFilter(lookup_expr='icontains')
    teacher = filters.NumberFilter()
    
    class Meta:
        model = Course
        fields = ['code', 'name', 'department', 'semester', 'academic_year', 'teacher']

class AssessmentFilter(filters.FilterSet):
    """Filter for Assessment model"""
    course = filters.NumberFilter()
    assessment_type = filters.ChoiceFilter(choices=Assessment.AssessmentType.choices)
    title = filters.CharFilter(lookup_expr='icontains')
    
    class Meta:
        model = Assessment
        fields = ['course', 'assessment_type', 'title']

class UserFilter(filters.FilterSet):
    """Filter for User model"""
    role = filters.ChoiceFilter(choices=User.Role.choices)
    department = filters.CharFilter(lookup_expr='icontains')
    is_active = filters.BooleanFilter()
    
    class Meta:
        model = User
        fields = ['role', 'department', 'is_active']
```

**Kullanım:**
```python
# views.py
from .filters import CourseFilter
from django_filters.rest_framework import DjangoFilterBackend

class CourseViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend]
    filterset_class = CourseFilter
```

---

#### 3. `api/pagination.py` ❌
**Durum:** Yok  
**Gereklilik:** Yüksek  
**Açıklama:** Custom pagination class'ları için ayrı dosya yok.

**İçermesi Gerekenler:**
```python
# api/pagination.py
from rest_framework.pagination import PageNumberPagination, LimitOffsetPagination

class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination - 20 items per page"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'

class LargeResultsSetPagination(PageNumberPagination):
    """Large pagination - 100 items per page"""
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000
    page_query_param = 'page'

class SmallResultsSetPagination(PageNumberPagination):
    """Small pagination - 10 items per page"""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50
    page_query_param = 'page'

class CustomLimitOffsetPagination(LimitOffsetPagination):
    """Custom limit/offset pagination"""
    default_limit = 20
    limit_query_param = 'limit'
    offset_query_param = 'offset'
    max_limit = 100
```

**Kullanım:**
```python
# views.py
from .pagination import StandardResultsSetPagination

class CourseViewSet(viewsets.ModelViewSet):
    pagination_class = StandardResultsSetPagination
```

---

#### 4. `api/validators.py` ❌
**Durum:** Yok  
**Gereklilik:** Orta  
**Açıklama:** Custom validators için ayrı dosya yok.

**İçermesi Gerekenler:**
```python
# api/validators.py
from rest_framework import serializers
from django.core.validators import ValidationError
import re

def validate_student_id(value):
    """Validate student ID format"""
    if not value:
        return value
    
    # Example: 2024XXXX format
    pattern = r'^\d{4}[A-Z0-9]{4}$'
    if not re.match(pattern, value):
        raise ValidationError('Student ID must be in format: YYYYXXXX (e.g., 2024ABC1)')
    return value

def validate_email_domain(value):
    """Validate email domain"""
    allowed_domains = ['acibadem.edu.tr', 'live.acibadem.edu.tr']
    domain = value.split('@')[1] if '@' in value else ''
    
    if domain not in allowed_domains:
        raise ValidationError(f'Email must be from allowed domains: {", ".join(allowed_domains)}')
    return value

def validate_percentage(value):
    """Validate percentage value (0-100)"""
    if value < 0 or value > 100:
        raise ValidationError('Percentage must be between 0 and 100')
    return value

def validate_weight_sum(weights):
    """Validate that weights sum to 100"""
    total = sum(weights)
    if abs(total - 100) > 0.01:  # Allow small floating point errors
        raise ValidationError(f'Weights must sum to 100, got {total}')
    return weights
```

**Kullanım:**
```python
# serializers.py
from .validators import validate_student_id, validate_percentage

class UserSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(validators=[validate_student_id])
```

---

#### 5. `api/managers.py` ❌
**Durum:** Yok  
**Gereklilik:** Orta  
**Açıklama:** Custom model manager'lar için ayrı dosya yok.

**İçermesi Gerekenler:**
```python
# api/managers.py
from django.db import models
from django.db.models import Q

class ActiveUserManager(models.Manager):
    """Manager for active users only"""
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)

class StudentManager(models.Manager):
    """Manager for students only"""
    def get_queryset(self):
        return super().get_queryset().filter(role=User.Role.STUDENT)

class TeacherManager(models.Manager):
    """Manager for teachers only"""
    def get_queryset(self):
        return super().get_queryset().filter(role=User.Role.TEACHER)

class InstitutionManager(models.Manager):
    """Manager for institutions only"""
    def get_queryset(self):
        return super().get_queryset().filter(role=User.Role.INSTITUTION)

class ActiveCourseManager(models.Manager):
    """Manager for active courses"""
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)
```

**Kullanım:**
```python
# models.py
from .managers import ActiveUserManager, StudentManager

class User(AbstractUser):
    # ... fields ...
    
    objects = models.Manager()
    active = ActiveUserManager()
    students = StudentManager()
```

---

#### 6. `api/constants.py` ❌
**Durum:** Yok  
**Gereklilik:** Orta  
**Açıklama:** Constants ve magic number'lar için ayrı dosya yok.

**İçermesi Gerekenler:**
```python
# api/constants.py

# Assessment Types
ASSESSMENT_TYPES = [
    ('MIDTERM', 'Midterm Exam'),
    ('FINAL', 'Final Exam'),
    ('QUIZ', 'Quiz'),
    ('HOMEWORK', 'Homework'),
    ('PROJECT', 'Project'),
    ('LAB', 'Lab Work'),
    ('PRESENTATION', 'Presentation'),
    ('OTHER', 'Other'),
]

# Semester Choices
SEMESTER_CHOICES = [
    (1, 'Fall'),
    (2, 'Spring'),
    (3, 'Summer'),
]

# Default Values
DEFAULT_TARGET_PERCENTAGE = 70
DEFAULT_PAGE_SIZE = 20
DEFAULT_MAX_PAGE_SIZE = 100

# Cache Timeouts (seconds)
CACHE_TIMEOUT_SHORT = 60      # 1 minute
CACHE_TIMEOUT_MEDIUM = 300    # 5 minutes
CACHE_TIMEOUT_LONG = 3600     # 1 hour
CACHE_TIMEOUT_ANALYTICS = 600 # 10 minutes

# Rate Limiting
RATE_LIMIT_LOGIN = '5/minute'
RATE_LIMIT_API = '100/hour'
RATE_LIMIT_UPLOAD = '10/hour'

# File Upload Limits
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif']
ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

# Email Settings
EMAIL_SUBJECT_PREFIX = '[AcuRate] '
DEFAULT_FROM_EMAIL = 'noreply@acurate.com'

# Pagination
PAGE_SIZE_STANDARD = 20
PAGE_SIZE_LARGE = 100
PAGE_SIZE_SMALL = 10
```

**Kullanım:**
```python
# views.py
from .constants import DEFAULT_PAGE_SIZE, CACHE_TIMEOUT_MEDIUM

class CourseViewSet(viewsets.ModelViewSet):
    pagination_class = StandardResultsSetPagination
```

---

#### 7. `api/mixins.py` ❌
**Durum:** Yok  
**Gereklilik:** Orta  
**Açıklama:** Reusable view mixin'leri için ayrı dosya yok.

**İçermesi Gerekenler:**
```python
# api/mixins.py
from rest_framework.response import Response
from rest_framework import status
from .utils import log_activity, get_institution_for_user
from .models import ActivityLog

class LoggedInUserMixin:
    """Mixin to add logged in user to serializer context"""
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        return context

class ActivityLogMixin:
    """Mixin to automatically log view actions"""
    def perform_create(self, serializer):
        instance = serializer.save()
        log_activity(
            action_type=ActivityLog.ActionType.CREATE,
            user=self.request.user,
            institution=get_institution_for_user(self.request.user),
            description=f"Created {self.get_queryset().model.__name__}",
            related_object_type=self.get_queryset().model.__name__,
            related_object_id=instance.id
        )
        return instance
    
    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(
            action_type=ActivityLog.ActionType.UPDATE,
            user=self.request.user,
            institution=get_institution_for_user(self.request.user),
            description=f"Updated {self.get_queryset().model.__name__}",
            related_object_type=self.get_queryset().model.__name__,
            related_object_id=instance.id
        )
        return instance
    
    def perform_destroy(self, instance):
        log_activity(
            action_type=ActivityLog.ActionType.DELETE,
            user=self.request.user,
            institution=get_institution_for_user(self.request.user),
            description=f"Deleted {self.get_queryset().model.__name__}",
            related_object_type=self.get_queryset().model.__name__,
            related_object_id=instance.id
        )
        instance.delete()

class CacheResponseMixin:
    """Mixin to cache view responses"""
    cache_timeout = 300  # 5 minutes
    
    def dispatch(self, *args, **kwargs):
        # Cache logic here
        return super().dispatch(*args, **kwargs)
```

**Kullanım:**
```python
# views.py
from .mixins import ActivityLogMixin, LoggedInUserMixin

class CourseViewSet(ActivityLogMixin, LoggedInUserMixin, viewsets.ModelViewSet):
    # ...
```

---

#### 8. `api/throttling.py` ❌
**Durum:** Yok  
**Gereklilik:** Düşük  
**Açıklama:** Custom throttling class'ları için ayrı dosya yok.

**İçermesi Gerekenler:**
```python
# api/throttling.py
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle, ScopedRateThrottle

class LoginThrottle(UserRateThrottle):
    """Throttle login attempts"""
    rate = '5/minute'

class UploadThrottle(UserRateThrottle):
    """Throttle file uploads"""
    rate = '10/hour'

class APIThrottle(UserRateThrottle):
    """General API throttle"""
    rate = '100/hour'

class AnonThrottle(AnonRateThrottle):
    """Throttle anonymous users"""
    rate = '20/hour'
```

**Kullanım:**
```python
# views.py
from .throttling import LoginThrottle

@api_view(['POST'])
@throttle_classes([LoginThrottle])
def login_view(request):
    # ...
```

---

### ⚠️ Orta Öncelikli Eksikler

#### 9. `api/querysets.py` ❌
**Durum:** Yok  
**Gereklilik:** Düşük  
**Açıklama:** Custom queryset class'ları için ayrı dosya (opsiyonel).

---

#### 10. `api/schemas.py` ❌
**Durum:** Yok  
**Gereklilik:** Düşük  
**Açıklama:** drf-spectacular schema customization için (opsiyonel).

---

## 📁 EKSİK KLASÖR YAPILARI

### 1. `api/views/` Klasörü ❌
**Durum:** Yok  
**Gereklilik:** Yüksek  
**Açıklama:** `views.py` çok büyük (3477 satır), modüllere ayrılmalı.

**Önerilen Yapı:**
```
api/views/
├── __init__.py
├── auth.py              # Authentication views
├── dashboards.py        # Dashboard views
├── super_admin.py       # Super admin views
├── analytics.py         # Analytics views
├── contact.py           # Contact views
└── viewsets/
    ├── __init__.py
    ├── user.py
    ├── course.py
    ├── grade.py
    ├── assessment.py
    └── ...
```

---

### 2. `api/tests/` Klasörü ❌
**Durum:** Yok  
**Gereklilik:** Orta  
**Açıklama:** Test dosyaları organize edilmeli.

**Önerilen Yapı:**
```
api/tests/
├── __init__.py
├── test_models.py
├── test_views.py
├── test_serializers.py
├── test_permissions.py
├── test_signals.py
└── test_utils.py
```

---

### 3. `backend/settings/` Klasörü ❌
**Durum:** Yok  
**Gereklilik:** Orta  
**Açıklama:** Settings modüllere ayrılmalı.

**Önerilen Yapı:**
```
backend/settings/
├── __init__.py
├── base.py           # Base settings
├── development.py   # Development settings
├── production.py    # Production settings
└── test.py          # Test settings
```

---

### 4. `scripts/` Klasörü ❌
**Durum:** Yok  
**Gereklilik:** Yüksek  
**Açıklama:** Test scriptleri root'ta, organize edilmeli.

**Önerilen Yapı:**
```
backend/scripts/
├── __init__.py
├── create_test_data.py
├── create_student.py
├── setup_beyza2_scores_data.py
├── reset_admin_password.py
├── reset_student_password.py
├── reset_superadmin_password.py
└── list_all_accounts.py
```

---

## 📊 ÖNCELİK MATRİSİ

| Dosya/Klasör | Öncelik | Gereklilik | Tahmini Süre |
|--------------|---------|------------|--------------|
| `api/permissions.py` | 🔴 Yüksek | Yüksek | 2 saat |
| `api/filters.py` | 🔴 Yüksek | Yüksek | 3 saat |
| `api/pagination.py` | 🔴 Yüksek | Yüksek | 1 saat |
| `api/views/` klasörü | 🔴 Yüksek | Yüksek | 1 gün |
| `scripts/` klasörü | 🔴 Yüksek | Yüksek | 1 saat |
| `api/validators.py` | 🟡 Orta | Orta | 2 saat |
| `api/managers.py` | 🟡 Orta | Orta | 2 saat |
| `api/constants.py` | 🟡 Orta | Orta | 1 saat |
| `api/mixins.py` | 🟡 Orta | Orta | 3 saat |
| `api/tests/` klasörü | 🟡 Orta | Orta | 2 saat |
| `api/throttling.py` | 🟢 Düşük | Düşük | 1 saat |
| `backend/settings/` klasörü | 🟢 Düşük | Düşük | 2 saat |

---

## 🎯 ÖNERİLEN UYGULAMA SIRASI

### Hafta 1 (Kritik)
1. ✅ `api/permissions.py` oluştur
2. ✅ `api/filters.py` oluştur
3. ✅ `api/pagination.py` oluştur
4. ✅ `scripts/` klasörü oluştur ve dosyaları taşı

### Hafta 2 (Önemli)
5. ✅ `api/views/` klasörü oluştur ve views.py'yı modüllere ayır
6. ✅ `api/validators.py` oluştur
7. ✅ `api/constants.py` oluştur

### Hafta 3-4 (İyileştirme)
8. ✅ `api/managers.py` oluştur
9. ✅ `api/mixins.py` oluştur
10. ✅ `api/tests/` klasörü oluştur

---

**Son Güncelleme:** Aralık 2024

