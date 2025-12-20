# 🧪 Push Öncesi Test Kontrolü

GitHub'a push etmeden önce testlerin geçip geçmediğini kontrol etmek için kullanın.

## 🚀 Hızlı Başlangıç

```bash
cd backend
python scripts/test_before_push.py
```

veya

```bash
cd backend
./scripts/test_before_push.sh
```

## ✅ Ne Yapar?

1. **Docker Kontrolü**: Docker'ın çalışıp çalışmadığını kontrol eder
   - ❌ Docker çalışmıyorsa: Hata verir ve Docker'ı başlatmayı önerir

2. **PostgreSQL Kontrolü**: Docker PostgreSQL bağlantısını kontrol eder
   - ✅ Bağlantı varsa: PostgreSQL kullanır (production benzeri)
   - ❌ Bağlantı yoksa: Hata verir ve Docker PostgreSQL'i başlatmayı önerir

2. **Test Çalıştırma**: 
   - Deprecated Django TestCase dosyalarını hariç tutar
   - Sadece pytest testlerini çalıştırır
   - Slow testleri hariç tutar (hızlı feedback)
   - Coverage raporu oluşturur

3. **Sonuç**:
   - ✅ **Başarılı**: Tüm testler geçti, push edebilirsiniz
   - ❌ **Başarısız**: Testler başarısız, push etmeden önce düzeltin

## 📊 Coverage Raporu

Testler başarılı olduğunda, coverage raporu şu dosyada oluşturulur:
- `htmlcov/index.html` - Tarayıcıda açabilirsiniz

## ⚙️ Özelleştirme

### Sadece Belirli Testleri Çalıştır

```bash
# Sadece model testleri
pytest api/tests/test_models_pytest.py -v

# Sadece API testleri
pytest api/tests/test_api_pytest.py -v

# Sadece unit testler (integration hariç)
pytest -m "unit" -v
```

### Slow Testleri Dahil Et

```bash
# Tüm testleri çalıştır (slow dahil)
pytest api/tests/ -v --ignore=api/tests/test_models.py \
                  --ignore=api/tests/test_api.py \
                  --ignore=api/tests/test_serializers.py \
                  --ignore=api/tests/test_permissions.py \
                  --ignore=api/tests/test_integration.py
```

## 🔄 Pre-commit Hook (Opsiyonel)

Her commit'te otomatik test çalıştırmak için:

```bash
# .git/hooks/pre-commit dosyası oluştur
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
cd backend
python scripts/test_before_push.py
EOF

chmod +x .git/hooks/pre-commit
```

**Not:** Pre-commit hook, her commit'te testleri çalıştırır. Bu biraz yavaş olabilir. Alternatif olarak sadece push öncesi manuel çalıştırabilirsiniz.

## 🐛 Sorun Giderme

### Docker Çalışmıyor

```bash
# Docker'ı başlat
docker-compose up -d

# Docker durumunu kontrol et
docker ps
```

### PostgreSQL Bağlantı Hatası

Eğer PostgreSQL bağlantısı başarısız olursa:

1. **Docker PostgreSQL container'ının çalıştığını kontrol edin:**
   ```bash
   docker ps | grep postgres
   ```

2. **PostgreSQL container'ını başlatın:**
   ```bash
   cd ..  # Proje root dizinine
   docker-compose up -d
   ```

3. **PostgreSQL loglarını kontrol edin:**
   ```bash
   docker logs <postgresql-container-name>
   ```

4. **PostgreSQL bağlantısını manuel test edin:**
   ```bash
   python -c "import psycopg2; psycopg2.connect(dbname='acurate_db', user='acurate_user', password='acurate_pass_2024', host='localhost', port='5432')"
   ```

### Test Başarısız Olursa

1. Hata mesajını okuyun
2. İlgili test dosyasını kontrol edin
3. Düzeltmeleri yapın
4. Tekrar test edin

### Coverage Raporu Görünmüyor

```bash
# Coverage raporunu manuel oluştur
pytest --cov=api --cov-report=html
open htmlcov/index.html  # macOS
```

## 📝 Notlar

- Script, deprecated Django TestCase dosyalarını otomatik olarak hariç tutar
- Sadece pytest testleri çalıştırılır
- Slow testler hariç tutulur (hızlı feedback için)
- Coverage raporu `htmlcov/index.html` dosyasında oluşturulur
- Test settings: `backend/backend/test_settings.py`

