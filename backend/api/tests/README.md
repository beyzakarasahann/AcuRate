# AcuRate Test Suite

Bu proje pytest kullanarak Django unit testleri yapılandırılmıştır.

## Test Yapısı

### Modüler Yapı

Test klasörü modüler bir yapıya sahiptir:

```
api/tests/
├── conftest.py              # Pytest fixtures (shared)
├── test_base.py             # Django TestCase base class (deprecated)
├── utils/                   # Test utilities (modüler)
│   ├── test_constants.py    # Test constants
│   ├── test_data_factories.py  # Data factory functions
│   └── test_assertions.py   # Assertion helpers
└── test_*.py                # Test dosyaları
```

### 🚀 Push Öncesi Test Kontrolü

GitHub'a push etmeden önce testlerin geçip geçmediğini kontrol etmek için:

```bash
cd backend
python scripts/test_before_push.py
# veya
./scripts/test_before_push.sh
```

**Özellikler:**
- ✅ PostgreSQL bağlantısını otomatik kontrol eder
- ✅ PostgreSQL yoksa SQLite'a geçer (local test için)
- ✅ Deprecated test dosyalarını otomatik hariç tutar
- ✅ Slow testleri hariç tutar (hızlı test)
- ✅ Coverage raporu oluşturur
- ✅ Renkli çıktı (başarı/hata durumları)

Detaylar için: `backend/scripts/README.md`

### Pytest Yapılandırması

- **pytest.ini**: Ana pytest konfigürasyon dosyası
- **conftest.py**: Paylaşılan pytest fixtures
- **test_base.py**: Django TestCase tabanlı testler için base class (eski testler için)
- **utils/**: Modüler test utilities (constants, factories, assertions)

### Test Dosyaları

#### Pytest Formatı (Önerilen)
- `test_models_pytest.py`: Model testleri (pytest fixtures kullanarak)
- `test_api_pytest.py`: API endpoint testleri (pytest fixtures kullanarak)
- `test_models_additional.py`: Ek model testleri (Department, Enrollment, ContactRequest, ActivityLog, AssessmentLO, LOPO)
- `test_serializers_additional.py`: Ek serializer testleri
- `test_utils.py`: Utility fonksiyon testleri

#### Pytest Formatı (Önerilen - Tek Framework)
- `test_models_pytest.py`: Model testleri (pytest) - User, ProgramOutcome, LearningOutcome, Course, Assessment, StudentGrade, Achievements
- `test_models_additional.py`: Ek model testleri (Department, Enrollment, ContactRequest, ActivityLog, AssessmentLO, LOPO)
- `test_api_pytest.py`: API endpoint testleri (pytest)
- `test_serializers_pytest.py`: Serializer testleri (pytest)
- `test_serializers_additional.py`: Ek serializer testleri
- `test_permissions_pytest.py`: İzin testleri (pytest)
- `test_integration_pytest.py`: Entegrasyon testleri (pytest)

#### ⚠️ Deprecated (Kaldırılacak)
- `test_models.py` → `test_models_pytest.py` kullan
- `test_api.py` → `test_api_pytest.py` kullan
- `test_serializers.py` → `test_serializers_pytest.py` kullan
- `test_permissions.py` → `test_permissions_pytest.py` kullan
- `test_integration.py` → `test_integration_pytest.py` kullan
- `test_base.py` → `conftest.py` fixtures kullan

#### View Testleri (Pytest Formatı)
- `test_views_auth.py`: Authentication view testleri (login, logout, register, forgot_password, create_teacher, create_student)
- `test_views_dashboards.py`: Dashboard view testleri (student, teacher, institution dashboards)
- `test_views_health.py`: Health check view testleri (health, readiness, liveness)
- `test_views_contact.py`: Contact view testleri (create_contact_request, ContactRequestViewSet)
- `test_views_analytics.py`: Analytics view testleri (course_analytics_overview, course_analytics_detail)

#### Kritik Güvenlik Testleri (Pytest Formatı)
- `test_critical_security.py`: Kritik güvenlik ve işlevsellik testleri
  - Login/auth çalışıyor mu?
  - Yetkisiz erişim engelleniyor mu?
  - Kritik endpoint 500 atmıyor mu?
  - Boş input hata veriyor mu?

## Test Çalıştırma

### Tüm Testleri Çalıştırma

```bash
# Backend dizininde
cd backend
pytest

# Veya coverage ile
pytest --cov=api --cov-report=html
```

### Belirli Test Dosyalarını Çalıştırma

```bash
# Sadece model testleri
pytest api/tests/test_models_pytest.py

# Sadece API testleri
pytest api/tests/test_api_pytest.py

# Belirli bir test sınıfı
pytest api/tests/test_models_pytest.py::TestUserModel

# Belirli bir test fonksiyonu
pytest api/tests/test_models_pytest.py::TestUserModel::test_user_creation
```

### Marker'lara Göre Test Çalıştırma

```bash
# Sadece unit testler
pytest -m unit

# Sadece integration testler
pytest -m integration

# Sadece API testler
pytest -m api

# Sadece model testler
pytest -m model

# Sadece permission testler
pytest -m permission

# Yavaş testleri hariç tut
pytest -m "not slow"
```

### Verbose Mod

```bash
# Detaylı çıktı
pytest -v

# Çok detaylı çıktı
pytest -vv
```

### Coverage Raporu

```bash
# Terminal'de coverage raporu
pytest --cov=api --cov-report=term-missing

# HTML coverage raporu (htmlcov/ klasöründe oluşur)
pytest --cov=api --cov-report=html

# XML coverage raporu (CI/CD için)
pytest --cov=api --cov-report=xml
```

## Pytest Fixtures

### Kullanılabilir Fixtures

#### Kullanıcı Fixtures
- `student_user`: Test öğrenci kullanıcısı
- `teacher_user`: Test öğretmen kullanıcısı
- `institution_user`: Test kurum kullanıcısı

#### Model Fixtures
- `department`: Test departmanı
- `program_outcome_1`, `program_outcome_2`: Program çıktıları
- `course`: Test dersi
- `enrollment`: Test kaydı
- `assessment`: Test değerlendirmesi
- `learning_outcome_1`: Öğrenme çıktısı
- `student_grade`: Test notu
- `po_achievement`: PO başarı kaydı
- `lo_achievement`: LO başarı kaydı

#### API Client Fixtures
- `api_client`: Temel APIClient
- `authenticated_student_client`: Öğrenci olarak authenticate edilmiş client
- `authenticated_teacher_client`: Öğretmen olarak authenticate edilmiş client
- `authenticated_institution_client`: Kurum olarak authenticate edilmiş client

#### Composite Fixtures
- `complete_test_data`: Tüm test verilerini içeren dict

### Fixture Kullanım Örneği

```python
import pytest

@pytest.mark.model
def test_user_creation(student_user):
    """Test user creation"""
    assert 'test_student' in student_user.username
    assert student_user.role == User.Role.STUDENT

@pytest.mark.api
def test_create_po(authenticated_institution_client, db):
    """Test creating PO"""
    response = authenticated_institution_client.post('/api/program-outcomes/', {
        'code': 'PO_TEST',
        'title': 'Test PO',
        # ...
    })
    assert response.status_code == 201
```

## Test Markers

Testleri kategorize etmek için marker'lar kullanılır:

- `@pytest.mark.unit`: Unit testler (hızlı, izole)
- `@pytest.mark.integration`: Integration testler (daha yavaş, database kullanır)
- `@pytest.mark.api`: API endpoint testleri
- `@pytest.mark.model`: Model testleri
- `@pytest.mark.permission`: İzin testleri
- `@pytest.mark.serializer`: Serializer testleri
- `@pytest.mark.slow`: Yavaş çalışan testler

## Test Utilities (Modüler)

### Constants

```python
from api.tests.utils import TEST_PASSWORD, TEST_DEPARTMENT

user = User.objects.create_user(
    username='test',
    password=TEST_PASSWORD,
    department=TEST_DEPARTMENT
)
```

### Data Factories

```python
from api.tests.utils import create_test_user, create_test_course

user = create_test_user(role=User.Role.STUDENT)
course = create_test_course(teacher=user)
```

### Assertion Helpers

```python
from api.tests.utils import assert_response_success, assert_unauthorized

response = api_client.get('/api/endpoint/')
assert_response_success(response)

response = api_client.get('/api/protected/')
assert_unauthorized(response)
```

## Best Practices

1. **Fixtures Kullan**: Test verileri için fixtures kullan, setUp() yerine
2. **Factory Functions**: Test data için factory fonksiyonları kullan
3. **Constants Kullan**: Magic string'ler yerine constants kullan
4. **Assertion Helpers**: Ortak assertion pattern'leri için helper'lar kullan
5. **Marker'lar Ekle**: Testleri kategorize etmek için marker'lar kullan
6. **Assert Kullan**: `self.assertEqual()` yerine `assert` kullan
7. **Descriptive Names**: Test fonksiyon isimleri açıklayıcı olsun
8. **One Assertion Per Test**: Her test tek bir şeyi test etsin
9. **Use pytest.raises**: Exception testleri için `pytest.raises()` kullan
10. **Modüler Yapı**: İlgili testler ayrı dosyalarda, utilities paylaşılan klasörde

## ⚠️ Framework Seçimi

**✅ Pytest kullanıyoruz** - Tek framework, modüler yapı

### Pytest (Önerilen - Tek Framework)
```python
import pytest

@pytest.mark.model
@pytest.mark.unit
def test_something(student_user):
    assert student_user.username == 'test'
```

### ⚠️ Django TestCase (Deprecated)
Django TestCase formatındaki testler deprecated olarak işaretlendi ve gelecekte kaldırılacak.
Tüm yeni testler pytest formatında yazılmalıdır.

Detaylar için `MIGRATION_GUIDE.md` dosyasına bakın.

## Troubleshooting

### Database Lock Hatası
```bash
# Test database'ini yeniden oluştur
pytest --create-db
```

### Migration Hatası
```bash
# Migration'ları çalıştır
pytest --nomigrations  # Migration'ları atla (hızlı ama dikkatli)
```

### Coverage Raporu Görünmüyor
```bash
# HTML raporunu aç
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

## CI/CD Entegrasyonu

GitHub Actions için örnek:

```yaml
- name: Run tests
  run: |
    cd backend
    pytest --cov=api --cov-report=xml --cov-report=term

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./backend/coverage.xml
```

