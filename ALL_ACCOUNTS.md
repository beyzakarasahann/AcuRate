# TÜM HESAPLAR - GİRİŞ BİLGİLERİ

Bu dosya tüm sistem hesaplarının giriş bilgilerini içerir.

## 🔴 SUPER ADMIN

### Super Admin
- **Username:** `superadmin`
- **Email:** `superadmin@acurate.com`
- **Password:** `superadmin123`
- **Login URL:** `http://localhost:3000/super-admin-x7k9m2p4q1w8r3n6`

**Şifre sıfırlama için:**
```bash
cd backend
python reset_superadmin_password.py
```

---

## 🟠 INSTITUTION ADMIN

### 1. Institution Admin
- **Username:** `institution`
- **Email:** `institution@acurate.edu`
- **Password:** `institution123`
- **Login URL:** `http://localhost:3000/login`

---

## 🟡 TEACHER (ÖĞRETMEN)

### 1. Ahmet Bulut
- **Username:** `ahmet.bulut`
- **Email:** `ahmet.bulut@acurate.edu`
- **Password:** `ahmet123`
- **Login URL:** `http://localhost:3000/login`
- **Department:** Computer Science

---

## 🟢 STUDENT (ÖĞRENCİ)

### Demo Öğrenciler:

#### 1. Beyza Test
- **Username:** `beyza2`
- **Email:** `beyza2@student.acurate.edu`
- **Password:** `beyza123`
- **Student ID:** `2024001`
- **Department:** Computer Science
- **Login URL:** `http://localhost:3000/login`

#### 2. Beyza Karasahan
- **Username:** `beyza.karasahan`
- **Email:** `beyza.karasahan@student.acurate.edu`
- **Password:** `beyza123`
- **Student ID:** `2024002`
- **Department:** Computer Science
- **Login URL:** `http://localhost:3000/login`

### Diğer Öğrenciler

Tüm öğrenciler için varsayılan şifre: `student123`

**Toplam:** 50 öğrenci

**Tüm öğrencileri listelemek için:**
```bash
cd backend
python reset_student_password.py list
```

---

## 📊 ÖZET İSTATİSTİKLER

- **Super Admin:** 1
- **Institution Admin:** 1
- **Teacher:** 1
- **Student:** 50
- **Toplam Aktif Kullanıcı:** 52

---

## 🔧 ŞİFRE SIFIRLAMA

### Super Admin Şifresi Sıfırlama:
```bash
cd backend
python reset_superadmin_password.py
```

### Student Şifresi Sıfırlama:
```bash
cd backend
python reset_student_password.py reset <username> [yeni_sifre]
```

### Admin/Institution Şifresi Sıfırlama:
```bash
cd backend
python reset_admin_password.py reset <email_veya_username> [yeni_sifre]
```

### Tüm Hesapları Listeleme:
```bash
cd backend
python list_all_accounts.py
```

---

## 💡 NOTLAR

- Varsayılan şifreler değiştirilmiş olabilir
- Geçici şifreler email ile gönderilir
- Öğretmen ve öğrenciler için geçici şifreler sistem tarafından oluşturulur

