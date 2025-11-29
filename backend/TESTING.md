# 🧪 AcuRate - Test Kılavuzu

Bu doküman, AcuRate projesi için test coverage'ın nasıl çalıştırılacağını ve geliştirileceğini açıklar.

## 📋 İçindekiler

- [Kurulum](#kurulum)
- [Test Çalıştırma](#test-çalıştırma)
- [Test Coverage](#test-coverage)
- [Test Yapısı](#test-yapısı)
- [Yeni Test Yazma](#yeni-test-yazma)

---

## 🚀 Kurulum

### 1. Test Dependencies Kurulumu

```bash
cd backend
pip install -r requirements.txt
```

Test dependencies:
- `pytest` - Test framework
- `pytest-django` - Django integration
- `pytest-cov` - Coverage plugin
- `coverage` - Coverage tool

### 2. Test Database Ayarları

Testler otomatik olarak ayrı bir test database kullanır. Herhangi bir ayar gerekmez.

---

## ▶️ Test Çalıştırma

### Tüm Testleri Çalıştır

```bash
# Django test runner ile
python manage.py test

# pytest ile (önerilen)
pytest

# Verbose mode
pytest -v

# Belirli bir test dosyası
pytest api/tests.py

# Belirli bir test class
pytest api/tests.py::UserModelTest

# Belirli bir test method
pytest api/tests.py::UserModelTest::test_user_creation
```

### Test Kategorileri

```bash
# Sadece model testleri
pytest api/tests.py::UserModelTest api/tests.py::ProgramOutcomeModelTest

# Sadece API testleri
pytest api/tests.py::AuthenticationAPITest api/tests.py::ProgramOutcomeAPITest

# Sadece permission testleri
pytest api/tests.py::PermissionTest
```

---

## 📊 Test Coverage

### Coverage Raporu Oluştur

```bash
# Coverage ile test çalıştır
pytest --cov=api --cov-report=html --cov-report=term

# Sadece terminal raporu
pytest --cov=api --cov-report=term

# HTML raporu oluştur (htmlcov/ klasöründe)
pytest --cov=api --cov-report=html
```

### Coverage Raporunu Görüntüle

```bash
# HTML raporunu aç
open htmlcov/index.html  # macOS
# veya
xdg-open htmlcov/index.html  # Linux
```

### Coverage Hedefleri

- **Mevcut:** ~0% (testler yeni eklendi)
- **Hedef:** 70%+ (3 ay içinde)
- **İdeal:** 80%+

### Coverage Kapsamı

Test suite şunları kapsar:
- ✅ Model tests (User, PO, LO, Course, Assessment, etc.)
- ✅ API endpoint tests (CRUD operations)
- ✅ Permission tests (Role-based access)
- ✅ Calculation tests (PO/LO achievements)
- ✅ Serializer validation tests
- ✅ Integration tests (Complete workflows)

---

## 🏗️ Test Yapısı

### Test Dosya Yapısı

```
backend/api/tests.py
├── BaseTestCase (Common setup)
├── Model Tests
│   ├── UserModelTest
│   ├── ProgramOutcomeModelTest
│   ├── LearningOutcomeModelTest
│   ├── CourseModelTest
│   ├── AssessmentModelTest
│   ├── StudentGradeModelTest
│   ├── StudentPOAchievementModelTest
│   └── StudentLOAchievementModelTest
├── API Endpoint Tests
│   ├── AuthenticationAPITest
│   ├── ProgramOutcomeAPITest
│   ├── LearningOutcomeAPITest
│   ├── CourseAPITest
│   └── StudentGradeAPITest
├── Permission Tests
│   └── PermissionTest
├── Calculation Tests
│   └── CalculationTest
├── Serializer Validation Tests
│   └── SerializerValidationTest
└── Integration Tests
    └── IntegrationTest
```

### BaseTestCase

Tüm testler için ortak setup sağlar:
- Test users (student, teacher, institution)
- Test department
- Test Program Outcomes
- Test Course
- Test Enrollment
- Test Assessment
- Test Learning Outcome

---

## ✍️ Yeni Test Yazma

### 1. Model Test Örneği

```python
class MyModelTest(BaseTestCase):
    """Test MyModel"""
    
    def test_model_creation(self):
        """Test model creation"""
        obj = MyModel.objects.create(
            field1='value1',
            field2='value2'
        )
        self.assertEqual(obj.field1, 'value1')
    
    def test_model_validation(self):
        """Test model validation"""
        with self.assertRaises(ValidationError):
            invalid_obj = MyModel(field1='invalid')
            invalid_obj.full_clean()
```

### 2. API Test Örneği

```python
class MyAPITest(BaseTestCase):
    """Test My API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
    
    def test_create_endpoint(self):
        """Test create endpoint"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/my-endpoint/', {
            'field1': 'value1',
            'field2': 'value2'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['field1'], 'value1')
    
    def test_permission_check(self):
        """Test permission"""
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/my-endpoint/', {
            'field1': 'value1'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
```

### 3. Test Best Practices

1. **Test İsimlendirme:**
   - Test method isimleri açıklayıcı olmalı
   - `test_<what>_<expected_result>` formatı kullan

2. **Test Organizasyonu:**
   - Her test class bir model/feature için
   - Her test method bir senaryo için
   - Setup/teardown kullan

3. **Assertions:**
   - Açık ve anlaşılır assertion mesajları
   - Edge case'leri test et
   - Error case'leri test et

4. **Test Data:**
   - BaseTestCase'i kullan
   - Her test için gerekli minimum data
   - Test isolation sağla

---

## 🔍 Test Debugging

### Verbose Output

```bash
pytest -v -s  # Verbose + print statements
```

### PDB Debugger

```python
def test_something(self):
    import pdb; pdb.set_trace()  # Breakpoint
    # Test code
```

### Test Logging

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## 📈 Coverage İyileştirme

### Eksik Coverage Alanları

1. **Views.py:**
   - Dashboard endpoints
   - Analytics endpoints
   - Super admin endpoints

2. **Utils.py:**
   - log_activity function
   - get_institution_for_user function

3. **Serializers.py:**
   - Tüm serializer validations
   - Custom create/update methods

### Coverage Artırma Stratejisi

1. Önce kritik business logic'i test et
2. Sonra API endpoints'i test et
3. En son utility functions'ı test et

---

## 🐛 Bilinen Sorunlar

### Test Database

- Test database otomatik oluşturulur ve silinir
- Migration'lar otomatik çalışır

### Authentication

- `APIClient.force_authenticate()` kullan
- JWT token'lar test için gerekli değil

### Timezone

- `timezone.now()` kullan
- Test'lerde timezone-aware datetime kullan

---

## 📚 Kaynaklar

- [Django Testing](https://docs.djangoproject.com/en/stable/topics/testing/)
- [pytest-django](https://pytest-django.readthedocs.io/)
- [Coverage.py](https://coverage.readthedocs.io/)

---

## ✅ Test Checklist

Yeni feature eklerken:

- [ ] Model testleri yazıldı mı?
- [ ] API endpoint testleri yazıldı mı?
- [ ] Permission testleri yazıldı mı?
- [ ] Edge case'ler test edildi mi?
- [ ] Error case'ler test edildi mi?
- [ ] Integration test yazıldı mı?
- [ ] Coverage raporu kontrol edildi mi?

---

**Son Güncelleme:** 2024-11-29  
**Versiyon:** 1.0

