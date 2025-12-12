# 🔒 Production Deployment Checklist

**Tarih:** 2 Aralık 2024

---

## ✅ YAPILAN GÜVENLİK İYİLEŞTİRMELERİ

### 1. SECRET_KEY Kontrolü
- ✅ Production'da SECRET_KEY environment variable zorunlu
- ✅ Default insecure key sadece DEBUG=True'da kullanılıyor
- ✅ Production'da insecure key kullanılırsa warning veriyor

### 2. Environment Variables
- ✅ `.env.example` dosyası oluşturuldu
- ✅ Tüm güvenlik ayarları environment variable'lardan okunuyor

---

## 🔴 PRODUCTION'A DEPLOY ETMEDEN ÖNCE YAPILMASI GEREKENLER

### 1. Environment Variables Ayarla

`.env` dosyası oluştur ve doldur:

```bash
cd backend
cp .env.example .env
# .env dosyasını düzenle
```

**Zorunlu Değişkenler:**
```env
DJANGO_SECRET_KEY=<güçlü-random-string-50-karakter>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

**Güçlü SECRET_KEY Oluştur:**
```python
# Python shell'de:
import secrets
secrets.token_urlsafe(50)
```

### 2. Database Ayarları

Production database için:
```env
DB_NAME=acurate_production
DB_USER=acurate_prod_user
DB_PASSWORD=<güçlü-şifre>
DB_HOST=your-db-host
DB_PORT=5432
```

### 3. Security Headers

Production'da otomatik aktif olacak:
- ✅ `SECURE_SSL_REDIRECT` (HTTPS zorunlu)
- ✅ `SESSION_COOKIE_SECURE = True`
- ✅ `CSRF_COOKIE_SECURE = True`
- ✅ `SECURE_HSTS_SECONDS = 31536000` (1 yıl)
- ✅ `X_FRAME_OPTIONS = 'DENY'`

### 4. CORS Ayarları

Production domain'lerini ekle:
```env
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 5. SendGrid Email

Production'da sandbox mode'u kapat:
```env
SENDGRID_SANDBOX_MODE=False
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

---

## ⚠️ ÖNEMLİ NOTLAR

1. **SECRET_KEY:** Asla git'e commit etme! `.env` dosyası `.gitignore`'da olmalı.
2. **DEBUG:** Production'da mutlaka `False` olmalı.
3. **ALLOWED_HOSTS:** Production domain'lerini ekle.
4. **HTTPS:** Production'da mutlaka HTTPS kullan.

---

## 🧪 TEST ETME

### Development'ta Test:
```bash
# .env dosyasında:
DJANGO_DEBUG=True
DJANGO_SECRET_KEY=test-key

# Backend çalıştır
python manage.py runserver
```

### Production Simülasyonu:
```bash
# .env dosyasında:
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<güçlü-key>
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Test et
python manage.py check --deploy
```

---

## 📋 DEPLOYMENT ADIMLARI

1. ✅ `.env.example` dosyasını `.env` olarak kopyala
2. ✅ Tüm environment variable'ları doldur
3. ✅ `DJANGO_DEBUG=False` set et
4. ✅ Güçlü `SECRET_KEY` oluştur
5. ✅ `ALLOWED_HOSTS` production domain'lerini ekle
6. ✅ Database migration'ları uygula
7. ✅ Static files collect et: `python manage.py collectstatic`
8. ✅ `python manage.py check --deploy` çalıştır
9. ✅ Test et

---

**Son Güncelleme:** 2 Aralık 2024


