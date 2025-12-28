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

### Backend
- **Django 5** - Python web framework
- **Django REST Framework** - RESTful API
- **PostgreSQL** - Veritabanı
- **JWT Authentication** - Token-based auth
- **Django Admin** - Yönetim paneli
- **drf-yasg** - Swagger/OpenAPI Dokümantasyonu

## 📖 API Dokümantasyonu (Swagger UI)

- Projede, interaktif API testleri ve canlı endpoint incelemeleri için **Swagger UI** (drf-yasg) kullanılmaktadır.
- Tüm ana modeller ve fonksiyonlar kapsamlı İngilizce docstring açıklamalarına sahiptir. Her endpoint, parametre, request/response body ve model alanları detaylı olarak dokümante edilmiştir.
- Swagger arayüzüne erişim: [`http://localhost:8000/swagger/`](http://localhost:8000/swagger/)
- Swagger ile:
  - Her endpoint için "Try it out" özelliğiyle doğrudan frontend üzerinden API testleri yapılabilir.
  - JWT token authentication desteği mevcuttur, kullanıcı girişi sonrası token ekleyerek protected endpoint'ler denenebilir.
  - Model ve alan açıklamaları API şemasında ayrıntılı olarak görünür.
- Ayrıca proje düzeyinde otomatik OpenAPI (json/yaml) şeması da indirilebilir.
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

### Frontend Hataları
- **API Connection**: Backend'in çalıştığından emin olun
- **CORS Errors**: Backend CORS ayarlarını kontrol edin
- **Authentication**: Token'ların geçerli olduğundan emin olun

## 📝 Son Yapılan Değişiklikler

### 🏗️ Backend Modülerleştirme (Aralık 2024 - v2.1.0) 🆕 YENİ

#### Tamamlanan Modülerleştirmeler
- ✅ **Models Modülerleştirme**: `models.py` (1143 satır) → `models/` klasörü (8 modül)
  - User, Department, Course, Outcome, LearningOutcome, Assessment, Achievement, Misc modelleri ayrı dosyalara bölündü
  - Tüm import'lar `api.models` üzerinden erişilebilir
  - Circular import'lar önlendi, string referanslar kullanıldı

- ✅ **Views Modülerleştirme**: `views.py` (3602 satır) → `views/` klasörü (8 modül)
  - Auth, Dashboards, Super Admin, Analytics, Contact, ViewSets, Bulk Operations, File Upload ayrı dosyalara bölündü
  - Tüm import'lar `api.views` üzerinden erişilebilir
  - Relative import'lar düzeltildi

- ✅ **Serializers Modülerleştirme**: `serializers.py` (860 satır) → `serializers/` klasörü (8 modül)
  - User, Department, Course, Outcome, Assessment, Achievement, Dashboard, Contact serializer'ları ayrı dosyalara bölündü
  - Tüm import'lar `api.serializers` üzerinden erişilebilir
  - Circular import'lar önlendi, lazy import'lar kullanıldı

- ✅ **Admin Modülerleştirme**: `admin.py` (893 satır) → `admin/` klasörü (8 modül)
  - User, Outcome, Course, Assessment, Achievement, Contact, Activity admin'leri ayrı dosyalara bölündü
  - Inline'lar doğru yerlere taşındı
  - Site customization ve autocomplete config `__init__.py`'de

- ✅ **Tests Modülerleştirme**: `tests.py` (901 satır) → `tests/` klasörü (8 modül)
  - Base, Models, API, Permissions, Calculations, Serializers, Integration testleri ayrı dosyalara bölündü
  - Django test runner tüm testleri otomatik buluyor
  - BaseTestCase ortak test setup'ı sağlıyor

#### Modülerleştirme İstatistikleri
- **Toplam Modülerleştirilen Satır**: 7,399 satır
- **Oluşturulan Modül Dosyası**: 40+ dosya
- **Modül Kategorisi**: 5 ana kategori (Models, Views, Serializers, Admin, Tests)
- **Geriye Dönük Uyumluluk**: %100 (mevcut kodlar değişiklik gerektirmeden çalışıyor)
- **Test Durumu**: Tüm modüller Django check ile doğrulandı

#### Avantajlar
- ✅ Ölçeklenebilirlik: Her kategori ayrı dosyada, yeni özellikler eklemek kolay
- ✅ Bakım Kolaylığı: İlgili kodlar bir arada, değişiklik yapmak hızlı
- ✅ Okunabilirlik: Dosyalar daha küçük ve anlaşılır
- ✅ Organizasyon: İşlevsel kategorilere göre düzenli yapı
- ✅ Test Edilebilirlik: Her modül bağımsız test edilebilir

### 🆕 Yeni Özellikler (Son Güncellemeler)

#### Super Admin Sistemi (🆕 YENİ)
- ✅ **Super Admin Paneli**: Program sahibi için özel yönetim paneli
  - Sistem geneli dashboard (toplam kurum, öğrenci, öğretmen sayıları)
  - Müşteri kurum yönetimi (ekleme, silme, görüntüleme)
  - Activity logs görüntüleme ve filtreleme
  - Contact form talepleri yönetimi
- ✅ **Özel Login**: Super admin için güvenli giriş sayfası (`/super-admin-x7k9m2p4q1w8r3n6`)
- ✅ **Role Separation**: Super admin ve kurum admini tamamen ayrı sistemler
  - Super admin kurum listesinde görünmez
  - Super admin normal login'den giriş yapamaz
  - Kurum admini super admin sayfalarına erişemez
- ✅ **Institution Management**: 
  - Detaylı kurum oluşturma formu (institution bilgileri + admin bilgileri)
  - SendGrid ile otomatik email gönderimi (geçici şifre)
  - Cascade delete: Kurum silindiğinde tüm teacher ve student hesapları da silinir
  - Super admin hesapları korunur (silinemez)
- ✅ **Activity Logging**: Tüm sistem aktivitelerinin loglanması
  - User creation, update, delete
  - Login aktiviteleri
  - Course, enrollment, assessment işlemleri
  - Kurum bazlı filtreleme
- ✅ **Contact Management**: İletişim formu taleplerinin yönetimi
  - Durum güncelleme (pending, contacted, demo_scheduled, completed, archived)
  - Arama ve filtreleme
  - Detay görüntüleme ve not ekleme

#### Institution Departments & Teacher Management (🆕 YENİ)
- ✅ **Frontend**:
  - `/institution/teachers` sayfası tamamen yenilendi (grid kartları, unified search, refresh + add aksiyonları, slide-over form ile öğretmen oluşturma)
  - `/institution/departments` sayfası eklendi; departman kartları, öğrenci/fakülte/kurs istatistikleri ve departman ekleme paneli
  - Slide-over panel tasarımı; smooth animasyon, modern form alanları, validation mesajları
- ✅ **API Client**: Departman analytics endpoint entegrasyonu, öğretmen oluşturma/listeme fonksiyonları, unique key iyileştirmeleri

#### Teacher Hesap Oluşturma & Geçici Şifre Zorunlu Değiştirme Akışı (🆕 YENİ)
- ✅ **Backend**:
  - `POST /api/teachers/` endpoint'i ile **Institution** rolü veya admin kullanıcılar, sadece e‑posta ve (opsiyonel) ad/soyad/departman vererek öğretmen hesabı oluşturabiliyor.
  - Kullanıcı modeli üzerine `is_temporary_password` alanı eklendi; geçici şifre ile oluşturulan tüm öğretmenler için bu flag `True` olarak işaretleniyor.
  - `TeacherCreateSerializer` öğretmene **SendGrid** üzerinden otomatik e‑posta gönderiyor; mail içeriğinde:
    - Öğretmenin adı (varsa),
    - **Kullanıcı adı (email)**,
    - **Geçici şifre** açıkça belirtiliyor.
  - `UserDetailSerializer` artık `is_temporary_password` bilgisini döndürüyor; `change_password` endpoint'i şifre değiştiğinde bu flag'i otomatik olarak `False` yapıyor.
- ✅ **Frontend**:
  - Login sonrasında, eğer giriş yapan kullanıcı **TEACHER** ve `is_temporary_password === true` ise:
    - `must_change_password=true` cookie'si set ediliyor,
    - Kullanıcı doğrudan `/teacher/change-password` sayfasına yönlendiriliyor (dashboard yerine).
  - Yeni `/teacher/change-password` sayfası eklendi:
    - Geçici şifreyi **Current Password** olarak alıyor, yeni şifreyi iki kez doğruluyor,
    - Backend'deki `/api/users/change_password/` endpoint'ine bağlı çalışıyor,
    - Başarılı olduğunda `must_change_password` cookie'sini siliyor ve öğretmeni `/teacher` dashboard'una yönlendiriyor.
  - `middleware.ts` güncellendi:
    - Cookie'de `must_change_password=true` varsa, tüm korumalı route'lar öğretmeni zorunlu olarak `/teacher/change-password` sayfasına yönlendiriyor,
    - Böylece öğretmen **geçici şifreyi değiştirmeden sisteme devam edemiyor** (tam zorunlu şifre değişimi akışı).

#### Teacher Settings & Dashboard Refresh (🆕 YENİ)
- ✅ **Teacher Settings**:
  - Profil bilgileri backend’den okunuyor, kurum tarafından kilitlenen alanlar read-only gösteriliyor
  - Şifre değiştirme formu API’ye bağlı, hatalar/success mesajları ve loading state’leri eklendi
- ✅ **Teacher Dashboard**:
  - Hero bölümü, focus course kartı, quick actions ve quick stats panelleri ile profesyonel SaaS görünümü
  - Backend verileriyle senkron KPI kartları, graded today metriği

#### Department & Analytics Filter Fixes (🆕 YENİ)
- ✅ Departman seçeneklerinde benzersiz key kullanımı ve duplicate filtreleme ile React uyarıları giderildi
- ✅ Institution analytics filtrelerinde unique departman listesi kullanılıyor; dropdown’lar hatasız

### Backend Geliştirmeleri
- ✅ PostgreSQL veritabanı entegrasyonu
- ✅ Contact Request modeli ve API endpoint'i
- ✅ User profile update ve password change endpoint'leri
- ✅ Student GPA ranking hesaplama
- ✅ Field error düzeltmeleri (enrollment_date → enrolled_at)
- ✅ PO Achievement serializer düzeltmeleri
- ✅ Admin panel iyileştirmeleri
- ✅ **Course Analytics API endpoints** (🆕 YENİ)
- ✅ **Kapsamlı test verisi migration'ları** (🆕 YENİ)
- ✅ **Learning Outcome modeli ve API** (🆕 YENİ)
  - Teacher'lar için LO yönetimi
  - Kurs bazlı LO tanımlama
- ✅ **Assessment feedback_ranges JSONField** (🆕 YENİ)
  - Otomatik feedback sistemi için score aralıkları
  - Validation ve error handling
- ✅ **API hata mesajları iyileştirmeleri** (🆕 YENİ)
  - Detaylı field-specific hata mesajları
  - 400/401 hataları için daha açıklayıcı mesajlar
  - PATCH request desteği (partial update)
- ✅ **Backend Modülerleştirme** (🆕 YENİ - Aralık 2024)
  - **Models**: `models.py` (1143 satır) → `models/` (8 modül dosyası)
  - **Views**: `views.py` (3602 satır) → `views/` (8 modül dosyası)
  - **Serializers**: `serializers.py` (860 satır) → `serializers/` (8 modül dosyası)
  - **Admin**: `admin.py` (893 satır) → `admin/` (8 modül dosyası)
  - **Tests**: `tests.py` (901 satır) → `tests/` (8 modül dosyası)
  - **Toplam**: 5 büyük dosya modülerleştirildi, 40+ modül dosyası oluşturuldu
  - **Avantajlar**: Ölçeklenebilirlik, bakım kolaylığı, okunabilirlik, organizasyon
- ✅ **Swagger/OpenAPI API dokümantasyonu** (Swagger UI arayüzü, OpenAPI şeması, drf-yasg)
- ✅ **Kapsamlı İngilizce Docstrings (Kod okunabilirliği)**

### Frontend Geliştirmeleri
- ✅ Tüm mock data'lar kaldırıldı, backend entegrasyonu tamamlandı
- ✅ Contact sayfası (B2B landing page)
- ✅ Navbar ve Footer entegrasyonu
- ✅ Student analytics sayfası (ranking eklendi) - **API entegre**
- ✅ Student settings sayfası (profil ve şifre değiştirme) - **API entegre**
- ✅ Student dashboard - **API entegre**
- ✅ Student courses sayfası - **API entegre**
- ✅ Student outcomes sayfası - **API entegre**
- ✅ **Course Analytics sayfaları** (🆕 YENİ) - **API entegre**
- ✅ Error handling iyileştirmeleri
- ✅ Empty state'ler ve loading state'ler
- ✅ Interface güncellemeleri (backend ile uyumlu)
- ✅ **Teacher Learning Outcome sayfası** (🆕 YENİ)
  - PO Management → Learning Outcome olarak değiştirildi
  - Teacher'lar kendi kursları için LO yönetebilir
- ✅ **Grade Management iyileştirmeleri** (🆕 YENİ)
  - Due date kaldırıldı (assessment oluşturma ve görüntüleme)
  - Progress kolonu kaldırıldı
  - Percentages kolonu kaldırıldı
  - Max score düzenlenebilir (0-100 arası)
  - Öğrenci notları ana listede read-only
  - Edit Grades modal'ı eklendi
- ✅ **Feedback Ranges Management** (🆕 YENİ)
  - "Manage Feedback Ranges" modal'ı
  - Score aralıkları ve feedback mesajları tanımlama
  - Otomatik feedback atama sistemi
- ✅ **API client iyileştirmeleri** (🆕 YENİ)
  - PATCH request desteği (partial update)
  - Detaylı hata mesajları parsing
  - Field-specific error handling

### 📊 Entegrasyon Durumu

| Sayfa/Özellik | Durum | Notlar |
|--------------|-------|--------|
| Login | ✅ %100 | JWT authentication çalışıyor |
| Student Dashboard | ✅ %100 | API'den veri çekiyor |
| Student Analytics | ✅ %100 | API'den veri çekiyor |
| Student Courses | ✅ %100 | API'den veri çekiyor |
| Student Outcomes | ✅ %100 | API'den veri çekiyor |
| Student Course Analytics | ✅ %100 | 🆕 YENİ - API entegre |
| Student Settings | ✅ %100 | Profil ve şifre güncelleme çalışıyor |
| Teacher Dashboard | ✅ %100 | API entegre, yeni UI |
| Teacher Grades | ✅ %100 | Assessment yönetimi, feedback ranges, not girişi |
| Teacher Learning Outcome | ✅ %100 | 🆕 YENİ - API entegre |
| Institution Dashboard | ✅ %100 | API entegre |
| Institution Teachers | ✅ %100 | API entegre |
| Institution Departments | ✅ %100 | API entegre |
| Institution Settings | ✅ %100 | API entegre |
| Institution Change Password | ✅ %100 | API entegre |
| Super Admin Dashboard | ✅ %100 | 🆕 YENİ - API entegre |
| Super Admin Institutions | ✅ %100 | 🆕 YENİ - API entegre |
| Super Admin Activity Logs | ✅ %100 | 🆕 YENİ - API entegre |
| Super Admin Contact | ✅ %100 | 🆕 YENİ - API entegre |
| Contact Form | ✅ %100 | API entegre |

## 🤝 Katkıda Bulunma
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
- ✅ Activity Logging sistemi 🆕
- ✅ Institution Management (oluşturma, silme, cascade delete) 🆕
- ✅ Email Integration (SendGrid) 🆕
- ✅ Role-based routing ve middleware
- ✅ Super Admin ve Institution Admin ayrımı 🆕
- ✅ Dark/Light mode
- ✅ Responsive design
- ✅ Swagger/OpenAPI API dokümantasyonu (Swagger UI, drf-yasg)
- ✅ Kapsamlı İngilizce Docstrings (Kod okunabilirliği)

### Devam Eden Geliştirmeler 🔄
- 🔄 Unit testler
- 🔄 Performance optimizasyonu
- 🔄 Advanced analytics ve raporlama

## 🔍 İncelenmesi ve Geliştirilmesi Gereken Kısımlar

### 🚨 Yüksek Öncelikli Eksikler

#### Backend
- [ ] **API Dokümantasyonu**: Swagger/OpenAPI entegrasyonu yok
  - Tüm endpoint'lerin dokümantasyonu eksik
  - Request/Response örnekleri yok
  - Authentication gereksinimleri belirtilmemiş
- [ ] **Unit Testler**: Test coverage %0, hiç test yazılmamış
  - Model testleri yok
  - View testleri yok
  - Serializer testleri yok
  - Integration testleri yok
- [ ] **Production Ayarları**: `DEBUG=True` production'da açık, güvenlik riski
  - DEBUG=False için ayarlar yapılmalı
  - ALLOWED_HOSTS yapılandırılmalı
  - SECRET_KEY environment variable olmalı
  - CORS ayarları production için optimize edilmeli
- [ ] **Error Handling**: Detaylı hata mesajları ve logging eksik
  - Structured logging (JSON format) yok
  - Error tracking (Sentry vb.) entegrasyonu yok
  - Custom exception handler'lar eksik
- [ ] **Rate Limiting**: API rate limiting yok, DDoS riski
  - Django-ratelimit veya benzeri kütüphane eklenmeli
  - Endpoint bazlı rate limit tanımlamaları yapılmalı
- [ ] **Input Validation**: Bazı endpoint'lerde yeterli validasyon yok
  - Email format validation iyileştirilmeli
  - Phone number validation eksik
  - File upload validation yok
- [ ] **File Upload**: Profil resmi ve dosya yükleme endpoint'leri eksik
  - Profile picture upload endpoint'i yok
  - File size ve type validation yok
  - Media file storage yapılandırması eksik
- [ ] **Bulk Operations**: Toplu not girişi, CSV import/export yok
  - CSV import endpoint'i yok
  - Excel export endpoint'i yok
  - Bulk grade entry endpoint'i yok
- [ ] **Email Template System**: Email template'leri hardcoded
  - Django template system kullanılmalı
  - HTML email template'leri oluşturulmalı
  - Email preview/test özelliği eklenmeli

#### Frontend - Teacher Paneli
- [ ] **Teacher Courses**: Detaylı kurs yönetimi sayfası eksik
  - Kurs detay sayfası yok
  - Öğrenci listesi görüntüleme eksik
  - Kurs düzenleme özelliği yok
- [ ] **Grade Export/Import**: Export ve Import butonları var ama fonksiyonel değil
  - CSV export fonksiyonu yok
  - Excel export fonksiyonu yok
  - CSV import fonksiyonu yok
  - Import validation ve error handling yok
- [ ] **Teacher Analytics**: Gelişmiş analitik özellikleri eksik
  - Öğrenci performans karşılaştırması yok
  - Sınıf ortalaması trend analizi yok
  - Assessment başarı oranları detaylı görüntülenemiyor

#### Frontend - Institution Paneli
- [ ] **Institution Reports**: Export functionality eksik
  - PDF rapor export yok
  - Excel rapor export yok
  - Özelleştirilebilir rapor şablonları yok
- [ ] **Institution Students**: Öğrenci yönetimi sayfası eksik
  - Öğrenci listesi görüntüleme yok
  - Öğrenci detay sayfası yok
  - Toplu öğrenci işlemleri yok
- [ ] **Institution Courses**: Kurs yönetimi sayfası eksik
  - Tüm kurum kurslarını görüntüleme yok
  - Kurs oluşturma/düzenleme yok
  - Kurs atama yönetimi yok

#### Frontend - Super Admin Paneli
- [ ] **Super Admin Users**: Kullanıcı yönetimi sayfası eksik
  - Tüm kullanıcıları görüntüleme yok
  - Kullanıcı detay sayfası yok
  - Kullanıcı arama ve filtreleme yok
- [ ] **Super Admin Reports**: Sistem geneli raporlar eksik
  - Sistem sağlık raporu yok
  - Kullanım istatistikleri raporu yok
  - Export functionality yok
- [ ] **Super Admin Settings**: Sistem ayarları sayfası eksik
  - Email ayarları yönetimi yok
  - Sistem konfigürasyonu yok
  - Backup/restore yönetimi yok

### ⚠️ Orta Öncelikli İyileştirmeler

#### UI/UX
- [ ] **Toast Notifications**: Başarı/hata bildirimleri için toast sistemi yok
  - react-hot-toast veya benzeri kütüphane eklenmeli
  - Success, error, warning, info toast tipleri olmalı
  - Auto-dismiss ve manual dismiss özellikleri olmalı
- [ ] **Loading Skeletons**: Skeleton screens yerine basit spinner kullanılıyor
  - Skeleton component'leri oluşturulmalı
  - Her sayfa için özel skeleton tasarımları yapılmalı
  - Shimmer effect eklenmeli
- [ ] **Empty States**: Bazı sayfalarda empty state tasarımları eksik
  - İllustrasyonlu empty state component'leri olmalı
  - Action button'ları ile empty state'ler iyileştirilmeli
  - Context-aware mesajlar eklenmeli
- [ ] **Confirmation Modals**: Silme/önemli işlemler için onay modal'ları eksik
  - Reusable confirmation modal component'i olmalı
  - Farklı action tipleri için özelleştirilebilir modal'lar olmalı
  - Keyboard shortcut desteği (Enter/Escape) eklenmeli
- [ ] **Form Validation**: Client-side form validasyon mesajları eksik
  - Real-time validation feedback yok
  - Field-level error mesajları iyileştirilmeli
  - Form submission öncesi validation kontrolü eksik
- [ ] **Accessibility**: ARIA labels, keyboard navigation eksik
  - Tüm interactive element'ler için ARIA labels eklenmeli
  - Keyboard navigation (Tab, Enter, Escape) desteklenmeli
  - Screen reader uyumluluğu test edilmeli
  - Focus management iyileştirilmeli
- [ ] **Mobile Responsiveness**: Bazı sayfalar mobilde test edilmemiş
  - Tüm sayfalar mobil cihazlarda test edilmeli
  - Touch gesture desteği eklenmeli
  - Mobile-specific UI iyileştirmeleri yapılmalı
- [ ] **Data Tables**: Gelişmiş tablo özellikleri eksik
  - Sorting, filtering, pagination iyileştirilmeli
  - Column resizing yok
  - Column visibility toggle yok
  - Export to CSV/Excel özelliği yok

#### Backend Performance
- [ ] **Database Query Optimization**: N+1 query problemleri olabilir
  - `select_related` ve `prefetch_related` kullanımı artırılmalı
  - Query profiling yapılmalı
  - Slow query log'ları analiz edilmeli
- [ ] **Caching**: Redis cache entegrasyonu yok
  - Django-cacheops veya django-redis eklenmeli
  - Dashboard verileri cache'lenmeli
  - API response cache'leme yapılmalı
  - Cache invalidation stratejisi oluşturulmalı
- [ ] **Pagination**: Bazı list endpoint'lerinde pagination eksik
  - Tüm list endpoint'leri paginate edilmeli
  - Cursor-based pagination düşünülmeli (büyük veri setleri için)
  - Page size limit'leri belirlenmeli
- [ ] **Database Indexing**: Performans için index'ler optimize edilmeli
  - Foreign key'ler için index'ler kontrol edilmeli
  - Sık kullanılan query field'ları için index'ler eklenmeli
  - Composite index'ler optimize edilmeli
- [ ] **Database Connection Pooling**: Connection pool yönetimi iyileştirilmeli
  - PgBouncer veya benzeri connection pooler kullanılmalı
  - Connection timeout ayarları optimize edilmeli
- [ ] **Background Tasks**: Uzun süren işlemler için async task sistemi yok
  - Celery veya Django-Q entegrasyonu yapılmalı
  - Email gönderimi async yapılmalı
  - Report generation async yapılmalı

#### Frontend Performance
- [ ] **Data Caching**: React Query veya SWR kullanılmıyor
  - API response cache'leme yok
  - Stale-while-revalidate pattern uygulanmamış
  - Optimistic updates yok
  - Background refetching yok
- [ ] **Code Splitting**: Lazy loading eksik, bundle size büyük olabilir
  - Route-based code splitting yapılmalı
  - Component lazy loading eklenmeli
  - Dynamic import'lar kullanılmalı
  - Bundle analyzer ile analiz yapılmalı
- [ ] **Image Optimization**: Next.js Image component kullanılmıyor
  - Tüm img tag'leri Next.js Image component'i ile değiştirilmeli
  - Image lazy loading eklenmeli
  - Responsive image srcset'leri kullanılmalı
- [ ] **API Request Optimization**: Gereksiz API çağrıları olabilir
  - Request deduplication yapılmalı
  - Batch request'ler düşünülmeli
  - Debouncing/throttling eklenmeli
  - Request cancellation implementasyonu yapılmalı
- [ ] **State Management**: Global state management eksik
  - Zustand veya Jotai gibi hafif state management eklenmeli
  - Context API overuse'u azaltılmalı
  - State persistence (localStorage) eklenmeli

### 📋 Düşük Öncelikli Özellikler

#### Advanced Features
- [ ] **Real-time Updates**: WebSocket entegrasyonu yok
  - Django Channels veya Socket.io entegrasyonu yapılmalı
  - Live grade updates
  - Real-time notifications
  - Collaborative features (birden fazla teacher aynı anda not girebilir)
- [ ] **Notification System**: Bildirim sistemi eksik
  - In-app notification center yok
  - Push notification desteği yok
  - Email notification preferences yok
  - Notification history görüntüleme yok
- [ ] **Search & Filters**: Gelişmiş arama ve filtreleme eksik
  - Full-text search yok
  - Advanced filter builder yok
  - Saved filters yok
  - Search history yok
- [ ] **Data Export**: PDF, Excel, CSV export fonksiyonları eksik
  - PDF report generation yok
  - Excel export with formatting yok
  - CSV export with custom columns yok
  - Scheduled report export yok
- [ ] **Multi-language Support**: i18n entegrasyonu yok
  - next-intl veya react-i18next entegrasyonu yapılmalı
  - Dil seçimi UI'ı eklenmeli
  - Tüm string'ler translate edilmeli
  - RTL dil desteği düşünülmeli
- [ ] **Advanced Analytics**: Karşılaştırma raporları, trend analizi eksik
  - Year-over-year karşılaştırmalar yok
  - Cohort analysis yok
  - Predictive analytics yok
  - Custom metric tanımlama yok
- [ ] **Custom Report Builder**: Özel rapor oluşturma özelliği yok
  - Drag-and-drop report builder yok
  - Custom chart types yok
  - Report template library yok
  - Scheduled report delivery yok
- [ ] **Email Notifications**: Email bildirim sistemi yok
  - Grade notification emails yok
  - Assignment reminder emails yok
  - Weekly summary emails yok
  - Customizable email preferences yok
- [ ] **Calendar Integration**: Takvim entegrasyonu yok
  - Google Calendar sync yok
  - Outlook Calendar sync yok
  - Assignment due dates calendar view yok
  - Event reminders yok
- [ ] **File Management**: Dosya yönetim sistemi eksik
  - Assignment file upload yok
  - Student submission file upload yok
  - File versioning yok
  - File sharing yok

#### Security & Compliance
- [ ] **Security Audit**: Güvenlik denetimi yapılmamış
  - Penetration testing yapılmamış
  - Vulnerability scanning yapılmamış
  - Security headers kontrol edilmeli (CSP, HSTS, vb.)
  - Dependency security audit yapılmalı (npm audit, pip-audit)
- [ ] **XSS Protection**: Input sanitization kontrol edilmeli
  - DOMPurify veya benzeri sanitization library eklenmeli
  - Rich text editor'ler için XSS protection yapılmalı
  - Output encoding kontrol edilmeli
- [ ] **SQL Injection**: ORM kullanılıyor ama ek kontroller gerekebilir
  - Raw SQL query'ler kontrol edilmeli
  - Parameterized query kullanımı doğrulanmalı
  - Database user permissions minimize edilmeli
- [ ] **CSRF Protection**: Django CSRF var ama frontend'de kontrol edilmeli
  - CSRF token'ların tüm POST/PUT/DELETE request'lerde gönderildiği doğrulanmalı
  - Double-submit cookie pattern düşünülmeli
- [ ] **Password Policy**: Şifre güvenlik kuralları eksik
  - Minimum password length enforcement yok
  - Password complexity requirements yok
  - Password expiration policy yok
  - Password history (önceden kullanılan şifreler) yok
- [ ] **Audit Logging**: Kullanıcı aktivite logları eksik
  - Sensitive action logging eksik (şifre değiştirme, silme işlemleri)
  - Login attempt logging yok
  - IP address tracking yok
  - Session management logging yok
- [ ] **Data Encryption**: Hassas veri şifreleme eksik
  - Database encryption at rest yok
  - Sensitive field encryption yok
  - Backup encryption yok
- [ ] **GDPR Compliance**: GDPR uyumluluğu eksik
  - Data export (user data download) yok
  - Data deletion (right to be forgotten) yok
  - Consent management yok
  - Privacy policy integration yok

#### DevOps & Deployment
- [ ] **CI/CD Pipeline**: Otomatik test ve deploy pipeline yok
  - GitHub Actions veya GitLab CI yapılandırması yok
  - Automated testing pipeline yok
  - Automated deployment pipeline yok
  - Pre-deployment checks yok
- [ ] **Docker**: Containerization yok
  - Dockerfile'lar oluşturulmalı (backend ve frontend için)
  - docker-compose.yml ile local development setup yapılmalı
  - Multi-stage builds optimize edilmeli
  - Docker image registry setup yapılmalı
- [ ] **Environment Management**: Production/staging environment setup eksik
  - Environment variable management yok
  - Secrets management (Vault, AWS Secrets Manager) yok
  - Environment-specific configuration yok
  - Feature flags sistemi yok
- [ ] **Monitoring**: Application monitoring (Sentry, LogRocket vb.) yok
  - Error tracking (Sentry) entegrasyonu yok
  - Performance monitoring (APM) yok
  - User session replay yok
  - Uptime monitoring yok
- [ ] **Backup Strategy**: Veritabanı yedekleme stratejisi yok
  - Automated database backup yok
  - Backup retention policy yok
  - Backup restoration testi yapılmamış
  - Disaster recovery plan yok
- [ ] **Logging**: Centralized logging sistemi yok
  - ELK stack veya benzeri logging solution yok
  - Log aggregation yok
  - Log retention policy yok
  - Log analysis tools yok
- [ ] **Infrastructure as Code**: IaC yapılandırması yok
  - Terraform veya CloudFormation yapılandırması yok
  - Infrastructure versioning yok
  - Automated infrastructure provisioning yok

### 🐛 Bilinen Sorunlar ve TODO'lar

#### Kod İçinde TODO İşaretleri
- `backend/api/views.py` - Bazı endpoint'lerde TODO yorumları var
- GPA hesaplama notu (4.0 scale conversion) - Farklı grading system'leri için düşünülmeli

#### Eksik Sayfalar ve Özellikler
- `/teacher/courses` - Detaylı kurs yönetimi sayfası eksik
- `/institution/reports` - Reports sayfası eksik
- `/institution/students` - Öğrenci yönetimi sayfası eksik
- `/institution/courses` - Kurs yönetimi sayfası eksik
- `/super-admin/users` - Kullanıcı yönetimi sayfası eksik
- `/super-admin/settings` - Sistem ayarları sayfası eksik
- `/super-admin/reports` - Sistem raporları sayfası eksik

#### API Endpoint Eksikleri
- [ ] `GET /api/institution/students/` - Kurum öğrenci listesi
- [ ] `GET /api/institution/courses/` - Kurum kurs listesi
- [ ] `POST /api/institution/courses/` - Kurs oluşturma
- [ ] `GET /api/super-admin/users/` - Tüm kullanıcılar listesi
- [ ] `GET /api/super-admin/reports/` - Sistem raporları
- [ ] `POST /api/export/grades/` - Not export endpoint'i
- [ ] `POST /api/import/grades/` - Not import endpoint'i
- [ ] `POST /api/export/report/` - Rapor export endpoint'i
- [ ] `GET /api/notifications/` - Bildirimler endpoint'i
- [ ] `POST /api/files/upload/` - Dosya yükleme endpoint'i

#### Database Schema İyileştirmeleri
- [ ] **Soft Delete**: User ve diğer modeller için soft delete eklenmeli
- [ ] **Versioning**: Model versioning (audit trail) eklenmeli
- [ ] **Full-text Search**: PostgreSQL full-text search index'leri eklenmeli
- [ ] **Partitioning**: Büyük tablolar için partitioning düşünülmeli (activity_logs, student_grades)
- [ ] **Materialized Views**: Sık kullanılan complex query'ler için materialized view'lar oluşturulmalı

#### Frontend Component Eksikleri
- [ ] **DataTable Component**: Reusable, feature-rich data table component yok
- [ ] **Form Builder**: Dynamic form builder component yok
- [ ] **Chart Library Wrapper**: Chart.js wrapper component'leri eksik
- [ ] **Date Range Picker**: Date range picker component yok
- [ ] **File Upload Component**: Drag-and-drop file upload component yok
- [ ] **Rich Text Editor**: Rich text editor component yok
- [ ] **PDF Viewer**: PDF görüntüleme component'i yok
- [ ] **Print Preview**: Print-friendly view component'leri yok

### 📊 Öncelik Matrisi

| Öncelik | Kategori | Özellik | Durum |
|---------|----------|---------|-------|
| 🔴 Yüksek | Backend | API Dokümantasyonu | ❌ Eksik |
| 🔴 Yüksek | Backend | Unit Testler | ❌ Eksik |
| 🔴 Yüksek | Backend | Production Security | ⚠️ DEBUG=True |
| 🔴 Yüksek | Frontend | Institution API Entegrasyonu | ❌ Mock Data |
| 🔴 Yüksek | Frontend | Teacher PO Management API | ❌ Mock Data |
| 🟡 Orta | UI/UX | Toast Notifications | ❌ Eksik |
| 🟡 Orta | UI/UX | Loading Skeletons | ⚠️ Basit Spinner |
| 🟡 Orta | Performance | Caching (Redis) | ❌ Eksik |
| 🟡 Orta | Performance | Database Optimization | ⚠️ İyileştirilebilir |
| 🟢 Düşük | Advanced | Real-time Updates | ❌ Eksik |
| 🟢 Düşük | Advanced | Email Notifications | ❌ Eksik |
| 🟢 Düşük | DevOps | CI/CD Pipeline | ❌ Eksik |
| 🟢 Düşük | DevOps | Docker | ❌ Eksik |

### 🎯 Önerilen Geliştirme Sırası

#### Phase 1 (Kritik - Hemen Yapılmalı) 🚨
**Süre Tahmini: 2-3 hafta**

1. **Production Security**
   - [ ] DEBUG=False ayarları
   - [ ] ALLOWED_HOSTS yapılandırması
   - [ ] SECRET_KEY environment variable
   - [ ] CORS production ayarları
   - [ ] Security headers (CSP, HSTS)

2. **API Dokümantasyonu**
   - [ ] Swagger/OpenAPI entegrasyonu
   - [ ] Tüm endpoint'lerin dokümantasyonu
   - [ ] Request/Response örnekleri
   - [ ] Authentication gereksinimleri

3. **Temel Unit Testler**
   - [ ] Model testleri (%80 coverage hedefi)
   - [ ] View testleri (kritik endpoint'ler)
   - [ ] Serializer testleri

4. **Error Handling**
   - [ ] Structured logging (JSON format)
   - [ ] Custom exception handler'lar
   - [ ] Error tracking (Sentry) entegrasyonu

#### Phase 2 (Yüksek Öncelik - 1-2 Ay İçinde) 🔴
**Süre Tahmini: 4-6 hafta**

1. **Eksik Sayfalar**
   - [ ] Teacher Courses sayfası
   - [ ] Institution Students sayfası
   - [ ] Institution Courses sayfası
   - [ ] Super Admin Users sayfası
   - [ ] Super Admin Reports sayfası

2. **Export/Import Fonksiyonları**
   - [ ] Grade CSV/Excel export
   - [ ] Grade CSV import
   - [ ] Report PDF/Excel export
   - [ ] Bulk operations API endpoint'leri

3. **Rate Limiting**
   - [ ] Django-ratelimit entegrasyonu
   - [ ] Endpoint bazlı rate limit tanımlamaları
   - [ ] IP-based rate limiting

4. **File Upload**
   - [ ] Profile picture upload
   - [ ] Assignment file upload
   - [ ] File validation ve storage

#### Phase 3 (Orta Öncelik - 2-3 Ay İçinde) 🟡
**Süre Tahmini: 6-8 hafta**

1. **UI/UX İyileştirmeleri**
   - [ ] Toast notification sistemi (react-hot-toast)
   - [ ] Loading skeleton component'leri
   - [ ] Empty state component'leri
   - [ ] Confirmation modal component'leri
   - [ ] Real-time form validation

2. **Performance Optimizasyonu**
   - [ ] Redis cache entegrasyonu
   - [ ] Database query optimization (N+1 fixes)
   - [ ] Code splitting ve lazy loading
   - [ ] Image optimization (Next.js Image)
   - [ ] API request optimization

3. **Data Caching**
   - [ ] React Query veya SWR entegrasyonu
   - [ ] API response caching
   - [ ] Optimistic updates

4. **Accessibility**
   - [ ] ARIA labels ekleme
   - [ ] Keyboard navigation
   - [ ] Screen reader uyumluluğu
   - [ ] Focus management

#### Phase 4 (Düşük Öncelik - 3-6 Ay İçinde) 🟢
**Süre Tahmini: 8-12 hafta**

1. **Advanced Features**
   - [ ] Real-time updates (WebSocket)
   - [ ] Notification system
   - [ ] Advanced search & filters
   - [ ] Custom report builder
   - [ ] Calendar integration

2. **Multi-language Support**
   - [ ] i18n entegrasyonu
   - [ ] Dil seçimi UI
   - [ ] String translation

3. **Background Tasks**
   - [ ] Celery entegrasyonu
   - [ ] Async email sending
   - [ ] Scheduled report generation

4. **DevOps & Infrastructure**
   - [ ] Docker containerization
   - [ ] CI/CD pipeline
   - [ ] Monitoring (Sentry, APM)
   - [ ] Backup strategy
   - [ ] Infrastructure as Code

#### Phase 5 (Gelecek Özellikler - 6+ Ay) 🔮
**Süre Tahmini: 12+ hafta**

1. **Security & Compliance**
   - [ ] Security audit
   - [ ] GDPR compliance
   - [ ] Data encryption
   - [ ] Password policy enforcement

2. **Advanced Analytics**
   - [ ] Predictive analytics
   - [ ] Machine learning integration
   - [ ] Custom metrics
   - [ ] Cohort analysis

3. **Enterprise Features**
   - [ ] Multi-tenant support
   - [ ] SSO integration
   - [ ] Advanced role management
   - [ ] Audit trail system
- ✅ File upload API endpoint'leri
- ✅ Bulk operations API endpoint'leri

### Geliştirme Aşamasındaki Özellikler 🔄
- 🔄 File upload frontend entegrasyonu
- 🔄 Bulk operations frontend entegrasyonu
- 🔄 Swagger/OpenAPI dokümantasyonu
- 🔄 Unit test coverage artırma

---

**AcuRate** - Academic Performance Analysis System © 2025
