# 🚀 Production Quick Start Guide

Bu kısa rehber, AcuRate projesini production'a almak için en kritik adımları içerir.

## ⚡ Hızlı Başlangıç (5 Dakika)

### 1. Environment Variables

```bash
# .env dosyasında mutlaka olması gerekenler
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<güvenli-random-key>
DJANGO_ALLOWED_HOSTS=api.acurate.com,www.acurate.com
CORS_ALLOWED_ORIGINS=https://acurate.com,https://www.acurate.com
CSRF_TRUSTED_ORIGINS=https://acurate.com,https://www.acurate.com

# Database
POSTGRES_HOST=postgres
POSTGRES_DB=acurate_db
POSTGRES_USER=acurate_user
POSTGRES_PASSWORD=<güvenli-şifre>

# Redis (Production için zorunlu)
CACHE_BACKEND=redis
REDIS_URL=redis://redis:6379/1

# Email
SENDGRID_API_KEY=<sendgrid-api-key>
DEFAULT_FROM_EMAIL=noreply@acurate.com

# Security
SECURE_SSL_REDIRECT=True
```

### 2. Database Migration

```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### 3. Gunicorn ile Çalıştırma

```bash
gunicorn backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --timeout 30 \
    --max-requests 1000 \
    --max-requests-jitter 50
```

### 4. Nginx Configuration

```nginx
upstream django {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.acurate.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.acurate.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /static/ {
        alias /app/staticfiles/;
        expires 30d;
    }
}
```

## 🔥 Kritik Kontroller

- [ ] `DEBUG=False` ✅
- [ ] `SECRET_KEY` güvenli ✅
- [ ] `ALLOWED_HOSTS` doğru ✅
- [ ] Redis aktif ✅
- [ ] Database connection pooling aktif ✅
- [ ] SSL/TLS aktif ✅
- [ ] Rate limiting aktif ✅
- [ ] Monitoring kurulu (Sentry) ✅

## 📚 Detaylı Rehber

Tüm detaylar için `PRODUCTION_SCALABILITY_GUIDE.md` dosyasına bakın.
