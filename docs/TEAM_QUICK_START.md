# 🚀 AcuRate - Team Quick Start Guide

## 👋 Hoş Geldiniz!

Bu döküman, AcuRate projesine hızlıca başlamanız için hazırlanmıştır.

---

## 📋 Kendi Branch'inizde Çalışmaya Başlama

### 1️⃣ Repository'yi Clone Et (İlk Kez)

```bash
# Terminal'i aç
cd ~/Documents/GitHub

# Repository'yi clone et
git clone https://github.com/your-username/AcuRate.git
cd AcuRate

# Tüm branch'leri gör
git branch -a
```

---

### 2️⃣ Kendi Branch'inize Geç

```bash
# Alperen için
git checkout dev/alperen

# Bilgisu için
git checkout dev/bilgisu

# Tuana için
git checkout dev/tuana

# Beyza için
git checkout dev/beyza
```

---

## 🔵 Alperen - Backend Setup

### Görevleriniz:
✅ Django Models oluştur
✅ Admin Panel özelleştir
✅ Test data generator yaz
✅ Database migrations
✅ Dokümantasyon

### Kurulum:

```bash
cd backend

# Virtual environment oluştur
python -m venv venv

# Aktifleştir (Mac/Linux)
source venv/bin/activate

# Aktifleştir (Windows)
venv\Scripts\activate

# Paketleri yükle
pip install -r requirements.txt

# Migrations
python manage.py makemigrations
python manage.py migrate

# Superuser oluştur
python manage.py createsuperuser
# Username: admin
# Email: admin@acurate.com
# Password: admin123

# Test data yükle
python create_test_data.py

# Server başlat
python manage.py runserver
```

### Test:
- Admin Panel: http://127.0.0.1:8000/admin/
- Login: admin / admin123

---

## 🟢 Bilgisu - API Development

### Görevleriniz:
⏳ Serializers oluştur (Alperen'in model'lerinden sonra)
⏳ API endpoints (CRUD)
⏳ JWT authentication
⏳ API documentation
⏳ Tests

### Kurulum:

```bash
cd backend

# Virtual environment oluştur
python -m venv venv

# Aktifleştir (Mac/Linux)
source venv/bin/activate

# Aktifleştir (Windows)
venv\Scripts\activate

# Paketleri yükle
pip install -r requirements.txt

# Database hazır mı kontrol et
python manage.py migrate

# Server başlat
python manage.py runserver
```

### Başlangıç Noktanız:

1. **Alperen'in model'lerini incele**: `backend/api/models.py`
2. **Serializers oluştur**: `backend/api/serializers.py`
3. **ViewSets yaz**: `backend/api/views.py`
4. **URLs tanımla**: `backend/api/urls.py`

### Örnek API Endpoint:
```python
# api/serializers.py
from rest_framework import serializers
from .models import ProgramOutcome

class ProgramOutcomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramOutcome
        fields = '__all__'

# api/views.py
from rest_framework import viewsets
from .models import ProgramOutcome
from .serializers import ProgramOutcomeSerializer

class ProgramOutcomeViewSet(viewsets.ModelViewSet):
    queryset = ProgramOutcome.objects.all()
    serializer_class = ProgramOutcomeSerializer
```

---

## 🟡 Tuana - Institution Dashboard

### Görevleriniz:
✅ Institution Dashboard (main page) [Alperen tarafından oluşturuldu]
⏳ Analytics page
⏳ Reports & Export
⏳ Charts & Visualizations
⏳ Department Performance

### Kurulum:

```bash
cd frontend

# Node modules yükle
npm install

# Development server başlat
npm run dev
```

### Test:
- Ana sayfa: http://localhost:3000
- Login: http://localhost:3000/login
- Institution Dashboard: http://localhost:3000/institution

### Login Bilgileri (Demo):
- Username: `admin`
- Password: `admin123`

### Başlangıç Noktanız:

1. **Mevcut dashboard'u incele**: `src/app/institution/page.tsx`
2. **Analytics sayfası oluştur**: `src/app/institution/analytics/page.tsx`
3. **Chart component'leri ekle**: `src/components/charts/`
4. **Mock data kullan**: İlk aşamada backend'e bağlanma

### Örnek Chart Component:
```tsx
// src/components/charts/DepartmentChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function DepartmentChart() {
  const data = [
    { department: 'CS', performance: 78.5 },
    { department: 'EE', performance: 75.2 },
    // ...
  ];

  return (
    <BarChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="department" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="performance" fill="#3b82f6" />
    </BarChart>
  );
}
```

---

## 🟣 Beyza - Student & Teacher Dashboards

### Görevleriniz:
✅ Student Dashboard (placeholder) [Alperen tarafından oluşturuldu]
✅ Teacher Dashboard (placeholder) [Alperen tarafından oluşturuldu]
⏳ Student performance page
⏳ Student courses page
⏳ Teacher grading page
⏳ Teacher course management

### Kurulum:

```bash
cd frontend

# Node modules yükle
npm install

# Development server başlat
npm run dev
```

### Test:
- Student Dashboard: http://localhost:3000/student
- Teacher Dashboard: http://localhost:3000/teacher

### Login Bilgileri (Demo):
**Student**:
- Username: `student1`
- Password: `student123`

**Teacher**:
- Username: `teacher1`
- Password: `teacher123`

### Başlangıç Noktanız:

1. **Mevcut placeholder'ları incele**: 
   - `src/app/student/page.tsx`
   - `src/app/teacher/page.tsx`

2. **Student pages oluştur**:
   - `src/app/student/courses/page.tsx`
   - `src/app/student/performance/page.tsx`
   - `src/app/student/program-outcomes/page.tsx`

3. **Teacher pages oluştur**:
   - `src/app/teacher/courses/page.tsx`
   - `src/app/teacher/grading/page.tsx`
   - `src/app/teacher/students/page.tsx`

4. **Mock data kullan**: İlk aşamada backend'e bağlanma

---

## 🔄 Günlük Workflow

### Her Gün İşe Başlarken:

```bash
# Kendi branch'inize geç
git checkout dev/your-name

# Develop'dan güncellemeleri al
git pull origin develop
git merge develop

# Çalışmaya başla!
```

### Gün Sonunda:

```bash
# Değişiklikleri kaydet
git add .
git commit -m "feat: bugün yaptığım değişiklikler"

# Kendi branch'inizi push edin
git push origin dev/your-name
```

### Develop'a Merge (İş bitince):

```bash
# Kendi branch'inizdeki değişiklikler commit edilmiş olmalı
git checkout develop
git pull origin develop
git merge dev/your-name

# Conflict varsa çözün
# Test edin!

git push origin develop
```

---

## 🛠️ Gerekli Araçlar

### Herkes İçin:
- ✅ Git (version control)
- ✅ VS Code veya Cursor
- ✅ Terminal

### Backend (Alperen, Bilgisu):
- ✅ Python 3.12+
- ✅ pip
- ✅ PostgreSQL (production için)

### Frontend (Tuana, Beyza):
- ✅ Node.js 18+
- ✅ npm veya yarn

---

## 📚 Önemli Dosyalar

### Dokümantasyon:
- `BRANCH_WORKFLOW.md` - Git workflow
- `backend/README.md` - Backend genel bilgi
- `backend/SETUP.md` - Backend kurulum
- `ALPEREN_COMPLETED_TASKS.md` - Alperen'in yaptıkları
- `MERGE_GUIDE.md` - Branch birleştirme kılavuzu

### Backend:
- `backend/api/models.py` - Database models
- `backend/api/admin.py` - Admin panel
- `backend/create_test_data.py` - Test data generator
- `backend/requirements.txt` - Python packages

### Frontend:
- `frontend/src/app/` - Pages
- `frontend/src/components/` - Reusable components
- `frontend/src/middleware.ts` - Route protection
- `frontend/package.json` - Node packages

---

## 🎨 Design System

### Colors:
- **Primary**: Blue (`#3b82f6`)
- **Success**: Green (`#10b981`)
- **Warning**: Orange (`#f59e0b`)
- **Error**: Red (`#ef4444`)
- **Institution**: Indigo gradient
- **Teacher**: Purple gradient
- **Student**: Blue gradient

### Components:
- **Glassmorphism**: `backdrop-blur-xl bg-white/10`
- **Shadows**: `shadow-lg shadow-blue-500/20`
- **Animations**: Framer Motion
- **Charts**: Recharts library

---

## 🆘 Sorun mu Var?

### Backend Sorunları (Alperen):
```bash
# Virtual environment aktif mi?
which python  # venv/bin/python olmalı

# Migrations güncel mi?
python manage.py showmigrations

# Database sıfırla (DİKKAT: Tüm data silinir!)
rm db.sqlite3
python manage.py migrate
python create_test_data.py
```

### Frontend Sorunları (Tuana, Beyza):
```bash
# node_modules temizle
rm -rf node_modules package-lock.json
npm install

# Cache temizle
npm run dev -- --turbo --force
```

### Git Sorunları (Herkes):
```bash
# Branch durumu
git status
git branch

# Son commit'i geri al (dikkatli!)
git reset --soft HEAD~1

# Değişiklikleri at (dikkatli!)
git checkout .
```

---

## 📞 Takım İletişimi

### Sorularınız İçin:
- **Backend/Database**: Alperen
- **API**: Bilgisu
- **Institution UI**: Tuana
- **Student/Teacher UI**: Beyza

### Daily Updates:
Her gün özet paylaşın:
- ✅ Bugün ne yaptım?
- 🚧 Şu anda nerede takıldım?
- 📅 Yarın ne yapacağım?

---

## 🎯 Next Steps

### Alperen:
1. ✅ Models oluştur
2. ✅ Admin panel
3. ✅ Test data
4. ⏳ Dokümantasyonu tamamla

### Bilgisu:
1. ⏳ Models'leri incele
2. ⏳ Serializers oluştur
3. ⏳ API endpoints
4. ⏳ Authentication

### Tuana:
1. ✅ Institution dashboard'u incele
2. ⏳ Analytics sayfası
3. ⏳ Charts ekle
4. ⏳ Reports

### Beyza:
1. ✅ Placeholder'ları incele
2. ⏳ Student pages
3. ⏳ Teacher pages
4. ⏳ Grading UI

---

## 🎉 Başarılar Takım!

**Remember**: 
- 📝 Commit sık sık!
- 🧪 Test et!
- 💬 İletişim kur!
- 🚀 Eğlen!

---

**Questions?** Alperen'e sorun! 😊

