# 📋 TÜM HESAP GİRİŞ BİLGİLERİ

## 🔴 1. SUPER ADMIN

**Login URL:** `http://localhost:3000/super-admin-x7k9m2p4q1w8r3n6`

**Şu anda Super Admin hesabı yok.** Oluşturmak veya şifre sıfırlamak için:
```bash
cd backend
python reset_superadmin_password.py
```

---

## 🟠 2. INSTITUTION ADMIN

### Institution Admin
- **Username:** `institution`
- **Email:** `institution@acurate.edu`
- **Password:** `institution123`
- **Login URL:** `http://localhost:3000/login`
- **Role:** INSTITUTION

**Şifre sıfırlama:**
```bash
cd backend
python reset_admin_password.py reset institution yeni_sifre
```

---

## 🟡 3. TEACHER (ÖĞRETMEN)

### Ahmet Bulut
- **Username:** `ahmet.bulut`
- **Email:** `ahmet.bulut@acurate.edu`
- **Password:** `ahmet123`
- **Login URL:** `http://localhost:3000/login`
- **Department:** Computer Science
- **Role:** TEACHER

**Şifre sıfırlama:**
```bash
cd backend
python reset_admin_password.py reset ahmet.bulut yeni_sifre
```

---

## 🟢 4. STUDENT (ÖĞRENCİ)

### Demo Öğrenciler (Önemli):

#### Beyza Test
- **Username:** `beyza2`
- **Email:** `beyza2@student.acurate.edu`
- **Password:** `beyza123`
- **Student ID:** `2024001`
- **Login URL:** `http://localhost:3000/login`

#### Beyza Karasahan
- **Username:** `beyza.karasahan`
- **Email:** `beyza.karasahan@student.acurate.edu`
- **Password:** `beyza123`
- **Student ID:** `2024002`
- **Login URL:** `http://localhost:3000/login`

### Diğer Öğrenciler

**Varsayılan şifre:** `student123`

**Toplam:** 50 öğrenci

**Tüm öğrencileri görmek için:**
```bash
cd backend
python reset_student_password.py list
```

**Öğrenci şifresi sıfırlama:**
```bash
cd backend
python reset_student_password.py reset <username> [yeni_sifre]
```

---

## 📊 ÖZET

| Rol | Sayı | Varsayılan Şifre |
|-----|------|------------------|
| Super Admin | 0 | Oluşturulmalı |
| Institution Admin | 1 | `institution123` |
| Teacher | 1 | `ahmet123` |
| Student | 50 | `student123` veya `beyza123` |

---

## 🔍 EMAIL ARAMA

**beyza590beyza@gmail.com** email'i sistemde bulunamadı.

Bu email ile kullanıcı aramak için:
```bash
cd backend
python reset_admin_password.py search beyza590beyza@gmail.com
```

Eğer bu email ile bir kullanıcı yoksa, yeni bir kullanıcı oluşturmanız gerekebilir.

---

## 🛠️ YARDIMCI SCRİPTLER

1. **Tüm hesapları listele:**
   ```bash
   cd backend
   python list_all_accounts.py
   ```

2. **Admin/Institution şifresi sıfırla:**
   ```bash
   cd backend
   python reset_admin_password.py reset <email_veya_username> [yeni_sifre]
   ```

3. **Öğrenci şifresi sıfırla:**
   ```bash
   cd backend
   python reset_student_password.py reset <username> [yeni_sifre]
   ```

4. **Super Admin şifresi sıfırla:**
   ```bash
   cd backend
   python reset_superadmin_password.py
   ```

---

## 💡 NOTLAR

- Şifreler varsayılan değerlerdir, değiştirilmiş olabilir
- Geçici şifreler email ile gönderilir
- Email ile arama yaparken kısmi eşleşme yapılır

