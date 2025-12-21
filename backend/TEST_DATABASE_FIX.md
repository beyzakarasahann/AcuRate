# Test Veritabanı Sorun Çözümü

## Sorun

SystemExit: 2 hatası - "permission denied to create database"

## Çözüm

### 1. PostgreSQL Kullanıcısına CREATEDB İzni Ver

```bash
docker exec acurate_postgres psql -U acurate_user -d acurate_db -c "ALTER USER acurate_user CREATEDB;"
```

### 2. Test Veritabanını Önceden Oluştur

```bash
docker exec acurate_postgres psql -U acurate_user -d postgres -c "DROP DATABASE IF EXISTS test_acurate_db;"
docker exec acurate_postgres psql -U acurate_user -d postgres -c "CREATE DATABASE test_acurate_db OWNER acurate_user;"
```

### 3. Test Veritabanını Hazırla (Migrations)

```bash
cd backend
DJANGO_SETTINGS_MODULE=backend.test_settings python manage.py migrate --database=default --run-syncdb
```

### 4. Testleri Çalıştır

```bash
cd backend
python scripts/test_before_push.py
```

## Notlar

- `--reuse-db` flag'i mevcut test veritabanını kullanır
- `--nomigrations` flag'i migrations'ı atlar (testleri hızlandırır)
- Test veritabanı migrations ile hazırlanmışsa, testler daha hızlı çalışır
- Test veritabanı boşsa, pytest-django test sırasında gerekli tabloları oluşturur

## Otomatik Çözüm

Test script'i (`test_before_push.py`) test veritabanını otomatik kontrol eder ve gerekirse uyarı verir.

## Docker Init Script

`docker/postgres/init-test-user.sh` dosyası yeni container'larda otomatik olarak CREATEDB izni verir.


