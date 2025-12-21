# CI/CD Test Yapılandırması

Bu doküman, GitHub Actions CI/CD pipeline'ında testlerin nasıl çalıştığını açıklar.

## GitHub Actions Workflow Yapılandırması

### Test Çalıştırma Komutu

CI'da testler şu şekilde çalıştırılır:

```bash
pytest api/tests/ -v \
  --ds=backend.test_settings \
  --create-db \
  --cov=api \
  --cov-report=xml \
  --cov-report=term \
  --cov-report=html \
  --tb=short \
  --strict-markers \
  -m "not slow"
```

### Önemli Farklar: Local vs CI

| Özellik | Local Development | CI/CD |
|---------|------------------|-------|
| Settings Module | `backend.settings` | `backend.test_settings` |
| Database | `--reuse-db` (hızlı) | `--create-db` (temiz) |
| Migrations | `--nomigrations` (hızlı) | Migrations çalıştırılır |
| Slow Tests | Tüm testler | `-m "not slow"` (hızlı testler) |
| Coverage | HTML + XML | XML (Codecov için) |

### CI Ortam Değişkenleri

```yaml
DJANGO_SECRET_KEY: test-secret-key-for-ci-only
DJANGO_DEBUG: False
DJANGO_SETTINGS_MODULE: backend.test_settings
POSTGRES_DB: acurate_db
POSTGRES_USER: acurate_user
POSTGRES_PASSWORD: acurate_pass_2024
POSTGRES_HOST: localhost
POSTGRES_PORT: 5432
PYTEST_CURRENT_TEST: true
```

### Test Adımları

1. **PostgreSQL Setup**: PostgreSQL 16 container başlatılır
2. **Dependencies**: `requirements.txt`'den paketler yüklenir
3. **Migrations**: `python manage.py migrate` çalıştırılır
4. **Django Checks**: `python manage.py check` çalıştırılır
5. **Pytest Tests**: Tüm testler çalıştırılır
6. **Coverage Upload**: Codecov'a yüklenir

### Coverage Raporlama

- **Terminal**: `--cov-report=term` - Console'da gösterilir
- **XML**: `--cov-report=xml` - Codecov için
- **HTML**: `--cov-report=html` - Detaylı rapor (artifacts olarak saklanabilir)

### Marker Kullanımı

CI'da yavaş testler atlanır:
```bash
-m "not slow"
```

Test marker'ları:
- `@pytest.mark.unit` - Unit testler
- `@pytest.mark.integration` - Integration testler
- `@pytest.mark.api` - API testleri
- `@pytest.mark.slow` - Yavaş testler (CI'da atlanır)

### Local Development

Local'de test çalıştırmak için:

```bash
# Tüm testler (hızlı, reuse-db kullanır)
pytest

# Yeni database ile (migration'lar çalışır)
pytest --create-db

# Sadece unit testler
pytest -m unit

# Coverage ile
pytest --cov=api --cov-report=html
```

### Sorun Giderme

#### Test Settings Bulunamıyor

Eğer `backend.test_settings` bulunamıyorsa:
- `backend/backend/test_settings.py` dosyasının var olduğundan emin olun
- `DJANGO_SETTINGS_MODULE` environment variable'ını kontrol edin

#### Database Bağlantı Hatası

CI'da database bağlantı hatası alıyorsanız:
- PostgreSQL service'inin çalıştığından emin olun
- Environment variable'ların doğru olduğunu kontrol edin
- `pg_isready` komutunun başarılı olduğunu kontrol edin

#### Coverage Raporu Oluşmuyor

Coverage raporu oluşmuyorsa:
- `pytest-cov` paketinin yüklü olduğundan emin olun
- `--cov=api` flag'inin doğru olduğunu kontrol edin
- `coverage.xml` dosyasının oluştuğunu kontrol edin

### Best Practices

1. **CI'da her zaman `--create-db` kullanın** - Temiz database garantisi
2. **Slow testleri marker ile işaretleyin** - CI'da atlanabilir
3. **Coverage threshold belirleyin** - Minimum coverage seviyesi
4. **Test isolation** - Her test bağımsız çalışmalı
5. **Deterministic tests** - Aynı input her zaman aynı output

### Örnek Test Marker Kullanımı

```python
@pytest.mark.slow
@pytest.mark.integration
def test_complex_integration():
    """Bu test CI'da atlanır, local'de çalışır"""
    pass

@pytest.mark.unit
def test_fast_unit():
    """Bu test hem CI'da hem local'de çalışır"""
    pass
```


