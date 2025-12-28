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

## 🟡 TEACHER

### 1. Teacher 1 (Ahmet Bulut)
- **Username:** `ahmet.bulut`
- **Email:** `ahmet.bulut@acurate.edu`
- **Password:** `ahmet123`
- **Login URL:** `http://localhost:3000/login`

### 2. Teacher 2
- **Username:** `teacher2`
- **Email:** `teacher2@acurate.edu`
- **Password:** `teacher123`
- **Login URL:** `http://localhost:3000/login`

---

## 🟢 STUDENT

### 1. Student 1 (Beyza)
- **Username:** `beyza2`
- **Email:** `beyza2@student.acurate.edu`
- **Password:** `beyza123`
- **Student ID:** `2021001`
- **Login URL:** `http://localhost:3000/login`

### 2. Student 2
- **Username:** `student2`
- **Email:** `student2@student.acurate.edu`
- **Password:** `student123`
- **Student ID:** `2021002`
- **Login URL:** `http://localhost:3000/login`

### 3. Student 3
- **Username:** `student3`
- **Email:** `student3@student.acurate.edu`
- **Password:** `student123`
- **Student ID:** `2021003`
- **Login URL:** `http://localhost:3000/login`

---

## 📝 Notlar

- Tüm şifreler test ortamı içindir
- Production'da mutlaka güçlü şifreler kullanılmalıdır
- Şifreler migration'lar ile otomatik oluşturulur
- İlk girişte bazı kullanıcılar şifre değiştirmeye zorlanabilir (geçici şifre durumu)

---

## 🔄 Yeni Hesap Oluşturma

### Super Admin ile Kurum Oluşturma
1. Super Admin paneline giriş yapın
2. Institutions sayfasına gidin
3. "Create Institution" butonuna tıklayın
4. Kurum bilgilerini girin
5. Kurum admin hesabı otomatik oluşturulur ve email gönderilir

### Institution Admin ile Öğretmen Oluşturma
1. Institution Admin paneline giriş yapın
2. Teachers sayfasına gidin
3. "Create Teacher" butonuna tıklayın
4. Öğretmen bilgilerini girin
5. Öğretmen hesabı otomatik oluşturulur ve email gönderilir

### Institution Admin ile Öğrenci Oluşturma
1. Institution Admin paneline giriş yapın
2. Students sayfasına gidin
3. "Create Student" butonuna tıklayın
4. Öğrenci bilgilerini girin
5. Öğrenci hesabı otomatik oluşturulur

---

## 🛠️ Script ile Demo Hesaplar Oluşturma

```bash
cd backend
python scripts/create_demo_accounts.py
```

Bu script demo hesapları otomatik olarak oluşturur.

