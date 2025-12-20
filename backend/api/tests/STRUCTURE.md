# Test Klasörü Yapısı

Bu doküman test klasörünün modüler yapısını açıklar.

## 📁 Klasör Yapısı

```
api/tests/
├── __init__.py                 # Test package initialization
├── conftest.py                 # Pytest fixtures (shared) ✅
│
├── utils/                      # Test utilities (modüler) ✅
│   ├── __init__.py
│   ├── test_constants.py       # Test constants
│   ├── test_data_factories.py  # Data factory functions
│   └── test_assertions.py      # Assertion helpers
│
├── test_models_pytest.py       # Model tests (Pytest) ✅
├── test_models_additional.py   # Additional model tests ✅
│
├── test_api_pytest.py          # API tests (Pytest) ✅
│
├── test_serializers_pytest.py  # Serializer tests (Pytest) ✅
├── test_serializers_additional.py  # Additional serializer tests ✅
│
├── test_views_auth.py          # Auth view tests ✅
├── test_views_dashboards.py    # Dashboard view tests ✅
├── test_views_health.py         # Health check view tests ✅
├── test_views_contact.py       # Contact view tests ✅
├── test_views_analytics.py     # Analytics view tests ✅
│
├── test_permissions_pytest.py  # Permission tests (Pytest) ✅
├── test_integration_pytest.py  # Integration tests (Pytest) ✅
├── test_utils.py               # Utility function tests ✅
├── test_critical_security.py   # Critical security tests ✅
│
├── ⚠️ DEPRECATED (Kaldırılacak):
├── test_base.py                # Django TestCase base (deprecated)
├── test_models.py              # Django TestCase (deprecated)
├── test_api.py                 # Django TestCase (deprecated)
├── test_serializers.py         # Django TestCase (deprecated)
├── test_permissions.py         # Django TestCase (deprecated)
├── test_integration.py         # Django TestCase (deprecated)
│
├── README.md                   # Test documentation
├── TEST_COVERAGE.md            # Coverage documentation
├── CI_TEST_GUIDE.md            # CI/CD guide
├── MIGRATION_GUIDE.md          # Migration guide (Django TestCase → Pytest)
└── STRUCTURE.md                # This file
```

## 🏗️ Modüler Yapı

### 1. **Base Layer** (Temel Katman)

- **`conftest.py`**: Pytest fixtures - Tüm testler için ortak fixtures ✅
- **`test_base.py`**: ⚠️ DEPRECATED - Django TestCase base class (kaldırılacak)

### 2. **Utilities Layer** (Yardımcı Katman)

- **`utils/test_constants.py`**: Sabitler (magic string'ler yerine)
- **`utils/test_data_factories.py`**: Test data factory fonksiyonları
- **`utils/test_assertions.py`**: Ortak assertion helper'ları

### 3. **Test Layer** (Test Katmanı)

#### Model Tests (Pytest) ✅
- `test_models_pytest.py` - Model testleri (pytest)
- `test_models_additional.py` - Ek model testleri (pytest)

#### API Tests (Pytest) ✅
- `test_api_pytest.py` - API endpoint testleri (pytest)

#### View Tests (Modüler - Her view ayrı dosya) ✅
- `test_views_auth.py` - Authentication views (pytest)
- `test_views_dashboards.py` - Dashboard views (pytest)
- `test_views_health.py` - Health check views (pytest)
- `test_views_contact.py` - Contact views (pytest)
- `test_views_analytics.py` - Analytics views (pytest)

#### Specialized Tests (Pytest) ✅
- `test_permissions_pytest.py` - Permission tests (pytest)
- `test_serializers_pytest.py` - Serializer tests (pytest)
- `test_serializers_additional.py` - Ek serializer testleri (pytest)
- `test_integration_pytest.py` - Integration tests (pytest)
- `test_utils.py` - Utility function tests (pytest)
- `test_critical_security.py` - Critical security tests (pytest)

#### ⚠️ Deprecated (Kaldırılacak)
- `test_models.py` → `test_models_pytest.py` kullan
- `test_api.py` → `test_api_pytest.py` kullan
- `test_serializers.py` → `test_serializers_pytest.py` kullan
- `test_permissions.py` → `test_permissions_pytest.py` kullan
- `test_integration.py` → `test_integration_pytest.py` kullan

## 📦 Modülerlik Prensipleri

### ✅ Single Responsibility
Her test dosyası tek bir sorumluluğa sahip:
- Model testleri → Model validation
- View testleri → View functionality
- Permission testleri → Access control

### ✅ DRY (Don't Repeat Yourself)
- Ortak kod `conftest.py` ve `utils/` klasöründe
- Factory fonksiyonları tekrar kullanılabilir
- Assertion helper'ları ortak pattern'ler için

### ✅ Separation of Concerns
- Test data creation → `test_data_factories.py`
- Test assertions → `test_assertions.py`
- Test constants → `test_constants.py`
- Test fixtures → `conftest.py`

### ✅ Maintainability
- Her dosya belirli bir amaç için
- Kolay bulunabilir ve değiştirilebilir
- Yeni testler eklemek kolay

### ✅ Tek Framework (Pytest)
- Tüm testler pytest formatında
- Django TestCase deprecated
- Modüler yapı korunuyor

## 🔧 Kullanım Örnekleri

### Factory Kullanımı

```python
from api.tests.utils import create_test_user, create_test_course

def test_something():
    user = create_test_user(role=User.Role.STUDENT)
    course = create_test_course(teacher=user)
```

### Assertion Helper Kullanımı

```python
from api.tests.utils import assert_response_success, assert_unauthorized

def test_endpoint():
    response = api_client.get('/api/endpoint/')
    assert_response_success(response)
    
    response = api_client.get('/api/protected/')
    assert_unauthorized(response)
```

### Constants Kullanımı

```python
from api.tests.utils import TEST_PASSWORD, TEST_DEPARTMENT

def test_user_creation():
    user = User.objects.create_user(
        username='test',
        password=TEST_PASSWORD,
        department=TEST_DEPARTMENT
    )
```

## 📊 Test Organizasyonu

### By Type (Türüne Göre)
- Model tests
- API tests
- View tests
- Serializer tests

### By Format (Formatına Göre)
- ✅ Pytest (önerilen - tek framework)
- ⚠️ Django TestCase (deprecated - kaldırılacak)

### By Purpose (Amacına Göre)
- Unit tests
- Integration tests
- Security tests
- Permission tests

## 🎯 Best Practices

1. **Yeni test eklerken:**
   - ✅ Pytest kullan (Django TestCase değil)
   - ✅ Mevcut factory'leri kullan
   - ✅ Constants kullan (magic string'ler yerine)
   - ✅ Assertion helper'ları kullan

2. **Ortak kod için:**
   - ✅ `conftest.py` → Pytest fixtures
   - ✅ `utils/` → Helper functions
   - ⚠️ `test_base.py` → DEPRECATED (kaldırılacak)

3. **Test dosyası organizasyonu:**
   - Her view için ayrı dosya
   - İlgili testler birlikte
   - Açıklayıcı dosya isimleri

## ⚠️ Deprecated Dosyalar

Aşağıdaki dosyalar deprecated olarak işaretlendi ve gelecekte kaldırılacak:

- `test_base.py` → `conftest.py` fixtures kullan
- `test_models.py` → `test_models_pytest.py` kullan
- `test_api.py` → `test_api_pytest.py` kullan
- `test_serializers.py` → `test_serializers_pytest.py` kullan
- `test_permissions.py` → `test_permissions_pytest.py` kullan
- `test_integration.py` → `test_integration_pytest.py` kullan

Detaylar için `MIGRATION_GUIDE.md` dosyasına bakın.

## 🔄 Gelecek İyileştirmeler

- [ ] Deprecated dosyaları kaldır
- [ ] Test data builder pattern
- [ ] Mock helpers
- [ ] Test data cleanup utilities
- [ ] Performance test utilities
- [ ] Test report generators
