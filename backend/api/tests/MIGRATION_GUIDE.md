# Test Migration Guide: Django TestCase → Pytest

Bu doküman, Django TestCase formatından pytest formatına geçişi açıklar.

## 🎯 Amaç

Tüm testleri **pytest formatına** birleştirmek ve **tek bir framework** kullanmak.

## 📋 Durum

### ✅ Pytest Formatına Geçirildi

- ✅ `test_models_pytest.py` - Model testleri
- ✅ `test_models_additional.py` - Ek model testleri
- ✅ `test_api_pytest.py` - API endpoint testleri
- ✅ `test_serializers_pytest.py` - Serializer testleri
- ✅ `test_serializers_additional.py` - Ek serializer testleri
- ✅ `test_permissions_pytest.py` - Permission testleri
- ✅ `test_integration_pytest.py` - Integration testleri
- ✅ `test_views_*.py` - Tüm view testleri (pytest)
- ✅ `test_critical_security.py` - Security testleri (pytest)
- ✅ `test_utils.py` - Utility testleri (pytest)

### ⚠️ Deprecated (Kaldırılacak)

- ⚠️ `test_models.py` → `test_models_pytest.py` kullan
- ⚠️ `test_api.py` → `test_api_pytest.py` kullan
- ⚠️ `test_serializers.py` → `test_serializers_pytest.py` kullan
- ⚠️ `test_permissions.py` → `test_permissions_pytest.py` kullan
- ⚠️ `test_integration.py` → `test_integration_pytest.py` kullan
- ⚠️ `test_base.py` → `conftest.py` fixtures kullan

## 🔄 Geçiş Örnekleri

### Örnek 1: Model Test

**Eski (Django TestCase):**
```python
from django.test import TestCase
from .test_base import BaseTestCase

class UserModelTest(BaseTestCase):
    def test_user_creation(self):
        self.assertIn('test_student', self.student.username)
        self.assertEqual(self.student.role, User.Role.STUDENT)
```

**Yeni (Pytest):**
```python
import pytest

@pytest.mark.model
@pytest.mark.unit
class TestUserModel:
    def test_user_creation(self, student_user):
        assert 'test_student' in student_user.username
        assert student_user.role == User.Role.STUDENT
```

### Örnek 2: API Test

**Eski (Django TestCase):**
```python
class ProgramOutcomeAPITest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
    
    def test_create_po(self):
        self.client.force_authenticate(user=self.institution)
        response = self.client.post('/api/program-outcomes/', {...})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
```

**Yeni (Pytest):**
```python
@pytest.mark.api
@pytest.mark.integration
class TestProgramOutcomeAPI:
    def test_create_po(self, authenticated_institution_client, db):
        response = authenticated_institution_client.post('/api/program-outcomes/', {...})
        assert response.status_code == status.HTTP_201_CREATED
```

### Örnek 3: Assertion Değişiklikleri

**Eski:**
```python
self.assertEqual(a, b)
self.assertIn(item, container)
self.assertTrue(condition)
self.assertRaises(Exception, func)
```

**Yeni:**
```python
assert a == b
assert item in container
assert condition is True
with pytest.raises(Exception):
    func()
```

## 🛠️ Kullanılabilir Fixtures

Tüm testler için `conftest.py`'den fixtures kullanılabilir:

- `api_client` - APIClient
- `student_user`, `teacher_user`, `institution_user` - Test users
- `department`, `program_outcome_1`, `program_outcome_2` - Test data
- `course`, `enrollment`, `assessment` - Course data
- `learning_outcome_1` - Learning outcome
- `student_grade`, `po_achievement`, `lo_achievement` - Achievement data
- `authenticated_student_client`, `authenticated_teacher_client`, `authenticated_institution_client` - Authenticated clients

## 📝 Yeni Test Yazarken

1. **Pytest kullan** - Django TestCase değil
2. **Fixtures kullan** - `conftest.py`'den
3. **Factory functions kullan** - `utils/test_data_factories.py`'den
4. **Assertion helpers kullan** - `utils/test_assertions.py`'den
5. **Constants kullan** - `utils/test_constants.py`'den
6. **Marker'lar ekle** - `@pytest.mark.unit`, `@pytest.mark.integration`, vb.

## 🗑️ Eski Dosyaları Kaldırma Planı

1. **Şimdi**: Eski dosyalar deprecated olarak işaretlendi
2. **Sonraki versiyon**: Eski dosyalar kaldırılacak
3. **Geçiş süresi**: Mevcut testler çalışmaya devam eder

## ✅ Avantajlar

1. **Tek framework** - Sadece pytest
2. **Daha az kod tekrarı** - Fixtures ve utilities
3. **Daha iyi organizasyon** - Modüler yapı
4. **Daha kolay bakım** - Tek bir format
5. **Daha iyi tooling** - Pytest plugin'leri

## 🚀 Test Çalıştırma

```bash
# Tüm pytest testleri (önerilen)
pytest

# Sadece pytest formatındaki testler
pytest -k "not test_models and not test_api and not test_serializers and not test_permissions and not test_integration"

# Veya deprecated dosyaları hariç tut
pytest --ignore=api/tests/test_models.py \
       --ignore=api/tests/test_api.py \
       --ignore=api/tests/test_serializers.py \
       --ignore=api/tests/test_permissions.py \
       --ignore=api/tests/test_integration.py
```

