# Kalan Modülerleştirme İşleri

## ✅ Tamamlananlar

1. ✅ **views.py** → `views/` klasörüne modülerleştirildi
2. ✅ **models.py** → `models/` klasörüne modülerleştirildi
3. ✅ **views_bulk_operations.py** → `views/bulk_operations.py`
4. ✅ **views_file_upload.py** → `views/file_upload.py`

## ⚠️ Kalan Modülerleştirme İşleri

### 1. 🔴 **serializers.py** (860 satır, 28 serializer) - YÜKSEK ÖNCELİK

**Durum**: Tek dosyada tüm serializer'lar  
**Sorun**: Bakımı zor, import'lar karmaşık

**Önerilen Yapı**:
```
api/serializers/
├── __init__.py
├── user.py          # User, Login, TeacherCreate, InstitutionCreate
├── department.py    # Department
├── course.py        # Course, CoursePO, Enrollment
├── outcome.py       # ProgramOutcome, LearningOutcome, LOPO
├── assessment.py    # Assessment, AssessmentLO, StudentGrade
├── achievement.py   # StudentPOAchievement, StudentLOAchievement
├── dashboard.py     # Dashboard serializers
└── contact.py       # ContactRequest
```

### 2. 🔴 **admin.py** (893 satır, 30 admin class) - YÜKSEK ÖNCELİK

**Durum**: Tek dosyada tüm admin sınıfları  
**Sorun**: Bakımı zor, okunabilirlik düşük

**Önerilen Yapı**:
```
api/admin/
├── __init__.py
├── user.py          # UserAdmin
├── department.py    # DepartmentAdmin
├── course.py        # CourseAdmin, CoursePOAdmin, EnrollmentAdmin
├── outcome.py       # ProgramOutcomeAdmin, LearningOutcomeAdmin, LOPOAdmin
├── assessment.py    # AssessmentAdmin, AssessmentLOAdmin, StudentGradeAdmin
├── achievement.py   # StudentPOAchievementAdmin, StudentLOAchievementAdmin
└── misc.py          # ContactRequestAdmin, ActivityLogAdmin
```

### 3. 🟡 **tests.py** (901 satır) - ORTA ÖNCELİK

**Durum**: Tek dosyada tüm testler  
**Sorun**: Test organizasyonu zor

**Önerilen Yapı**:
```
api/tests/
├── __init__.py
├── test_models.py
├── test_views.py
├── test_serializers.py
├── test_signals.py
└── test_utils.py
```

### 4. 🟡 **Root'ta Script Dosyaları** - ORTA ÖNCELİK

**Durum**: Backend root'unda 10+ script dosyası  
**Sorun**: Organizasyon eksik, karışıklık

**Önerilen Yapı**:
```
backend/scripts/
├── README.md
├── data/
│   ├── create_beyza2_mappings.py
│   ├── create_student.py
│   ├── create_test_data.py
│   ├── fix_beyza2_mappings.py
│   ├── populate_all_data.py
│   └── setup_beyza2_scores_data.py
└── admin/
    ├── list_all_accounts.py
    ├── reset_admin_password.py
    ├── reset_student_password.py
    └── reset_superadmin_password.py
```

## 📊 Öncelik Sırası

1. 🔴 **serializers.py** - En çok kullanılan, yüksek öncelik
2. 🔴 **admin.py** - Bakımı zor, yüksek öncelik
3. 🟡 **tests.py** - Orta öncelik
4. 🟡 **Script dosyaları** - Organizasyon, orta öncelik

## 💡 Öneri

Önce **serializers.py** modülerleştirmesini yapalım çünkü:
- En çok kullanılan dosya
- Import'ları daha karmaşık
- Diğer dosyalara bağımlılığı yüksek
