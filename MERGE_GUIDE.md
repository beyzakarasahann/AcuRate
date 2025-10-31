# 🔀 AcuRate - Branch Merge Kılavuzu

**Git branch'lerini güvenli bir şekilde birleştirme rehberi**

---

## 📋 İçindekiler

1. [Genel Prensipler](#genel-prensipler)
2. [Merge Öncesi Kontrol Listesi](#merge-öncesi-kontrol-listesi)
3. [Adım Adım Merge İşlemi](#adım-adım-merge-işlemi)
4. [Conflict Çözme](#conflict-çözme)
5. [Alperen için Özel Talimatlar](#alperen-için-özel-talimatlar)
6. [Bilgisu için Özel Talimatlar](#bilgisu-için-özel-talimatlar)
7. [Tuana için Özel Talimatlar](#tuana-için-özel-talimatlar)
8. [Beyza için Özel Talimatlar](#beyza-için-özel-talimatlar)
9. [Yaygın Sorunlar ve Çözümleri](#yaygın-sorunlar-ve-çözümleri)

---

## 🎯 Genel Prensipler

### 1. Merge Sırası
```
dev/alperen → develop (ilk)
    ↓
dev/bilgisu → develop (alperen'den sonra)
    ↓
dev/tuana → develop (bilgisu ile paralel)
    ↓
dev/beyza → develop (bilgisu ile paralel)
    ↓
develop → main (test sonrası)
```

### 2. Altın Kurallar
- ✅ Her zaman develop branch'ini güncel tut
- ✅ Merge öncesi tüm değişiklikleri commit et
- ✅ Conflict'leri dikkatlice çöz, test et
- ✅ Merge sonrası mutlaka test et
- ❌ Asla doğrudan main'e merge yapma
- ❌ Test edilmemiş kodu merge etme
- ❌ Force push yapma (özellikle shared branch'lerde)

---

## ✅ Merge Öncesi Kontrol Listesi

### Backend Merge İçin
- [ ] Tüm değişiklikler commit edilmiş mi?
- [ ] `git status` temiz mi?
- [ ] Migrations oluşturulmuş mu?
- [ ] Admin panel çalışıyor mu?
- [ ] Test data yükleniyor mu?
- [ ] Linter hataları var mı?
- [ ] README güncellenmiş mi?

**Kontrol Komutları**:
```bash
cd backend
git status
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

### Frontend Merge İçin
- [ ] Tüm değişiklikler commit edilmiş mi?
- [ ] `git status` temiz mi?
- [ ] Build alınıyor mu? (`npm run build`)
- [ ] Console'da error yok mu?
- [ ] Tüm sayfalar açılıyor mu?
- [ ] Linter hataları var mı?
- [ ] TypeScript hataları var mı?

**Kontrol Komutları**:
```bash
cd frontend
git status
npm run build
npm run lint
```

---

## 🔄 Adım Adım Merge İşlemi

### Senaryo 1: dev/your-name → develop

#### Adım 1: Hazırlık
```bash
# Kendi branch'indesin
git checkout dev/your-name

# Son değişiklikleri commit et
git add .
git commit -m "feat: detailed commit message"

# Push et (backup için)
git push origin dev/your-name
```

#### Adım 2: Develop'ı güncelle
```bash
# Develop'a geç
git checkout develop

# En son develop'ı çek
git pull origin develop
```

#### Adım 3: Merge
```bash
# Kendi branch'ini develop'a merge et
git merge dev/your-name

# İki durum olabilir:
# 1. Fast-forward merge (conflict yok) → devam et
# 2. Conflict var → aşağıdaki "Conflict Çözme" bölümüne git
```

#### Adım 4: Test
```bash
# Backend için
cd backend
python manage.py migrate
python manage.py runserver
# Admin panel'i aç, test et

# Frontend için
cd frontend
npm run dev
# Sayfaları aç, test et
```

#### Adım 5: Push
```bash
# Her şey OK ise push et
git push origin develop
```

---

### Senaryo 2: develop → main (Production)

**⚠️ DİKKAT**: Bu işlemi sadece Alperen (admin) yapmalı!

#### Adım 1: Develop'ı test et
```bash
git checkout develop
git pull origin develop

# Full test suite
cd backend && python manage.py test
cd frontend && npm run build
```

#### Adım 2: Main'e merge
```bash
git checkout main
git pull origin main
git merge develop

# Conflict varsa çöz
```

#### Adım 3: Tag oluştur
```bash
# Version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

#### Adım 4: Push
```bash
git push origin main
```

---

## 🔥 Conflict Çözme

### Conflict Nedir?
İki branch'te aynı dosyanın aynı satırları değiştirildiğinde Git hangisini tutacağına karar veremez.

### Conflict Belirtileri
```bash
$ git merge dev/alperen
Auto-merging backend/api/models.py
CONFLICT (content): Merge conflict in backend/api/models.py
Automatic merge failed; fix conflicts and then commit the result.
```

### Conflict Çözme Adımları

#### 1. Conflict olan dosyaları gör
```bash
git status

# Çıktı:
# Unmerged paths:
#   both modified:   backend/api/models.py
```

#### 2. Dosyayı aç ve conflict işaretlerini bul
```python
<<<<<<< HEAD
def calculate_grade(self):
    return self.score / self.total_score * 100
=======
def calculate_grade(self):
    if self.total_score == 0:
        return 0
    return (self.score / self.total_score) * 100
>>>>>>> dev/alperen
```

**Açıklama**:
- `<<<<<<< HEAD`: Mevcut branch'teki kod (develop)
- `=======`: Ayraç
- `>>>>>>> dev/alperen`: Merge edilecek branch'teki kod

#### 3. Doğru kodu seç

**Seçenek A**: HEAD'i tut
```python
def calculate_grade(self):
    return self.score / self.total_score * 100
```

**Seçenek B**: dev/alperen'i tut
```python
def calculate_grade(self):
    if self.total_score == 0:
        return 0
    return (self.score / self.total_score) * 100
```

**Seçenek C**: İkisini birleştir (genellikle en iyisi)
```python
def calculate_grade(self):
    """Calculate grade percentage with zero-division check"""
    if self.total_score == 0:
        return 0
    return (self.score / self.total_score) * 100
```

#### 4. Conflict işaretlerini sil
```python
# Tüm bu satırları sil:
<<<<<<< HEAD
=======
>>>>>>> dev/alperen
```

#### 5. Dosyayı kaydet ve stage'e ekle
```bash
git add backend/api/models.py
```

#### 6. Diğer conflict'leri çöz
```bash
# Tüm conflict'ler çözülene kadar tekrar et
git status
```

#### 7. Merge'i tamamla
```bash
git commit -m "merge: resolve conflicts between develop and dev/alperen"
```

#### 8. Test et!
```bash
# Conflict çözdükten sonra MUTLAKA test et
python manage.py runserver  # veya npm run dev
```

---

## 👤 Alperen için Özel Talimatlar

### Görevler
- ✅ Backend foundation tamamlandı
- ⏳ Bilgisu'nun API'sini review et
- ⏳ Frontend ekibinin merge'lerini yönet
- ⏳ develop → main merge (production)

### İlk Merge (dev/alperen → develop)
```bash
# dev/alperen branch'indesin
git status  # Temiz olmalı

git checkout develop
git pull origin develop
git merge dev/alperen

# Conflict olmamalı (ilk merge)
# Test et
cd backend && python manage.py migrate
python manage.py runserver
# Admin panel: http://127.0.0.1:8000/admin/

cd ../frontend && npm run dev
# Login: http://localhost:3000/login
# Institution: http://localhost:3000/institution

# Her şey OK
git push origin develop
```

### Diğer Branch'leri Merge Etme
```bash
# Bilgisu'nun branch'i hazır olduğunda
git checkout develop
git pull origin develop
git merge dev/bilgisu

# Conflict varsa:
# 1. Dosyayı aç
# 2. Conflict'i çöz (genellikle her ikisini de tut)
# 3. Test et
# 4. Commit ve push

# Tuana ve Beyza için de aynı
```

### Production Deploy (develop → main)
```bash
# Tüm ekip develop'a merge etmiş olmalı
git checkout develop
git pull origin develop

# Full test
cd backend
python manage.py test
python manage.py check
cd ../frontend
npm run build
npm run lint

# OK ise
git checkout main
git pull origin main
git merge develop

# Tag
git tag -a v1.0.0 -m "Initial release"

# Push
git push origin main
git push origin v1.0.0
```

---

## 👤 Bilgisu için Özel Talimatlar

### Görevler
- ⏳ API endpoints (serializers, views, urls)
- ⏳ JWT authentication
- ⏳ Tests

### Başlamadan Önce
```bash
# Alperen'in değişikliklerini al
git checkout develop
git pull origin develop
git checkout dev/bilgisu
git merge develop

# Conflict varsa çöz (olmamalı henüz)
```

### Merge Öncesi (dev/bilgisu → develop)
```bash
# Kendi branch'inde
cd backend

# Test et
python manage.py test
python manage.py check

# API endpoints çalışıyor mu kontrol et
python manage.py runserver
# http://127.0.0.1:8000/api/

# Swagger docs var mı?
# http://127.0.0.1:8000/api/docs/
```

### Merge İşlemi
```bash
git add .
git commit -m "feat(api): add all REST endpoints and JWT auth"
git push origin dev/bilgisu

# Alperen'e haber ver veya kendin merge et
git checkout develop
git pull origin develop
git merge dev/bilgisu

# Conflict varsa:
# - Genellikle serializers.py, views.py, urls.py'da olur
# - Alperen'in model'lerini değiştirme
# - Kendi API kodunu tut
# - Test et

git push origin develop
```

### Olası Conflict'ler
**Dosya**: `backend/backend/urls.py`

```python
<<<<<<< HEAD
urlpatterns = [
    path('admin/', admin.site.urls),
]
=======
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
>>>>>>> dev/bilgisu
```

**Çözüm**: İkisini de tut (API endpoints ekle)
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
```

---

## 👤 Tuana için Özel Talimatlar

### Görevler
- ⏳ Analytics sayfası
- ⏳ Reports sayfası
- ⏳ Chart components

### Başlamadan Önce
```bash
# Alperen'in değişikliklerini al
git checkout develop
git pull origin develop
git checkout dev/tuana
git merge develop
```

### Merge Öncesi
```bash
cd frontend

# Build test
npm run build

# Lint kontrol
npm run lint

# Tüm sayfalar açılıyor mu?
npm run dev
# http://localhost:3000/institution
# http://localhost:3000/institution/analytics (yeni)
```

### Merge İşlemi
```bash
git add .
git commit -m "feat(institution): add analytics and reports pages"
git push origin dev/tuana

git checkout develop
git pull origin develop
git merge dev/tuana

# Conflict varsa:
# - Genellikle package.json, page.tsx dosyalarında
# - Alperen'in institution/page.tsx'ini değiştirme (zaten var)
# - Kendi yeni sayfalarını ekle

git push origin develop
```

### Olası Conflict'ler
**Dosya**: `frontend/package.json`

```json
<<<<<<< HEAD
"dependencies": {
  "react": "^18.2.0",
  "next": "^14.0.0"
}
=======
"dependencies": {
  "react": "^18.2.0",
  "next": "^14.0.0",
  "recharts": "^2.10.0"
}
>>>>>>> dev/tuana
```

**Çözüm**: İkisini de tut (recharts ekle)
```json
"dependencies": {
  "react": "^18.2.0",
  "next": "^14.0.0",
  "recharts": "^2.10.0"
}
```

---

## 👤 Beyza için Özel Talimatlar

### Görevler
- ⏳ Student dashboard
- ⏳ Teacher dashboard

### Başlamadan Önce
```bash
# Alperen'in değişikliklerini al
git checkout develop
git pull origin develop
git checkout dev/beyza
git merge develop
```

### Merge Öncesi
```bash
cd frontend
npm run build
npm run lint

# Sayfalar açılıyor mu?
npm run dev
# http://localhost:3000/student
# http://localhost:3000/teacher
```

### Merge İşlemi
```bash
git add .
git commit -m "feat(dashboards): complete student and teacher dashboards"
git push origin dev/beyza

git checkout develop
git pull origin develop
git merge dev/beyza

# Conflict varsa:
# - Genellikle student/page.tsx, teacher/page.tsx
# - Alperen placeholder oluşturmuş, sen doldurmuşsun
# - Kendi kodunu tut (placeholder'ları sil)

git push origin develop
```

### Olası Conflict'ler
**Dosya**: `frontend/src/app/student/page.tsx`

```tsx
<<<<<<< HEAD
// Alperen's placeholder
return <div>Coming Soon</div>;
=======
// Beyza's full dashboard
return (
  <div>
    <StudentCourses />
    <StudentPerformance />
  </div>
);
>>>>>>> dev/beyza
```

**Çözüm**: Kendi kodunu tut (Beyza'nın full dashboard)

---

## 🆘 Yaygın Sorunlar ve Çözümleri

### Sorun 1: "Diverged branches"
```bash
$ git push origin develop
! [rejected]        develop -> develop (non-fast-forward)
error: failed to push some refs
```

**Çözüm**:
```bash
git pull origin develop
# Conflict varsa çöz
git push origin develop
```

### Sorun 2: "Uncommitted changes"
```bash
$ git merge dev/alperen
error: Your local changes would be overwritten by merge.
Please commit your changes before merging.
```

**Çözüm**:
```bash
git add .
git commit -m "WIP: save current work"
git merge dev/alperen
```

### Sorun 3: "Already up to date" (ama değil)
```bash
$ git merge dev/alperen
Already up to date.
```

**Çözüm**:
```bash
# Remote'tan çek
git fetch origin
git merge origin/dev/alperen
```

### Sorun 4: Yanlış branch'e commit
```bash
# develop'tayım ama dev/alperen'de olmalıydım
git checkout -b dev/alperen
# Son commit dev/alperen'e taşındı
git push origin dev/alperen

# develop'ı temizle
git checkout develop
git reset --hard origin/develop
```

### Sorun 5: Merge'i geri alma
```bash
# Merge yaptım ama hata var
git reset --hard HEAD~1
# Son commit (merge commit) geri alındı
```

**⚠️ DİKKAT**: `reset --hard` geri alınamaz! Emin ol.

### Sorun 6: Conflict çözerken hata
```bash
# Conflict çözümünde hata yaptım, baştan başlamak istiyorum
git merge --abort
# Merge iptal edildi, conflict öncesi haline dön
```

---

## 📝 Best Practices

### 1. Sık commit et
```bash
# BAD
git commit -m "lots of changes"

# GOOD
git commit -m "feat(models): add ProgramOutcome model"
git commit -m "feat(models): add Course model"
git commit -m "feat(admin): customize PO admin"
```

### 2. Anlamlı commit mesajları
```bash
# Format
<type>(<scope>): <description>

# Types
feat:     Yeni özellik
fix:      Bug fix
docs:     Dokümantasyon
style:    Code formatting
refactor: Code refactoring
test:     Test ekleme
chore:    Build, dependencies

# Examples
feat(api): add user authentication endpoint
fix(models): resolve grade calculation bug
docs(readme): update setup instructions
```

### 3. Merge öncesi pull
```bash
# Her zaman önce pull et
git checkout develop
git pull origin develop
git merge dev/your-name
```

### 4. Küçük, sık merge'ler
```bash
# BAD: 2 hafta sonra 1 dev merge
# GOOD: Her feature tamamlandıkça merge
```

### 5. Test, test, test
```bash
# Merge sonrası MUTLAKA test et
# Backend: python manage.py runserver
# Frontend: npm run dev
# Her iki taraf da çalışmalı
```

---

## 🎯 Checklist

### Her Merge İçin
- [ ] Tüm değişiklikler commit edildi
- [ ] `git status` temiz
- [ ] develop güncel (`git pull origin develop`)
- [ ] Merge yapıldı (`git merge dev/your-name`)
- [ ] Conflict'ler çözüldü (varsa)
- [ ] Backend test edildi
- [ ] Frontend test edildi
- [ ] Linter hataları yok
- [ ] Push edildi (`git push origin develop`)
- [ ] Ekibe bilgi verildi

---

## 📞 Yardım

**Sorunlar**:
1. Önce bu dokümandaki "Yaygın Sorunlar" bölümüne bak
2. Google / Stack Overflow'da ara
3. Ekip üyelerine sor (özellikle Alperen'e)
4. Git documentation: https://git-scm.com/doc

**Acil Durum** (repository bozuldu):
```bash
# En son working state'e dön
git checkout main
git branch -D develop  # Dikkat: develop silinir!
git checkout -b develop origin/develop
```

---

**Başarılar! Conflict'ler kaçınılmazdır, önemli olan onları doğru çözmek 🚀**

