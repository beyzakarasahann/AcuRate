# 📋 TÜM HESAP GİRİŞ BİLGİLERİ

## ⚠️ ÖNEMLİ UYARI

**Bu dosya hassas bilgiler içerir!**
- ❌ Asla git'e commit edilmemelidir
- ✅ `.gitignore`'a eklenmiştir
- ✅ Sadece yerel olarak tutulmalıdır
- ✅ Production'da kullanılmamalıdır

---

## 🔴 1. SUPER ADMIN

**Login URL:** `http://localhost:3000/super-admin-x7k9m2p4q1w8r3n6`

**Şu anda Super Admin hesabı yok.** Oluşturmak veya şifre sıfırlamak için:
```bash
cd backend
python reset_superadmin_password.py
```

---

## 🏛️ 2. INSTITUTION (Kurum Admini)

**Login URL:** `http://localhost:3000/login`

### Kurum Admini
- **Username:** `institution1`
- **Email:** `institution1@acurate.com`
- **Password:** `institution123`
- **Role:** INSTITUTION

**Not:** Kurum adminleri super admin tarafından oluşturulur ve geçici şifre ile email'e gönderilir.

---

## 👨‍🏫 3. TEACHER (Öğretmen)

**Login URL:** `http://localhost:3000/login`

### Teacher 1
- **Username:** `teacher1`
- **Email:** `teacher1@acurate.com`
- **Password:** `teacher123`
- **Role:** TEACHER
- **Department:** Computer Science

### Teacher 2
- **Username:** `teacher2`
- **Email:** `teacher2@acurate.com`
- **Password:** `teacher123`
- **Role:** TEACHER
- **Department:** Mathematics

**Not:** Öğretmenler kurum admini tarafından oluşturulur ve geçici şifre ile email'e gönderilir.

---

## 👨‍🎓 4. STUDENT (Öğrenci)

**Login URL:** `http://localhost:3000/login`

### Öğrenci 1
- **Username:** `student1`
- **Email:** `student1@acurate.com`
- **Password:** `student123`
- **Role:** STUDENT
- **Student ID:** `2024001`
- **Department:** Computer Science

### Öğrenci 2
- **Username:** `student2`
- **Email:** `student2@acurate.com`
- **Password:** `student123`
- **Role:** STUDENT
- **Student ID:** `2024002`
- **Department:** Mathematics

### Beyza2 (Test Öğrencisi)
- **Username:** `beyza2`
- **Email:** `beyza2@acurate.com`
- **Password:** `beyza123`
- **Role:** STUDENT
- **Student ID:** `2024BEYZA2`
- **Department:** Computer Science
- **Not:** Kapsamlı test verileri mevcut

---

## 🔐 Şifre Sıfırlama

### Super Admin Şifresi
```bash
cd backend
python reset_superadmin_password.py
```

### Öğrenci Şifresi
```bash
cd backend
python reset_student_password.py reset <username>
```

### Admin/Institution Şifresi
```bash
cd backend
python reset_admin_password.py reset <username>
```

---

## 📝 Notlar

- Tüm şifreler development ortamı içindir
- Production'da mutlaka güçlü şifreler kullanılmalıdır
- Bu dosya asla git'e commit edilmemelidir
- Hassas bilgiler içerdiği için paylaşılmamalıdır

---

**Son Güncelleme:** Aralık 2024
