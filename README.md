# AcuRate - Academic Performance Analysis System

AcuRate, üniversiteler, okullar ve eğitim kurumları için kapsamlı bir akademik performans takip ve analiz platformudur. Öğrenci notları, Program Çıktıları (PO), Learning Outcomes (LO) başarıları, kurs performansları ve kurumsal analitikleri yönetmek için modern bir web uygulamasıdır.

## 🎯 Proje Özeti

AcuRate, eğitim kurumlarının akademik performansı analiz etmesini, öğrencilerin kendi ilerlemelerini takip etmesini ve öğretmenlerin not yönetimini kolaylaştırmasını sağlayan full-stack bir web uygulamasıdır.

**Ana Özellikler:**
- ✅ Öğrenci performans takibi ve analitikleri
- ✅ Öğretmen not yönetimi ve kurs yönetimi
- ✅ Kurum seviyesinde analitik ve raporlama
- ✅ Super Admin paneli ile sistem yönetimi
- ✅ Program Çıktıları (PO) ve Learning Outcomes (LO) takibi
- ✅ Otomatik GPA hesaplama ve başarı analizleri

## 🛠️ Teknoloji Stack

### Backend
- **Django 5.2.9+** - Python web framework
- **Django REST Framework 3.15.2** - RESTful API
- **PostgreSQL 16** - Veritabanı (Docker ile)
- **JWT Authentication** - Token-based authentication
- **SendGrid** - Email gönderimi
- **Celery** (opsiyonel) - Background tasks
- **Redis** (opsiyonel) - Caching
- **Sentry** (opsiyonel) - Error tracking

### Frontend
- **Next.js 15.5.5** - React framework (App Router)
- **TypeScript 5+** - Type-safe development
- **Tailwind CSS 4.1.16** - Utility-first CSS framework
- **Framer Motion 12.23.24** - Animasyonlar
- **Chart.js 4.5.1** - Veri görselleştirme
- **React Query 5.90.5** - Data fetching & caching
- **Zustand 5.0.8** - State management
- **React Hook Form 7.65.0** - Form yönetimi
- **Lucide React** - İkonlar
- **next-themes** - Dark/Light mode

### DevOps & Infrastructure
- **Docker & Docker Compose** - PostgreSQL containerization
- **Gunicorn** - Production WSGI server
- **Nginx** (opsiyonel) - Reverse proxy

## 📋 Gereksinimler

### Sistem Gereksinimleri
- **Node.js** 18+ 
- **Python** 3.12+
- **Docker** ve **Docker Compose** (PostgreSQL için ZORUNLU)
- **npm** veya **yarn**

> **Önemli Not:** Bu proje PostgreSQL için Docker kullanır. Yerel PostgreSQL kurulumu gerekmez.

## 🚀 Kurulum

### 1. Repository'yi Klonlayın

```bash
git clone <repository-url>
cd acuratetemiz
```

### 2. PostgreSQL Veritabanını Başlatın (Docker)

```bash
# PostgreSQL container'ını başlat
docker-compose up -d postgres

# Durumu kontrol edin
docker-compose ps
```

PostgreSQL şu adreste çalışacak: `localhost:5432`

Detaylı Docker kurulum bilgileri için: [DOCKER_SETUP.md](./DOCKER_SETUP.md)

### 3. Backend Kurulumu

```bash
cd backend

# Virtual environment oluştur
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Dependencies yükle
pip install -r requirements.txt

# Environment variables ayarla
# .env dosyası oluşturun ve düzenleyin:
# - DJANGO_SECRET_KEY (production için güvenli bir değer)
# - POSTGRES_* değerleri (Docker Compose ile eşleşmeli)
# - SENDGRID_API_KEY (email gönderimi için)
# - DEFAULT_FROM_EMAIL

# Migrations çalıştır
python manage.py migrate

# Super admin kullanıcısı oluştur (opsiyonel - ilk kurulum için)
python manage.py createsuperuser

# Development server'ı başlat
python manage.py runserver
```

Backend şu adreste çalışacak: `http://localhost:8000`

### 4. Frontend Kurulumu

```bash
cd frontend

# Dependencies yükle
npm install

# Environment variables ayarla
# .env.local dosyası oluşturun ve düzenleyin:
# - NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Development server'ı başlat
npm run dev
```

Frontend şu adreste çalışacak: `http://localhost:3000`

## 📁 Proje Yapısı

```
acuratetemiz/
├── backend/                    # Django backend
│   ├── api/                   # Ana API uygulaması
│   │   ├── models/           # Modüler model dosyaları
│   │   │   ├── user.py       # User, PasswordHistory, PasswordResetToken
│   │   │   ├── department.py # Department
│   │   │   ├── course.py     # Course, CoursePO, Enrollment
│   │   │   ├── outcome.py    # ProgramOutcome
│   │   │   ├── learning_outcome.py # LearningOutcome, LOPO
│   │   │   ├── assessment.py # Assessment, AssessmentLO, StudentGrade
│   │   │   ├── achievement.py # StudentPOAchievement, StudentLOAchievement
│   │   │   └── misc.py       # ContactRequest, ActivityLog
│   │   ├── views/            # Modüler view dosyaları
│   │   │   ├── auth.py       # Login, logout, register, password reset
│   │   │   ├── dashboards.py # Tüm rol dashboard'ları
│   │   │   ├── super_admin.py # Super admin işlemleri
│   │   │   ├── analytics.py  # Analytics endpoint'leri
│   │   │   ├── contact.py    # Contact form işlemleri
│   │   │   ├── viewsets.py   # CRUD ViewSets
│   │   │   ├── bulk_operations.py # Toplu işlemler
│   │   │   ├── file_upload.py # Dosya yükleme
│   │   │   └── health.py     # Health check endpoint'leri
│   │   ├── serializers/      # Modüler serializer dosyaları
│   │   │   ├── user.py
│   │   │   ├── department.py
│   │   │   ├── course.py
│   │   │   ├── outcome.py
│   │   │   ├── assessment.py
│   │   │   ├── achievement.py
│   │   │   ├── dashboard.py
│   │   │   └── contact.py
│   │   ├── admin/            # Django admin panel modülleri
│   │   │   ├── user.py       # UserAdmin
│   │   │   ├── outcome.py    # ProgramOutcomeAdmin, LearningOutcomeAdmin
│   │   │   ├── course.py     # CourseAdmin, CoursePOAdmin, EnrollmentAdmin
│   │   │   ├── assessment.py # AssessmentAdmin, StudentGradeAdmin
│   │   │   ├── achievement.py # StudentPOAchievementAdmin, StudentLOAchievementAdmin
│   │   │   ├── contact.py    # ContactRequestAdmin
│   │   │   └── activity.py   # ActivityLogAdmin
│   │   ├── tests/            # Modüler test dosyaları
│   │   ├── permissions.py    # Permission sınıfları
│   │   ├── middleware.py     # Custom middleware
│   │   ├── signals.py        # Django signals
│   │   ├── utils.py          # Utility fonksiyonları
│   │   ├── cache_utils.py    # Cache yardımcı fonksiyonları
│   │   └── urls.py           # URL routing
│   ├── backend/              # Django settings
│   │   ├── settings.py       # Ana settings dosyası
│   │   ├── urls.py           # Root URL config
│   │   └── wsgi.py / asgi.py
│   ├── scripts/              # Yardımcı scriptler
│   ├── logs/                 # Log dosyaları
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   │   ├── page.tsx      # Ana sayfa (landing)
│   │   │   ├── login/        # Login sayfası
│   │   │   ├── student/      # Öğrenci sayfaları
│   │   │   │   ├── page.tsx              # Dashboard
│   │   │   │   ├── courses/              # Kurslar
│   │   │   │   ├── outcomes/             # Program Çıktıları
│   │   │   │   ├── po-outcomes/          # PO Çıktıları
│   │   │   │   ├── lo-outcomes/          # LO Çıktıları
│   │   │   │   ├── course-analytics/     # Kurs Analitikleri
│   │   │   │   ├── scores/               # Notlar
│   │   │   │   ├── strengths/            # Güçlü Yönler
│   │   │   │   ├── relationships/        # İlişkiler
│   │   │   │   └── settings/             # Ayarlar
│   │   │   ├── teacher/      # Öğretmen sayfaları
│   │   │   │   ├── page.tsx              # Dashboard
│   │   │   │   ├── grades/               # Not Yönetimi
│   │   │   │   ├── learning-outcome/     # Learning Outcomes
│   │   │   │   ├── po-management/        # PO Yönetimi
│   │   │   │   ├── mappings/             # Eşleştirmeler
│   │   │   │   ├── analytics/            # Analytics
│   │   │   │   ├── settings/             # Ayarlar
│   │   │   │   └── change-password/      # Şifre Değiştirme
│   │   │   ├── institution/  # Kurum sayfaları
│   │   │   │   ├── page.tsx              # Dashboard
│   │   │   │   ├── teachers/             # Öğretmen Yönetimi
│   │   │   │   ├── students/             # Öğrenci Yönetimi
│   │   │   │   ├── departments/          # Departman Yönetimi
│   │   │   │   ├── lessons/              # Ders Yönetimi
│   │   │   │   ├── po-management/        # PO Yönetimi
│   │   │   │   ├── analytics/            # Analytics
│   │   │   │   ├── settings/             # Ayarlar
│   │   │   │   └── change-password/      # Şifre Değiştirme
│   │   │   ├── super-admin/  # Super Admin sayfaları
│   │   │   │   ├── page.tsx              # Dashboard
│   │   │   │   ├── institutions/         # Kurum Yönetimi
│   │   │   │   ├── contact/              # İletişim Talepleri
│   │   │   │   └── logs/                 # Aktivite Logları
│   │   │   ├── super-admin-x7k9m2p4q1w8r3n6/ # Özel login sayfası
│   │   │   ├── contact/      # İletişim formu (public)
│   │   │   ├── about/        # Hakkında
│   │   │   ├── features/     # Özellikler
│   │   │   ├── analytics/    # Genel analytics sayfası
│   │   │   ├── get-started/  # Başlangıç sayfası
│   │   │   └── 404/          # 404 sayfası
│   │   ├── components/       # React bileşenleri
│   │   │   ├── ui/           # UI bileşenleri (button, card, etc.)
│   │   │   ├── layout/       # Layout bileşenleri (navbar, footer)
│   │   │   ├── charts/       # Chart bileşenleri
│   │   │   └── navigation/   # Navigation bileşenleri
│   │   ├── lib/              # Utilities & API client
│   │   │   ├── api.ts        # API client fonksiyonları
│   │   │   ├── utils.ts      # Utility fonksiyonları
│   │   │   └── export.ts     # Export fonksiyonları
│   │   ├── hooks/            # Custom React hooks
│   │   ├── types/            # TypeScript type tanımları
│   │   └── middleware.ts     # Next.js middleware
│   ├── public/               # Static dosyalar
│   ├── package.json
│   └── next.config.ts
│
├── docker/                    # Docker yapılandırmaları
│   └── postgres/
│       └── init-test-user.sh
├── docs/                      # Dokümantasyon
│   ├── API_INTEGRATION_GUIDE.md
│   ├── QUICK_START.md
│   └── TROUBLESHOOTING.md
├── docker-compose.yml         # Docker Compose config
└── README.md                  # Bu dosya
```

## 🔐 Kullanıcı Rolleri ve Özellikler

### 👨‍🎓 Öğrenci Paneli

**Sayfalar:**
- **Dashboard** - Genel performans özeti, GPA, aktif kurslar, son notlar
- **Courses** - Aldığı dersler, notlar, assessment'lar
- **Outcomes** - Program Çıktıları (PO) başarıları ve ilerleme takibi
- **PO Outcomes** - Program Çıktıları detay görünümü
- **LO Outcomes** - Learning Outcomes başarıları
- **Course Analytics** - Kurs bazlı detaylı analitikler, sınıf ortalaması karşılaştırması
- **Scores** - Not detayları
- **Strengths** - Güçlü yönler analizi
- **Relationships** - İlişkisel analizler
- **Settings** - Profil yönetimi ve şifre değiştirme

**Özellikler:**
- ✅ Gerçek zamanlı GPA hesaplama
- ✅ Kurs bazlı performans analizi
- ✅ Program çıktıları başarı takibi
- ✅ Learning Outcomes başarı takibi
- ✅ Sınıf ortalaması karşılaştırması
- ✅ GPA trend grafikleri

### 👨‍🏫 Öğretmen Paneli

**Sayfalar:**
- **Dashboard** - Kurs istatistikleri, öğrenci sayıları, bekleyen değerlendirmeler
- **Grades** - Öğrenci notları girişi, assessment yönetimi
- **Learning Outcome** - Kurs bazlı Learning Outcome tanımlama ve yönetimi
- **PO Management** - Program Çıktıları yönetimi
- **Mappings** - Eşleştirme yönetimi
- **Analytics** - Kurs performans analizi
- **Settings** - Profil yönetimi
- **Change Password** - Zorunlu şifre değiştirme (geçici şifre için)

**Özellikler:**
- ✅ Assessment oluşturma ve yönetimi (max score düzenlenebilir)
- ✅ Feedback ranges yönetimi (otomatik feedback sistemi)
- ✅ Toplu not girişi (modal üzerinden)
- ✅ Learning Outcome tanımlama ve target percentage belirleme
- ✅ Program Çıktıları yönetimi
- ✅ Otomatik final not hesaplama
- ✅ Geçici şifre ile oluşturulan hesaplar için zorunlu şifre değiştirme

### 🏛️ Kurum Paneli (Institution Admin)

**Sayfalar:**
- **Dashboard** - Kurumsal genel bakış, toplam öğrenci/öğretmen/ders sayıları
- **Teachers** - Öğretmen dizini, arama, öğretmen oluşturma
- **Students** - Öğrenci yönetimi
- **Departments** - Departman yönetimi, istatistikler
- **Lessons** - Ders yönetimi
- **PO Management** - Program Çıktıları yönetimi
- **Analytics** - Departman bazlı istatistikler, PO başarı raporları
- **Settings** - Kurum profili ve güvenlik yönetimi
- **Change Password** - Zorunlu şifre değiştirme (geçici şifre için)

**Özellikler:**
- ✅ Öğretmen hesabı oluşturma (SendGrid ile email gönderimi)
- ✅ Öğrenci yönetimi
- ✅ Departman yönetimi ve istatistikleri
- ✅ Ders yönetimi
- ✅ Program Çıktıları yönetimi
- ✅ Kurumsal analitikler ve raporlar
- ✅ Toplu işlemler

### 👑 Super Admin Paneli (Program Sahibi)

**Sayfalar:**
- **Dashboard** - Sistem geneli istatistikler, toplam kurum sayısı
- **Institutions** - Müşteri kurum yönetimi (ekleme, silme, görüntüleme)
- **Activity Logs** - Sistem geneli aktivite logları
- **Contact** - İletişim formu talepleri yönetimi

**Özellikler:**
- ✅ Müşteri kurum oluşturma (SendGrid ile email gönderimi)
- ✅ Cascade delete - Kurum silindiğinde tüm ilişkili veriler silinir
- ✅ Aktivite logları görüntüleme ve filtreleme
- ✅ İletişim talepleri yönetimi
- ✅ Özel login sayfası (`/super-admin-x7k9m2p4q1w8r3n6`)

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/login/              # Kullanıcı girişi
POST   /api/auth/logout/             # Çıkış
POST   /api/auth/register/           # Kayıt
POST   /api/auth/forgot-password/    # Şifre unutma
POST   /api/auth/reset-password/     # Şifre sıfırlama (token ile)
POST   /api/auth/forgot-username/    # Kullanıcı adı unutma
GET    /api/auth/me/                 # Mevcut kullanıcı bilgisi
POST   /api/auth/token/refresh/      # Token yenileme
```

### User Management
```
POST   /api/teachers/                # Öğretmen oluşturma (Institution)
POST   /api/students/                # Öğrenci oluşturma
GET    /api/users/                   # Kullanıcı listesi
GET    /api/users/:id/               # Kullanıcı detayı
PATCH  /api/users/me/                # Profil güncelleme
POST   /api/users/me/change-password/ # Şifre değiştirme
```

### Dashboards
```
GET    /api/dashboard/student/       # Öğrenci dashboard
GET    /api/dashboard/teacher/       # Öğretmen dashboard
GET    /api/dashboard/institution/   # Kurum dashboard
GET    /api/dashboard/super-admin/   # Super Admin dashboard
```

### Courses
```
GET    /api/courses/                 # Kurs listesi
GET    /api/courses/:id/             # Kurs detayı
POST   /api/courses/                 # Kurs oluşturma
PATCH  /api/courses/:id/             # Kurs güncelleme
DELETE /api/courses/:id/             # Kurs silme
GET    /api/courses/:id/students/    # Kurs öğrencileri
GET    /api/courses/:id/assessments/ # Kurs assessment'ları
```

### Enrollments
```
GET    /api/enrollments/             # Kayıt listesi
GET    /api/enrollments/:id/         # Kayıt detayı
POST   /api/enrollments/             # Kayıt oluşturma
PATCH  /api/enrollments/:id/         # Kayıt güncelleme
DELETE /api/enrollments/:id/         # Kayıt silme
```

### Assessments
```
GET    /api/assessments/             # Assessment listesi
GET    /api/assessments/:id/         # Assessment detayı
POST   /api/assessments/             # Assessment oluşturma
PATCH  /api/assessments/:id/         # Assessment güncelleme (feedback_ranges dahil)
DELETE /api/assessments/:id/         # Assessment silme
GET    /api/assessments/:id/grades/  # Assessment notları
```

### Grades
```
GET    /api/grades/                  # Not listesi
GET    /api/grades/:id/              # Not detayı
POST   /api/grades/                  # Not oluşturma
PATCH  /api/grades/                  # Toplu not güncelleme
DELETE /api/grades/:id/              # Not silme
```

### Program Outcomes
```
GET    /api/program-outcomes/        # PO listesi (Institution)
GET    /api/program-outcomes/:id/    # PO detayı
POST   /api/program-outcomes/        # PO oluşturma
PATCH  /api/program-outcomes/:id/    # PO güncelleme
DELETE /api/program-outcomes/:id/    # PO silme
```

### Learning Outcomes
```
GET    /api/learning-outcomes/       # LO listesi (Teacher)
GET    /api/learning-outcomes/:id/   # LO detayı
POST   /api/learning-outcomes/       # LO oluşturma
PATCH  /api/learning-outcomes/:id/   # LO güncelleme
DELETE /api/learning-outcomes/:id/   # LO silme
```

### Achievements
```
GET    /api/po-achievements/         # PO başarıları (Student)
GET    /api/lo-achievements/         # LO başarıları (Student)
```

### Assessment-LO Relations
```
GET    /api/assessment-los/          # Assessment-LO ilişkileri listesi
GET    /api/assessment-los/:id/      # Assessment-LO ilişki detayı
POST   /api/assessment-los/          # Assessment-LO ilişkisi oluşturma
PATCH  /api/assessment-los/:id/      # Assessment-LO ilişkisi güncelleme
DELETE /api/assessment-los/:id/      # Assessment-LO ilişkisi silme
```

### LO-PO Relations
```
GET    /api/lo-pos/                  # LO-PO ilişkileri listesi
GET    /api/lo-pos/:id/              # LO-PO ilişki detayı
POST   /api/lo-pos/                  # LO-PO ilişkisi oluşturma
PATCH  /api/lo-pos/:id/              # LO-PO ilişkisi güncelleme
DELETE /api/lo-pos/:id/              # LO-PO ilişkisi silme
```

### Course Analytics
```
GET    /api/course-analytics/        # Tüm kursların özeti (Student)
GET    /api/course-analytics/:id/    # Belirli kursun detaylı analitiği
```

### Institution Analytics
```
GET    /api/analytics/departments/   # Departman istatistikleri
GET    /api/analytics/department-curriculum/ # Departman müfredat bilgisi
GET    /api/analytics/po-trends/     # PO trend analizi
GET    /api/analytics/performance-distribution/ # Performans dağılımı
GET    /api/analytics/course-success/ # Kurs başarı analizi
GET    /api/analytics/alerts/        # Uyarılar ve bildirimler
```

### Super Admin
```
GET    /api/super-admin/institutions/      # Kurum listesi
POST   /api/super-admin/institutions/create/ # Kurum oluşturma
DELETE /api/super-admin/institutions/:id/   # Kurum silme
POST   /api/super-admin/institutions/:id/reset-password/ # Şifre sıfırlama
GET    /api/super-admin/activity-logs/      # Aktivite logları
```

### Departments
```
GET    /api/departments/             # Departman listesi
GET    /api/departments/:id/         # Departman detayı
POST   /api/departments/             # Departman oluşturma
PATCH  /api/departments/:id/         # Departman güncelleme
DELETE /api/departments/:id/         # Departman silme
```

### Contact
```
POST   /api/contact/                 # İletişim formu gönderimi (public)
GET    /api/contact-requests/        # İletişim talepleri (Super Admin)
PATCH  /api/contact-requests/:id/    # Talep durum güncelleme
```

### File Upload
```
POST   /api/files/upload/profile-picture/ # Profil resmi yükleme
POST   /api/files/upload/            # Genel dosya yükleme
```

**Not:** File upload endpoint'leri mevcut olup, frontend entegrasyonu geliştirme aşamasındadır.

### Bulk Operations
```
POST   /api/bulk/import/students/    # Toplu öğrenci import (CSV)
POST   /api/bulk/import/grades/      # Toplu not import (CSV)
GET    /api/bulk/export/grades/      # Not export (CSV/Excel)
```

**Not:** Bulk operations endpoint'leri mevcut olup, frontend entegrasyonu geliştirme aşamasındadır.

### Health Check
```
GET    /api/health/                  # Health check
GET    /api/health/ready/            # Readiness check
GET    /api/health/live/             # Liveness check
```

Detaylı API dokümantasyonu için: [docs/API_INTEGRATION_GUIDE.md](./docs/API_INTEGRATION_GUIDE.md)

## 🔒 Güvenlik Özellikleri

- ✅ **JWT Authentication** - Token-based authentication sistemi
- ✅ **Password History** - Son 5 şifrenin tekrar kullanımını engelleme
- ✅ **Password Reset Tokens** - Güvenli şifre sıfırlama sistemi
- ✅ **Rate Limiting** - API rate limiting (production'da)
- ✅ **CORS Protection** - Cross-origin resource sharing kontrolü
- ✅ **CSRF Protection** - Cross-site request forgery koruması
- ✅ **Security Headers** - CSP, HSTS, X-Frame-Options
- ✅ **Role-Based Access Control** - Rol bazlı erişim kontrolü
- ✅ **Activity Logging** - Sistem aktivitelerinin loglanması
- ✅ **Input Validation** - Kapsamlı input validasyonu
- ✅ **SQL Injection Protection** - Django ORM kullanımı

## 🎨 UI/UX Özellikleri

- ✅ **Dark/Light Mode** - Tema desteği (next-themes)
- ✅ **Responsive Design** - Mobil uyumlu arayüz
- ✅ **Smooth Animations** - Framer Motion ile animasyonlar
- ✅ **Loading States** - Loading indicator'ları
- ✅ **Error Handling** - Kullanıcı dostu hata mesajları
- ✅ **Toast Notifications** - react-hot-toast ile bildirimler
- ✅ **Charts & Graphs** - Chart.js, Recharts, ECharts ile veri görselleştirme

## 🔧 Geliştirme

### Backend Geliştirme

```bash
cd backend
source venv/bin/activate

# Yeni migration oluştur
python manage.py makemigrations

# Migration uygula
python manage.py migrate

# Django shell
python manage.py shell

# Test çalıştır (pytest)
pytest

# Test çalıştır (Django test runner)
python manage.py test

# GitHub'a push etmeden önce test kontrolü
python scripts/test_before_push.py
```

### Frontend Geliştirme

```bash
cd frontend

# Development server
npm run dev

# Build
npm run build

# Production server
npm start

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

### Database Yönetimi

```bash
# PostgreSQL container'ını başlat
docker-compose up -d postgres

# PostgreSQL'e bağlan (Docker içinden)
docker-compose exec postgres psql -U acurate_user -d acurate_db

# Veritabanını sıfırla (TÜM VERİLERİ SİLER)
docker-compose down -v
docker-compose up -d postgres
python manage.py migrate
```

## 📊 Veritabanı Modelleri

### User
- Öğrenci, Öğretmen, Institution, Super Admin rolleri
- Email, telefon, profil resmi
- Öğrenci ID, departman, sınıf bilgisi
- Geçici şifre takibi (`is_temporary_password`)
- Şifre geçmişi (PasswordHistory)

### Department
- Departman adı ve açıklaması
- Kuruma bağlı

### Course
- Kurs kodu, adı, kredisi, dönem
- Öğretmen ataması
- Program Çıktıları ile ilişkilendirme (CoursePO through model ile)

### CoursePO
- Course ve ProgramOutcome arasındaki ilişki modeli
- Many-to-many ilişki için through table

### Enrollment
- Öğrenci-kurs kayıtları
- Final notları ve durum

### Assessment
- Sınav, proje, ödev türleri
- Ağırlık, max puan (0-100 arası düzenlenebilir)
- Feedback ranges (otomatik feedback sistemi)
- Learning Outcomes ile ilişkilendirme (AssessmentLO through model ile)

### AssessmentLO
- Assessment ve LearningOutcome arasındaki ilişki modeli
- Many-to-many ilişki için through table

### LearningOutcome
- Kurs bazlı öğrenme çıktıları
- Teacher'lar tarafından yönetilir
- Target percentage belirlenebilir
- Program Çıktıları ile ilişkilendirme (LOPO through model ile)

### LOPO
- LearningOutcome ve ProgramOutcome arasındaki ilişki modeli
- Many-to-many ilişki için through table

### StudentGrade
- Öğrenci notları
- Assessment'a bağlı
- Otomatik yüzde hesaplama

### StudentPOAchievement / StudentLOAchievement
- Program Çıktısı / Learning Outcome başarı yüzdeleri
- Hedef karşılaştırması
- Otomatik hesaplama

### ContactRequest
- Kurumsal demo talepleri
- İletişim bilgileri ve durum takibi

### ActivityLog
- Sistem aktivite logları
- Kullanıcı eylemleri (oluşturma, güncelleme, silme, giriş)
- Kurum bazlı filtreleme

Detaylı model bilgileri için: `backend/api/models/` klasörü

## 🚢 Production Deployment

### Backend Production Ayarları

```bash
# .env dosyasında:
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<güvenli-secret-key>
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
SECURE_SSL_REDIRECT=True
SENDGRID_API_KEY=<sendgrid-api-key>
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### Gunicorn ile Çalıştırma

```bash
gunicorn backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
```

### Frontend Production Build

```bash
cd frontend
npm run build
npm start
```

Detaylı production rehberi için:
- [PRODUCTION_QUICK_START.md](./PRODUCTION_QUICK_START.md)
- [PRODUCTION_SCALABILITY_GUIDE.md](./PRODUCTION_SCALABILITY_GUIDE.md)

## 📝 Test Verileri

Test verileri oluşturmak için:

```bash
cd backend
python manage.py migrate  # Migration'ları uygula
# Test verileri migration'ları otomatik olarak uygulanır
```

Demo hesaplar için: [ALL_ACCOUNTS.md](./ALL_ACCOUNTS.md)

## 🐛 Sorun Giderme

### Backend Hataları
- **Database Connection Error**: PostgreSQL container'ının çalıştığından emin olun (`docker-compose ps`)
- **500 Internal Server Error**: Backend loglarını kontrol edin (`backend/logs/acurate.log`)
- **Migration Errors**: Veritabanını sıfırlayın veya migration'ları kontrol edin

### Frontend Hataları
- **API Connection Error**: Backend'in çalıştığından emin olun (`http://localhost:8000`)
- **CORS Errors**: Backend CORS ayarlarını kontrol edin
- **Authentication Errors**: Token'ların geçerli olduğundan emin olun

Detaylı sorun giderme için: [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)

## 📚 Ek Dokümantasyon

- [API Integration Guide](./docs/API_INTEGRATION_GUIDE.md) - API kullanım kılavuzu
- [Quick Start Guide](./docs/QUICK_START.md) - Hızlı başlangıç rehberi
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) - Sorun giderme
- [Docker Setup Guide](./DOCKER_SETUP.md) - Docker kurulum rehberi
- [Production Quick Start](./PRODUCTION_QUICK_START.md) - Production deployment
- [Production Scalability Guide](./PRODUCTION_SCALABILITY_GUIDE.md) - Ölçeklenebilirlik rehberi

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje özel bir projedir.

## 👥 Proje Durumu

**Mevcut Versiyon**: v2.1.0  
**Son Güncelleme**: Aralık 2024

### Tamamlanan Özellikler ✅
- ✅ Modüler backend yapısı (Models, Views, Serializers, Admin, Tests)
- ✅ JWT Authentication sistemi
- ✅ Tüm rol panelleri (Student, Teacher, Institution, Super Admin)
- ✅ Dashboard'lar (tüm roller için)
- ✅ Course Analytics
- ✅ Learning Outcomes yönetimi
- ✅ Assessment ve Grade yönetimi
- ✅ Email entegrasyonu (SendGrid)
- ✅ Activity Logging
- ✅ Password security (history, reset tokens)
- ✅ Contact form ve yönetimi
- ✅ File upload API endpoint'leri
- ✅ Bulk operations API endpoint'leri

### Geliştirme Aşamasındaki Özellikler 🔄
- 🔄 File upload frontend entegrasyonu
- 🔄 Bulk operations frontend entegrasyonu
- 🔄 Swagger/OpenAPI dokümantasyonu
- 🔄 Unit test coverage artırma

---

**AcuRate** - Academic Performance Analysis System © 2024
