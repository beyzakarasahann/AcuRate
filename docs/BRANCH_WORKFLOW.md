# 🌿 AcuRate - Git Branch Workflow

## 📋 Branch Yapısı

```
main (production)
│
├── develop (test/staging)
│   │
│   ├── dev/alperen (Backend: Models, Database)
│   │
│   ├── dev/bilgisu (Backend: API, Serializers)
│   │
│   ├── dev/tuana (Frontend: Institution Dashboard, Analytics)
│   │
│   └── dev/beyza (Frontend: Student/Teacher Dashboard)
```

---

## 👥 Takım Görev Dağılımı

### 🔵 Alperen - Backend Foundation
**Branch**: `dev/alperen`

**Sorumluluklar**:
- Django Models (User, Course, ProgramOutcome, Assessment, Grade, Achievement)
- Database Schema Design
- Admin Panel Customization
- Initial Migrations
- Test Data Generator
- Backend Documentation

**Tamamlanacak Dosyalar**:
- `backend/api/models.py`
- `backend/api/admin.py`
- `backend/create_test_data.py`
- `backend/README.md`
- `backend/SETUP.md`

---

### 🟢 Bilgisu - Backend API
**Branch**: `dev/bilgisu`

**Sorumluluklar**:
- Django REST Framework Serializers
- API Endpoints (CRUD operations)
- JWT Authentication Implementation
- API Permissions & Validators
- API Documentation (Swagger/Postman)
- Integration Tests

**Tamamlanacak Dosyalar**:
- `backend/api/serializers.py`
- `backend/api/views.py`
- `backend/api/urls.py`
- `backend/api/permissions.py`
- `backend/api/tests.py`
- `backend/API_DOCUMENTATION.md`

**Önemli**: Alperen'in model'lerini bekle! Models hazır olduktan sonra başla.

---

### 🟡 Tuana - Frontend Institution
**Branch**: `dev/tuana`

**Sorumluluklar**:
- Institution Dashboard (Main Analytics)
- Department Performance Overview
- Program Outcomes Analytics
- Charts & Visualizations (Recharts)
- Reports & Export Functionality
- Institution Settings

**Tamamlanacak Dosyalar**:
- `frontend/src/app/institution/page.tsx`
- `frontend/src/app/institution/analytics/page.tsx`
- `frontend/src/app/institution/reports/page.tsx`
- `frontend/src/app/institution/settings/page.tsx`
- `frontend/src/components/charts/*`

**Önemli**: İlk aşamada mock data kullan, Bilgisu'nun API'si hazır olduktan sonra entegre et.

---

### 🟣 Beyza - Frontend Student/Teacher
**Branch**: `dev/beyza`

**Sorumluluklar**:
- Student Dashboard (Performance, Courses, PO Progress)
- Teacher Dashboard (Courses, Grading, Student Analytics)
- User Profile Pages
- Grade Input Forms
- Course Management UI
- Notifications System

**Tamamlanacak Dosyalar**:
- `frontend/src/app/student/page.tsx`
- `frontend/src/app/student/courses/page.tsx`
- `frontend/src/app/student/performance/page.tsx`
- `frontend/src/app/teacher/page.tsx`
- `frontend/src/app/teacher/courses/page.tsx`
- `frontend/src/app/teacher/grading/page.tsx`

**Önemli**: İlk aşamada mock data kullan, Bilgisu'nun API'si hazır olduktan sonra entegre et.

---

## 🔄 Workflow Kuralları

### 1. Branch Oluşturma
```bash
# Ana branch'lerden biri üzerindeyken
git checkout develop
git pull origin develop

# Kendi branch'inizi oluşturun (zaten oluşturuldu)
git checkout dev/your-name
```

### 2. Günlük Çalışma
```bash
# Her gün işe başlamadan önce
git checkout dev/your-name
git pull origin develop  # Develop'daki güncellemeleri al
git merge develop        # Develop'ı kendi branch'ine merge et

# Çalışmanızı yapın...

# Değişiklikleri commit edin
git add .
git commit -m "feat: açıklayıcı commit mesajı"

# Kendi branch'inizi push edin
git push origin dev/your-name
```

### 3. Develop'a Merge (Pull Request)
```bash
# Branch'inizdeki tüm değişiklikler commit edilmiş olmalı
git checkout develop
git pull origin develop
git merge dev/your-name

# Conflict varsa çözün
# Test edin (backend ve frontend)

git push origin develop
```

### 4. Production'a Geçiş (Admin - Alperen)
```bash
# Sadece develop tamamen test edildikten sonra
git checkout main
git pull origin main
git merge develop
git push origin main

# Tag ekle (version)
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

## 📝 Commit Message Kuralları

### Format:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types:
- `feat`: Yeni özellik
- `fix`: Bug düzeltme
- `docs`: Dokümantasyon
- `style`: Code style (formatting, semicolons, vb)
- `refactor`: Code refactoring
- `test`: Test ekleme/düzeltme
- `chore`: Build process, dependencies

### Örnekler:
```bash
git commit -m "feat(models): add ProgramOutcome and StudentPOAchievement models"
git commit -m "fix(api): resolve grade calculation bug"
git commit -m "docs(readme): update installation instructions"
git commit -m "feat(dashboard): add institution analytics page"
```

---

## 🔀 Merge Stratejisi

### Merge Sırası:
```
dev/alperen → develop (ilk)
    ↓
dev/bilgisu → develop (alperen'den sonra)
    ↓
dev/tuana → develop (bilgisu ile paralel olabilir)
    ↓
dev/beyza → develop (bilgisu ile paralel olabilir)
    ↓
develop → main (test sonrası)
```

### Conflict Çözme:
1. Conflict olan dosyayı aç
2. `<<<<<<<`, `=======`, `>>>>>>>` işaretlerini bul
3. Doğru kodu seç (veya ikisini birleştir)
4. İşaretleri sil
5. Test et
6. Commit et

---

## ✅ Merge Checklist

### Backend Merge Öncesi:
- [ ] Migrations çalışıyor mu?
- [ ] Admin panel açılıyor mu?
- [ ] Test data yükleniyor mu?
- [ ] API endpoints çalışıyor mu?
- [ ] Tests pass ediyor mu?

### Frontend Merge Öncesi:
- [ ] Build alınıyor mu? (`npm run build`)
- [ ] Console'da error var mı?
- [ ] Tüm sayfalar açılıyor mu?
- [ ] Responsive tasarım çalışıyor mu?
- [ ] Dark mode çalışıyor mu?

---

## 🆘 Sorun Çözme

### "Conflict" Hatası:
```bash
# Merge sırasında conflict
git status  # Conflict olan dosyaları gör
# Dosyaları manuel düzenle
git add .
git commit -m "merge: resolve conflicts"
```

### "Diverged branches" Hatası:
```bash
git checkout dev/your-name
git fetch origin
git merge origin/dev/your-name
# Conflict varsa çöz
git push origin dev/your-name
```

### Yanlışlıkla develop'a push ettim:
```bash
# Son commit'i geri al (dikkatli!)
git reset --soft HEAD~1
git checkout dev/your-name
git commit -m "fix: moved to correct branch"
```

---

## 📊 Branch Status

| Branch | Owner | Status | Last Updated |
|--------|-------|--------|--------------|
| `main` | Alperen (Admin) | ✅ Stable | - |
| `develop` | Team | 🟡 Testing | - |
| `dev/alperen` | Alperen | 🔵 Active | - |
| `dev/bilgisu` | Bilgisu | ⚪ Waiting | - |
| `dev/tuana` | Tuana | ⚪ Waiting | - |
| `dev/beyza` | Beyza | ⚪ Waiting | - |

---

## 🎯 Geliştirme Timeline

### Week 1: Foundation (Alperen)
- Models
- Admin Panel
- Test Data

### Week 2: API Development (Bilgisu)
- Serializers
- Endpoints
- Authentication

### Week 3-4: Frontend Development (Tuana + Beyza)
- Dashboards
- Components
- API Integration

### Week 5: Integration & Testing
- Bug Fixes
- Performance Optimization
- Documentation

### Week 6: Deployment
- Production Setup
- Final Tests
- Launch 🚀

---

## 📞 İletişim

**Sorularınız için**:
- Alperen: Backend, Database, Git
- Bilgisu: API, Authentication
- Tuana: Institution Dashboard, Charts
- Beyza: Student/Teacher UI

**Daily Standup**: Her gün özet paylaşın!

---

**Başarılar takım! 🚀**

