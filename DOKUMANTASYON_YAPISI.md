# 📚 AcuRate Projesi - Dokümantasyon Yapısı

**Son Güncelleme:** Aralık 2024

---

## 📁 Dokümantasyon Organizasyonu

### 🏠 Root Seviyesi

#### Ana Dokümantasyon
- **README.md** - Ana proje dokümantasyonu (kurulum, özellikler, API endpoints)
- **PROJE_ANALIZ_RAPORU.md** - Kapsamlı proje analizi (eksiklikler, sorunlar, öncelikler)

---

### 📂 docs/ - Ana Dokümantasyon Klasörü

#### Geliştirme Rehberleri
- **QUICK_START.md** - Hızlı başlangıç rehberi
- **TEAM_QUICK_START.md** - Takım için hızlı başlangıç
- **API_INTEGRATION_GUIDE.md** - API entegrasyon kılavuzu
- **TROUBLESHOOTING.md** - Sorun giderme rehberi

#### Git ve Workflow
- **BRANCH_WORKFLOW.md** - Git branch workflow
- **MERGE_GUIDE.md** - Merge işlemleri kılavuzu

#### Teknik Dokümantasyon
- **AUTO_CALCULATION_IMPLEMENTATION.md** - Otomatik hesaplama implementasyonu
- **TEST_COVERAGE_SUMMARY.md** - Test coverage özeti
- **NEXT_STEPS.md** - Sonraki adımlar ve roadmap

#### Arşiv
- **archive/** - Eski, geçici ve test dokümantasyonları
  - Eski analiz raporları
  - Test sonuçları
  - Geçici dokümantasyonlar

---

### 🐍 DJANGO_MD/ - Django Backend Analizi

#### Detaylı Django Analizi
- **01_PROJE_YAPISI_ANALIZI.md** - Proje yapısı analizi
- **02_EKSIK_DOSYALAR_VE_GEREKSINIMLER.md** - Eksik dosyalar ve gereksinimler
- **03_DJANGO_BEST_PRACTICES.md** - Django best practices

---

### 🔧 backend/ - Backend Dokümantasyonu

#### Backend Rehberleri
- **README.md** - Backend genel dokümantasyonu
- **SETUP.md** - Backend kurulum rehberi
- **TESTING.md** - Test rehberi
- **PRODUCTION_CHECKLIST.md** - Production deployment checklist

---

## 🗂️ Dosya Kategorileri

### ✅ Aktif Dokümantasyon
Bu dosyalar aktif olarak kullanılmaktadır ve güncel tutulmalıdır:

1. **README.md** (root) - Ana proje dokümantasyonu
2. **PROJE_ANALIZ_RAPORU.md** - Proje analizi
3. **docs/QUICK_START.md** - Hızlı başlangıç
4. **docs/API_INTEGRATION_GUIDE.md** - API kılavuzu
5. **docs/TROUBLESHOOTING.md** - Sorun giderme
6. **DJANGO_MD/** - Django analiz dosyaları
7. **backend/README.md** - Backend dokümantasyonu
8. **backend/SETUP.md** - Backend kurulum

### 📦 Arşivlenmiş Dokümantasyon
Bu dosyalar `docs/archive/` klasöründe saklanmaktadır:
- Eski analiz raporları
- Test sonuçları
- Geçici dokümantasyonlar
- Kişisel görev listeleri

### ⚠️ Hassas Bilgiler İçeren Dosyalar (Git'te Olmamalı)
Aşağıdaki dosyalar hassas bilgiler içerir ve `.gitignore`'a eklenmiştir:
- `ACCOUNT_CREDENTIALS.md` - Hesap bilgileri (ÖNEMLİ - Git'te olmamalı)
- `ALL_ACCOUNTS.md` - Tüm hesaplar listesi (ÖNEMLİ - Git'te olmamalı)
- `ALL_ACCOUNTS_FULL.txt` - Detaylı hesap bilgileri (ÖNEMLİ - Git'te olmamalı)

**Not:** Bu dosyalar yerel olarak tutulmalı, asla git'e commit edilmemelidir.

### ❌ Silinen Dosyalar
Aşağıdaki dosyalar organizasyon nedeniyle silinmiştir:
- `TUANA_GOREVLER.md` - Kişisel görev listesi
- `PUSH_README.md` - Gereksiz dosya

---

## 📋 Dokümantasyon Kullanım Rehberi

### Yeni Başlayanlar İçin
1. **README.md** (root) - Projeyi tanıyın
2. **docs/QUICK_START.md** - Hızlı başlangıç
3. **backend/SETUP.md** - Backend kurulumu

### Geliştiriciler İçin
1. **docs/API_INTEGRATION_GUIDE.md** - API kullanımı
2. **docs/BRANCH_WORKFLOW.md** - Git workflow
3. **DJANGO_MD/** - Django iyileştirme önerileri

### Proje Yöneticileri İçin
1. **PROJE_ANALIZ_RAPORU.md** - Proje durumu ve eksiklikler
2. **docs/NEXT_STEPS.md** - Roadmap
3. **backend/PRODUCTION_CHECKLIST.md** - Production hazırlık

### Sorun Giderme
1. **docs/TROUBLESHOOTING.md** - Yaygın sorunlar
2. **docs/archive/** - Eski sorun çözümleri (referans)

---

## 🔄 Dokümantasyon Güncelleme Kuralları

### Yeni Dokümantasyon Ekleme
1. **Ana dokümantasyon** → `docs/` klasörüne
2. **Django analizi** → `DJANGO_MD/` klasörüne
3. **Backend spesifik** → `backend/` klasörüne
4. **Geçici/test** → `docs/archive/` klasörüne

### Dokümantasyon Silme
1. Hassas bilgiler içeren dosyalar → **SİL**
2. Eski/geçersiz dokümantasyon → **archive/** klasörüne taşı
3. Gereksiz/tekrar eden → **SİL** veya **archive/** klasörüne taşı

### Dokümantasyon Güncelleme
1. Ana README.md → Her önemli değişiklikte güncelle
2. API dokümantasyonu → API değişikliklerinde güncelle
3. Setup rehberleri → Kurulum değişikliklerinde güncelle

---

## 📊 Dokümantasyon İstatistikleri

### Aktif Dokümantasyon
- **Root seviyesi:** 2 dosya
- **docs/ klasörü:** 9 dosya
- **DJANGO_MD/ klasörü:** 3 dosya
- **backend/ klasörü:** 4 dosya
- **Toplam:** 18 aktif dosya

### Arşivlenmiş Dokümantasyon
- **docs/archive/:** ~15 dosya

---

## ✅ Temizlik Sonuçları

### Silinen Dosyalar
- ✅ ACCOUNT_CREDENTIALS.md (güvenlik)
- ✅ ALL_ACCOUNTS.md (güvenlik)
- ✅ TUANA_GOREVLER.md (kişisel)
- ✅ PUSH_README.md (gereksiz)

### Arşivlenen Dosyalar
- ✅ Test/verification raporları → `docs/archive/`
- ✅ Eski analiz raporları → `docs/archive/`
- ✅ Geçici dokümantasyonlar → `docs/archive/`

### Oluşturulan README Dosyaları
- ✅ `docs/README.md` - Ana dokümantasyon index
- ✅ `DJANGO_MD/README.md` - Django analiz index
- ✅ `docs/archive/README.md` - Arşiv açıklaması

---

**Son Güncelleme:** Aralık 2024

