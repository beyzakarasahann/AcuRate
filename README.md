# AcuRate - Academic Performance Analysis System

AcuRate, üniversiteler, okullar ve eğitim kurumları için kapsamlı bir akademik performans takip ve analiz platformudur. Öğrenci notları, Program Çıktıları (PO) başarıları, kurs performansları ve kurumsal analitikleri yönetmek için modern bir web uygulamasıdır.

## 🎯 Özellikler

### 👨‍🎓 Öğrenci Paneli
- **Dashboard**: Genel performans özeti, GPA, tamamlanan dersler, aktif kurslar
- **Kurslar**: Aldığı dersler, notlar, assessment'lar, final notları
- **Program Çıktıları**: PO başarıları, hedef karşılaştırmaları, ilerleme takibi
- **Analytics**: GPA trendleri, kategori bazlı performans, anonim sıralama
- **Settings**: Profil yönetimi, şifre değiştirme

### 👨‍🏫 Öğretmen Paneli
- **Dashboard**: Kurs istatistikleri, öğrenci sayıları, bekleyen değerlendirmeler
- **Grades**: Öğrenci notları girişi, assessment yönetimi, otomatik final not hesaplama
- **PO Management**: Kurslar için Program Çıktıları tanımlama, özel PO oluşturma
- **Analytics**: Kurs performans analizi, öğrenci başarı takibi

### 🏛️ Kurum Paneli
- **Dashboard**: Kurumsal genel bakış, toplam öğrenci/öğretmen/ders sayıları
- **Analytics**: Departman bazlı istatistikler, PO başarı raporları

### 🌐 Genel Özellikler
- **Dark/Light Mode**: Tema desteği
- **Responsive Design**: Mobil uyumlu arayüz
- **Real-time Data**: Backend'den dinamik veri çekme
- **JWT Authentication**: Güvenli kimlik doğrulama
- **Contact Form**: Kurumsal demo talepleri için iletişim formu

## 🛠️ Teknolojiler

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animasyonlar
- **Chart.js** - Veri görselleştirme
- **Lucide React** - İkonlar
- **next-themes** - Tema yönetimi

### Backend
- **Django 5** - Python web framework
- **Django REST Framework** - RESTful API
- **PostgreSQL** - Veritabanı
- **JWT Authentication** - Token-based auth
- **Django Admin** - Yönetim paneli

## 📋 Gereksinimler

- **Node.js** 18+ 
- **Python** 3.12+
- **PostgreSQL** 14+
- **npm** veya **yarn**

## 🚀 Kurulum

### 1. Repository'yi Klonlayın

```bash
git clone <repository-url>
cd AcuRate
```

### 2. Backend Kurulumu

```bash
cd backend

# Virtual environment oluştur
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Dependencies yükle
pip install -r requirements.txt

# PostgreSQL veritabanını oluştur
# PostgreSQL'de 'acurate_db' adında bir veritabanı oluşturun

# Environment variables ayarla (.env dosyası)
DATABASE_NAME=acurate_db
DATABASE_USER=acurate_user
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
SECRET_KEY=your-secret-key-here

# Migrations çalıştır
python manage.py migrate

# Test verileri oluştur (opsiyonel)
python create_test_data.py

# Admin kullanıcısı oluştur
python manage.py createsuperuser

# Development server'ı başlat
python manage.py runserver
```

Backend şu adreste çalışacak: `http://localhost:8000`

### 3. Frontend Kurulumu

```bash
cd frontend

# Dependencies yükle
npm install

# Environment variables ayarla (.env.local dosyası)
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Development server'ı başlat
npm run dev
```

Frontend şu adreste çalışacak: `http://localhost:3000`

## 📁 Proje Yapısı

```
AcuRate/
├── backend/                 # Django backend
│   ├── api/                # API uygulaması
│   │   ├── models.py       # Veritabanı modelleri
│   │   ├── views.py        # API view'ları
│   │   ├── serializers.py  # API serializers
│   │   ├── urls.py         # URL routing
│   │   └── admin.py        # Django admin
│   ├── backend/            # Django settings
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   │   ├── login/     # Login sayfası
│   │   │   ├── student/   # Öğrenci sayfaları
│   │   │   ├── teacher/   # Öğretmen sayfaları
│   │   │   ├── institution/ # Kurum sayfaları
│   │   │   └── contact/   # İletişim formu
│   │   ├── components/    # React bileşenleri
│   │   ├── lib/          # Utilities & API client
│   │   └── hooks/        # Custom hooks
│   └── package.json
│
└── README.md
```

## 🔐 Demo Hesaplar

Test verileri oluşturulduktan sonra şu hesaplarla giriş yapabilirsiniz:

### Öğrenci
- **Username**: `beyza.karasahan` veya `beyza2`
- **Password**: `beyza123`
- **Email**: `beyza.karasahan@live.acibadem.edu.tr`

### Öğretmen
- **Username**: `teacher1` veya `teacher2`
- **Password**: `teacher123`

### Admin
- **Username**: `admin`
- **Password**: `admin123`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login/` - Kullanıcı girişi
- `POST /api/auth/logout/` - Çıkış
- `GET /api/auth/me/` - Mevcut kullanıcı bilgisi
- `GET /api/users/me/` - Mevcut kullanıcı bilgisi (ViewSet)

### Dashboards
- `GET /api/dashboard/student/` - Öğrenci dashboard
- `GET /api/dashboard/teacher/` - Öğretmen dashboard
- `GET /api/dashboard/institution/` - Kurum dashboard

### CRUD Endpoints
- `/api/users/` - Kullanıcı yönetimi
- `/api/courses/` - Kurs yönetimi
- `/api/enrollments/` - Kayıt yönetimi
- `/api/assessments/` - Değerlendirme yönetimi
- `/api/grades/` - Not yönetimi
- `/api/program-outcomes/` - Program Çıktıları
- `/api/po-achievements/` - PO başarıları
- `/api/contact-requests/` - İletişim talepleri (admin)

### Contact
- `POST /api/contact/` - İletişim formu gönderimi (public)

## 🎨 Özellikler ve Özelleştirmeler

### Tema Sistemi
- Dark/Light mode desteği
- Dinamik renk paleti
- Smooth geçişler

### Veri Görselleştirme
- Line charts (GPA trendleri)
- Bar charts (Kurs performansları)
- Doughnut charts (PO başarıları)
- Stat cards (Özet bilgiler)

### Form Validasyonları
- Assessment weight toplamı %100 kontrolü
- Max score 100 sabit
- Email format kontrolü
- Şifre güvenlik kuralları

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

# Test çalıştır
python manage.py test
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
```

## 📊 Veritabanı Modelleri

### User
- Öğrenci, Öğretmen, Kurum rolleri
- Profil bilgileri, departman, öğrenci ID

### Course
- Kurs kodu, adı, kredisi, dönem
- Öğretmen ataması
- Program Çıktıları ile ilişkilendirme

### Enrollment
- Öğrenci-kurs kayıtları
- Final notları
- Aktif/pasif durumu

### Assessment
- Sınav, proje, ödev türleri
- Ağırlık, max puan
- Program Çıktıları ile ilişkilendirme

### StudentGrade
- Öğrenci notları
- Assessment'a bağlı
- Otomatik yüzde hesaplama

### StudentPOAchievement
- Program Çıktısı başarı yüzdeleri
- Hedef karşılaştırması
- Otomatik hesaplama

### ContactRequest
- Kurumsal demo talepleri
- İletişim bilgileri
- Durum takibi

## 🐛 Sorun Giderme

### Backend Hataları
- **500 Internal Server Error**: Backend loglarını kontrol edin
- **FieldError**: Model field isimlerini kontrol edin
- **Database Connection**: PostgreSQL servisinin çalıştığından emin olun

### Frontend Hataları
- **API Connection**: Backend'in çalıştığından emin olun
- **CORS Errors**: Backend CORS ayarlarını kontrol edin
- **Authentication**: Token'ların geçerli olduğundan emin olun

## 📝 Son Yapılan Değişiklikler

### Backend
- ✅ PostgreSQL veritabanı entegrasyonu
- ✅ Contact Request modeli ve API endpoint'i
- ✅ User profile update ve password change endpoint'leri
- ✅ Student GPA ranking hesaplama
- ✅ Field error düzeltmeleri (enrollment_date → enrolled_at)
- ✅ PO Achievement serializer düzeltmeleri
- ✅ Admin panel iyileştirmeleri

### Frontend
- ✅ Tüm mock data'lar kaldırıldı, backend entegrasyonu tamamlandı
- ✅ Contact sayfası (B2B landing page)
- ✅ Navbar ve Footer entegrasyonu
- ✅ Student analytics sayfası (ranking eklendi)
- ✅ Student settings sayfası (profil ve şifre değiştirme)
- ✅ Error handling iyileştirmeleri
- ✅ Empty state'ler ve loading state'ler
- ✅ Interface güncellemeleri (backend ile uyumlu)

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje özel bir projedir.

## 👥 Ekip

- **Backend Development**: Django REST Framework
- **Frontend Development**: Next.js & TypeScript
- **Database**: PostgreSQL
- **Design**: Modern, responsive UI/UX

## 📞 İletişim

Kurumsal demo talepleri için: `/contact` sayfasını kullanın.

---

**AcuRate** - Academic Performance Analysis System © 2024
