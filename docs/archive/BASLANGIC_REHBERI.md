# 🚀 AcuRate - Hızlı Başlangıç Rehberi

## 📋 Ön Gereksinimler

- **Node.js** 18+ (Frontend için)
- **Python** 3.12+ (Backend için)
- **PostgreSQL** 14+ (Veritabanı için)
- **npm** veya **yarn** (Paket yöneticisi)

## 🔧 Kurulum Adımları

### 1. Backend Kurulumu

```bash
cd backend

# Virtual environment oluştur
python -m venv venv

# Virtual environment'ı aktifleştir
# Mac/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Dependencies yükle
pip install -r requirements.txt

# PostgreSQL veritabanını oluştur (PostgreSQL'de çalıştır)
# CREATE DATABASE acurate_db;
# CREATE USER acurate_user WITH PASSWORD 'acurate_pass_2024';

# .env dosyası oluştur (backend/.env)
# DATABASE_NAME=acurate_db
# DATABASE_USER=acurate_user
# DATABASE_PASSWORD=acurate_pass_2024
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# SECRET_KEY=your-secret-key-here
# SENDGRID_API_KEY=your-sendgrid-key (opsiyonel)

# Migrations çalıştır
python manage.py migrate

# Test verileri oluştur (opsiyonel)
python create_test_data.py

# Admin kullanıcısı oluştur
python manage.py createsuperuser

# Development server'ı başlat
python manage.py runserver
```

**Backend** şu adreste çalışacak: `http://localhost:8000`

### 2. Frontend Kurulumu

```bash
cd frontend

# Dependencies yükle
npm install

# .env.local dosyası oluştur (frontend/.env.local)
# NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Development server'ı başlat
npm run dev
```

**Frontend** şu adreste çalışacak: `http://localhost:3000`

## 🔐 Demo Hesaplar

### Super Admin
- **URL**: `http://localhost:3000/super-admin-x7k9m2p4q1w8r3n6`
- **Username**: `superadmin`
- Şifre sıfırlama: `backend/reset_superadmin_password.py`

### Öğrenci
- **URL**: `http://localhost:3000/login`
- **Username**: `beyza.karasahan` veya `student1`
- **Password**: `beyza123` veya `student123`

### Öğretmen
- **URL**: `http://localhost:3000/login`
- **Username**: `teacher1`
- **Password**: `teacher123`

## 📂 Proje Yapısı

```
AcuRate-3/
├── backend/              # Django backend
│   ├── api/             # API uygulaması
│   │   ├── models.py    # Veritabanı modelleri
│   │   ├── views.py     # API endpoint'leri
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── backend/         # Django settings
│   └── manage.py
│
├── frontend/            # Next.js frontend
│   ├── src/
│   │   ├── app/        # Sayfalar (pages)
│   │   │   ├── login/
│   │   │   ├── student/
│   │   │   ├── teacher/
│   │   │   ├── institution/
│   │   │   └── super-admin/
│   │   ├── components/ # React bileşenleri
│   │   └── lib/        # Utilities & API client
│   └── package.json
│
└── README.md
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login/` - Giriş yap
- `GET /api/auth/me/` - Kullanıcı bilgisi

### Dashboards
- `GET /api/dashboard/student/` - Öğrenci dashboard
- `GET /api/dashboard/teacher/` - Öğretmen dashboard
- `GET /api/dashboard/institution/` - Kurum dashboard
- `GET /api/dashboard/super-admin/` - Super Admin dashboard

### CRUD Operations
- `/api/users/` - Kullanıcı yönetimi
- `/api/courses/` - Kurs yönetimi
- `/api/enrollments/` - Kayıt yönetimi
- `/api/assessments/` - Değerlendirme yönetimi
- `/api/grades/` - Not yönetimi
- `/api/program-outcomes/` - Program Çıktıları

## 🛠️ Geliştirme Komutları

### Backend
```bash
# Migration oluştur
python manage.py makemigrations

# Migration uygula
python manage.py migrate

# Django shell
python manage.py shell

# Test çalıştır
python manage.py test
```

### Frontend
```bash
# Development server
npm run dev

# Production build
npm run build

# Production server
npm start

# Lint kontrol
npm run lint
```

## 🐛 Sorun Giderme

### Backend bağlantı hatası
1. PostgreSQL servisinin çalıştığından emin olun
2. `.env` dosyasındaki veritabanı bilgilerini kontrol edin
3. `python manage.py migrate` komutunu çalıştırın

### Frontend API bağlantı hatası
1. Backend'in `http://localhost:8000` adresinde çalıştığından emin olun
2. `frontend/.env.local` dosyasında `NEXT_PUBLIC_API_URL` değerini kontrol edin
3. CORS ayarlarını kontrol edin (backend'de)

### Port zaten kullanılıyor
- Backend için farklı port: `python manage.py runserver 8001`
- Frontend için farklı port: `npm run dev -- -p 3001`

## 📝 Önemli Notlar

- Backend ve Frontend **aynı anda çalışmalı**
- Backend önce başlatılmalı (frontend backend'e bağımlı)
- `.env` dosyaları git'e commit edilmemeli (`.gitignore`'da olmalı)
- Production'da `DEBUG=False` yapılmalı

## 🔗 Yararlı Linkler

- **Django Admin**: http://localhost:8000/admin/
- **API Base URL**: http://localhost:8000/api/
- **Frontend**: http://localhost:3000
- **Login**: http://localhost:3000/login

## 📞 Yardım

Detaylı dokümantasyon için:
- `README.md` - Genel proje dokümantasyonu
- `backend/README.md` - Backend dokümantasyonu
- `docs/` klasörü - Detaylı rehberler

---

**İyi çalışmalar! 🚀**

