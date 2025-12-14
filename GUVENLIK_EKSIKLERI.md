# AcuRate Projesi - Güvenlik Eksikleri ve Öneriler

**Tarih:** 2024  
**Proje:** AcuRate - Academic Performance Analysis System  
**Versiyon:** 1.0.0

---

## 📋 İçindekiler

1. [Kritik Güvenlik Sorunları](#kritik-güvenlik-sorunları)
2. [Yüksek Öncelikli Sorunlar](#yüksek-öncelikli-sorunlar)
3. [Orta Öncelikli Sorunlar](#orta-öncelikli-sorunlar)
4. [Düşük Öncelikli Sorunlar](#düşük-öncelikli-sorunlar)
5. [Genel Öneriler](#genel-öneriler)

---

## 🔴 Kritik Güvenlik Sorunları

### 1. Hardcoded Secret Key ve Varsayılan Şifreler

**Konum:** `backend/backend/settings.py:44`

**Sorun:**
```python
SECRET_KEY = 'django-insecure-g#z9@_6j&#)fl!x#ymg^71a!n_jv_jpt1yh-_337xpf_n1wx0!'
```

**Risk:** Production ortamında güvenliği tamamen zayıflatır. Django'nun tüm güvenlik mekanizmaları bu key'e bağlıdır.

**Çözüm:**
- Production'da mutlaka güçlü, rastgele bir SECRET_KEY kullanılmalı
- `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` ile oluşturulmalı
- Environment variable olarak saklanmalı, asla kod içinde hardcode edilmemeli

---

### 2. JWT Token'ların localStorage'da Saklanması

**Konum:** `frontend/src/lib/api.ts:330-360`

**Sorun:**
```typescript
static setTokens(access: string, refresh: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, access);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh);
    }
}
```

**Risk:** XSS (Cross-Site Scripting) saldırılarına karşı savunmasız. Saldırgan localStorage'dan token'ları çalabilir.

**Çözüm:**
- Token'ları `httpOnly` cookie'lerde saklamak (en güvenli)
- Alternatif: `sessionStorage` kullanmak (daha güvenli ama hala XSS'e açık)
- XSS koruması için Content Security Policy (CSP) header'ları eklemek

---

### 3. Geçici Şifrelerin API Response'unda Döndürülmesi

**Konum:** `backend/api/views/auth.py:415-421`, `backend/api/serializers/user.py:182`

**Sorun:**
```python
if temp_password:
    response_data["credentials"] = {
        "username": teacher.username,
        "password": temp_password,
        "email": teacher.email
    }
```

**Risk:** Geçici şifreler API response'unda düz metin olarak gönderiliyor. Log'larda veya network trafiğinde görülebilir.

**Çözüm:**
- Geçici şifreleri asla API response'unda döndürmemek
- Sadece email ile göndermek
- Email gönderilemezse, admin panelinde gösterilmeli (API üzerinden değil)

---

### 4. Database Şifrelerinin Docker Compose'da Varsayılan Değerlerle

**Konum:** `docker-compose.yml:9`

**Sorun:**
```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-acurate_pass_2024}
```

**Risk:** Varsayılan şifre zayıf ve tahmin edilebilir. Production'da büyük güvenlik riski.

**Çözüm:**
- Production'da mutlaka güçlü, rastgele şifreler kullanmak
- Environment variable olarak set etmek
- Şifreleri `.env` dosyasında saklamak ve `.gitignore`'a eklemek

---

### 5. CORS Yapılandırması Sadece Localhost

**Konum:** `backend/backend/settings.py:223-226`

**Sorun:**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

**Risk:** Production'da frontend domain'i eklenmezse CORS hatası olur. Yanlış yapılandırma güvenlik açığı yaratabilir.

**Çözüm:**
- Production domain'lerini environment variable'dan almak
- Wildcard (`*`) kullanmamak
- `CORS_ALLOW_CREDENTIALS = True` ile birlikte dikkatli kullanmak

---

## 🟠 Yüksek Öncelikli Sorunlar

### 6. Hesap Kilitleme Mekanizması Yok

**Konum:** `backend/api/views/auth.py:login_view`

**Sorun:** Başarısız login denemelerinde hesap kilitleme yok. Brute-force saldırılarına açık.

**Çözüm:**
- Başarısız login denemelerini saymak
- 5 başarısız denemeden sonra hesabı geçici olarak kilitlemek
- Rate limiting ile birlikte IP bazlı kısıtlama eklemek

---

### 7. Şifre Sıfırlama Rate Limiting Yetersiz

**Konum:** `backend/api/views/auth.py:145-169`

**Sorun:** Şifre sıfırlama için sadece 3 dakika rate limiting var. Bu çok kısa ve spam'e açık.

**Çözüm:**
- Rate limiting'i en az 15 dakikaya çıkarmak
- IP bazlı rate limiting eklemek
- Email gönderim sayısını da sınırlamak

---

### 8. File Upload Güvenlik Kontrolleri Eksik

**Konum:** `backend/api/views/file_upload.py`

**Sorunlar:**
- Dosya tipi kontrolü sadece extension'a bakıyor
- Dosya içeriği doğrulaması yetersiz (sadece image verification var)
- Virus taraması yok
- Dosya boyutu limiti var ama yeterli değil

**Çözüm:**
- MIME type kontrolü eklemek
- Dosya içeriğini gerçekten doğrulamak (magic bytes kontrolü)
- Virus tarama servisi entegrasyonu (ClamAV gibi)
- Dosya adlarını sanitize etmek (path traversal koruması)
- Upload edilen dosyaları izole bir dizinde saklamak

---

### 9. CSV Import İşlemlerinde Input Validation Eksik

**Konum:** `backend/api/views/bulk_operations.py`

**Sorunlar:**
- CSV dosya boyutu kontrolü yok
- Satır sayısı limiti yok (DoS saldırısına açık)
- CSV içeriği doğrulaması yetersiz
- Encoding kontrolü yok

**Çözüm:**
- Maksimum dosya boyutu: 10MB
- Maksimum satır sayısı: 10,000
- CSV encoding kontrolü (UTF-8 zorunlu)
- Her satır için detaylı validation
- Transaction rollback mekanizması (zaten var ama iyileştirilebilir)

---

### 10. Error Message'lerde Bilgi Sızıntısı

**Konum:** `backend/api/exceptions.py`, `backend/api/views/auth.py`

**Sorun:** Bazı error message'ler sistem hakkında fazla bilgi veriyor.

**Örnek:**
```python
# backend/api/views/auth.py:136-142
if not user:
    return Response({
        'success': True,
        'message': 'If an account with this username/email exists, a temporary password has been sent.'
    })
```

**Not:** Bu örnekte iyi yapılmış (user existence leak yok), ama diğer yerlerde kontrol edilmeli.

**Çözüm:**
- Generic error message'ler kullanmak
- Stack trace'leri production'da göstermemek
- Detaylı hataları sadece log'larda saklamak

---

### 11. Security Headers Eksik

**Konum:** `backend/backend/settings.py:61-71`

**Sorun:** Security header'lar sadece production'da aktif (DEBUG=False). Development'ta da bazıları aktif olmalı.

**Eksik Header'lar:**
- Content-Security-Policy (CSP)
- Referrer-Policy
- Permissions-Policy
- X-Content-Type-Options (var ama kontrol edilmeli)

**Çözüm:**
- Django Security Middleware'i kullanmak
- `django-csp` paketi eklemek
- Tüm security header'ları yapılandırmak

---

### 12. Log'larda Hassas Bilgi Kaydı

**Konum:** `backend/api/middleware.py:68-76`, `backend/api/serializers/user.py:144-147`

**Sorun:** Log'larda geçici şifreler ve diğer hassas bilgiler kaydediliyor.

**Örnek:**
```python
logger.warning(
    f"SendGrid API key not configured. Email not sent to {user.email}. "
    f"User created successfully. Username: {user.username}, Password: {temp_password}"
)
```

**Çözüm:**
- Şifreleri log'larda asla kaydetmemek
- Hassas bilgileri mask'lamak (örn: `password=***`)
- Log sanitization fonksiyonu yazmak

---

## 🟡 Orta Öncelikli Sorunlar

### 13. Session Management Eksiklikleri

**Konum:** `backend/backend/settings.py:249-255`

**Sorunlar:**
- Concurrent session kontrolü yok (aynı kullanıcı birden fazla cihazdan login olabilir)
- Session timeout yok
- Token revocation mekanizması sınırlı (sadece blacklist)

**Çözüm:**
- Kullanıcı başına maksimum aktif session sayısı
- Session timeout eklemek
- Device tracking ve şüpheli aktivite tespiti

---

### 14. Password Policy Yetersiz

**Konum:** `backend/api/views/viewsets.py:138-142`

**Sorun:** Sadece minimum 8 karakter kontrolü var. Güçlü şifre politikası yok.

**Çözüm:**
- En az 1 büyük harf
- En az 1 küçük harf
- En az 1 rakam
- En az 1 özel karakter
- Yaygın şifreler listesi kontrolü (Have I Been Pwned API)

---

### 15. Rate Limiting Yetersiz

**Konum:** `backend/api/middleware.py:37-41`

**Sorun:** Rate limiting sadece production'da aktif ve çok genel (100 request/dakika/IP).

**Sorunlar:**
- Endpoint bazlı rate limiting yok
- Kullanıcı bazlı rate limiting yok
- Farklı endpoint'ler için farklı limitler yok

**Çözüm:**
- `django-ratelimit` veya `django-axes` kullanmak
- Endpoint bazlı rate limiting
- Login endpoint'i için özel rate limiting (örn: 5/dakika)

---

### 16. Input Sanitization Eksiklikleri

**Konum:** Tüm serializer'lar ve view'lar

**Sorun:** Kullanıcı girdilerinde HTML/script tag'leri kontrol edilmiyor.

**Risk:** XSS saldırılarına açık (özellikle frontend'de render edilen verilerde).

**Çözüm:**
- Django'nun `django.utils.html.escape` kullanmak
- Frontend'de output encoding
- Rich text editor kullanılıyorsa sanitization library (bleach gibi)

---

### 17. API Documentation Güvenlik Kontrolü

**Konum:** `backend/backend/settings.py:258-270`

**Sorun:** API documentation (drf-spectacular) production'da erişilebilir olabilir.

**Risk:** API endpoint'leri ve yapıları hakkında bilgi sızıntısı.

**Çözüm:**
- Production'da API documentation'ı kapatmak veya authentication gerektirmek
- Sadece development'ta aktif etmek

---

### 18. Database Query Optimization ve N+1 Problemleri

**Konum:** Tüm view'lar

**Sorun:** Bazı query'lerde `select_related` ve `prefetch_related` eksik olabilir.

**Risk:** DoS saldırılarına açık (yavaş query'ler).

**Çözüm:**
- Query profiling yapmak
- `django-debug-toolbar` ile analiz
- Gerekli yerlerde `select_related` ve `prefetch_related` eklemek

---

### 19. Email Güvenliği

**Konum:** `backend/backend/settings.py:27-28`, `backend/api/serializers/user.py:259-260`

**Sorun:** SSL verification skip mekanizması var (development için).

**Risk:** Production'da yanlışlıkla aktif kalırsa MITM saldırılarına açık.

**Çözüm:**
- Production'da SSL verification skip'i kesinlikle kapalı olmalı
- Environment variable kontrolü eklemek
- Warning log'u eklemek

---

### 20. Activity Log Güvenliği

**Konum:** `backend/api/models/misc.py` (ActivityLog model)

**Sorun:** Activity log'larda hassas bilgiler kaydediliyor olabilir.

**Çözüm:**
- Log'larda şifre, token gibi hassas bilgileri kaydetmemek
- PII (Personally Identifiable Information) mask'lamak
- Log retention policy belirlemek

---

## 🟢 Düşük Öncelikli Sorunlar

### 21. Dependency Güvenlik Kontrolü

**Konum:** `backend/requirements.txt`

**Sorun:** Dependency'lerin güvenlik açıkları kontrol edilmemiş.

**Çözüm:**
- `safety` veya `pip-audit` kullanarak düzenli kontrol
- `dependabot` veya `renovate` entegrasyonu
- Düzenli dependency güncellemeleri

---

### 22. Environment Variable Validation

**Konum:** `backend/backend/settings.py`

**Sorun:** Environment variable'lar validate edilmiyor.

**Çözüm:**
- Startup'ta kritik environment variable'ları kontrol etmek
- Eksik veya geçersiz değerlerde uyarı vermek

---

### 23. Backup ve Recovery Planı

**Sorun:** Backup stratejisi belirtilmemiş.

**Çözüm:**
- Düzenli database backup'ları
- Backup encryption
- Recovery planı dokümante etmek

---

### 24. Monitoring ve Alerting

**Sorun:** Güvenlik olayları için monitoring yok.

**Çözüm:**
- Failed login attempt monitoring
- Suspicious activity detection
- Alerting mekanizması (email/Slack)

---

### 25. Security Testing

**Sorun:** Otomatik güvenlik testleri yok.

**Çözüm:**
- Penetration testing
- Security scanning tools (OWASP ZAP, Burp Suite)
- Automated security tests in CI/CD

---

## 📝 Genel Öneriler

### Güvenlik Best Practices

1. **Defense in Depth:** Birden fazla güvenlik katmanı kullanmak
2. **Least Privilege:** Kullanıcılara sadece gerekli yetkileri vermek
3. **Security by Design:** Güvenliği baştan tasarıma dahil etmek
4. **Regular Updates:** Düzenli güvenlik güncellemeleri
5. **Security Training:** Geliştirici ekibine güvenlik eğitimi

### Öncelik Sırası

1. **Hemen Düzeltilmeli (Kritik):**
   - Hardcoded secret key
   - JWT token storage
   - Geçici şifrelerin API'de döndürülmesi
   - Database şifreleri

2. **Yakın Zamanda Düzeltilmeli (Yüksek):**
   - Hesap kilitleme
   - File upload güvenliği
   - Rate limiting iyileştirmeleri
   - Security headers

3. **Planlanmalı (Orta):**
   - Session management
   - Password policy
   - Input sanitization
   - Monitoring

### Güvenlik Checklist

- [x] Secret key environment variable'a taşındı ✅ (settings.py - DJANGO_SECRET_KEY)
- [ ] JWT token'lar httpOnly cookie'de saklanıyor (Frontend değişikliği gerekli)
- [x] Geçici şifreler API response'unda döndürülmüyor ✅ (auth.py, super_admin.py düzeltildi)
- [x] Database şifreleri güçlü ve environment variable'da ✅ (docker-compose.yml + .env)
- [x] CORS production domain'leri için yapılandırıldı ✅ (settings.py - CORS_ALLOWED_ORIGINS_PROD)
- [x] Hesap kilitleme mekanizması eklendi ✅ (auth.py - 5 deneme/15 dk blok)
- [x] File upload güvenlik kontrolleri eklendi ✅ (file_upload.py - MIME, magic bytes, blocklist)
- [x] Rate limiting iyileştirildi ✅ (middleware.py - 100 req/dk production)
- [x] Security headers eklendi ✅ (settings.py - HSTS, XSS, CSP, Referrer-Policy)
- [x] Log'larda hassas bilgi kaydı kaldırıldı ✅ (serializers/user.py düzeltildi)
- [x] Password policy güçlendirildi ✅ (validators.py - PasswordComplexityValidator)
- [x] Input sanitization eklendi ✅ (validators.py - XSS koruması, serializers güncellendi)
- [ ] Security testing yapıldı (Manuel test gerekli)

---

## 📚 Kaynaklar

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security Best Practices](https://docs.djangoproject.com/en/stable/topics/security/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

---

**Not:** Bu dokümantasyon, projenin mevcut durumuna göre hazırlanmıştır. Düzenli olarak güncellenmeli ve yeni güvenlik açıkları eklendiğinde revize edilmelidir.

