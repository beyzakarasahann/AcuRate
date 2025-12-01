# 🔐 AcuRate - Demo Hesaplar ve Şifreler

**Tarih:** Aralık 2024  
**Login URL:** http://localhost:3000/login

---

## 👨‍🎓 ÖĞRENCİ HESAPLARI

### Ana Öğrenci Hesapları (Test Verileri Var)

| Username | Şifre | Email | Student ID | Not |
|----------|-------|-------|------------|-----|
| `beyza2` | `beyza123` | beyza2@student.acurate.edu | 2024001 | Kapsamlı test verileri var |
| `beyza.karasahan` | `beyza123` | beyza.karasahan@student.acurate.edu | 2024002 | Kapsamlı test verileri var |

### Diğer Öğrenci Hesapları

| Username | Şifre | Not |
|----------|-------|-----|
| `student3` | `student123` | Genel öğrenci şifresi |
| `student4` | `student123` | Genel öğrenci şifresi |
| `student5` | `student123` | Genel öğrenci şifresi |
| ... | `student123` | Tüm studentX hesapları için aynı şifre |

**Not:** `create_test_data.py` scripti çalıştırıldığında 50 öğrenci oluşturulur. İlk 2 öğrenci (`beyza2` ve `beyza.karasahan`) özel şifreye sahip, diğerleri `student123` kullanır.

---

## 👨‍🏫 ÖĞRETMEN HESAPLARI

| Username | Şifre | Email | Not |
|----------|-------|-------|-----|
| `ahmet.bulut` | `ahmet123` | ahmet.bulut@acurate.edu | Ana öğretmen hesabı (test verileri var) |

**Not:** Öğretmenler normalde kurum admini tarafından oluşturulur ve geçici şifre ile email'e gönderilir. Test için `ahmet.bulut` hesabı hazır.

---

## 🏛️ KURUM (INSTITUTION) HESAPLARI

| Username | Şifre | Email | Not |
|----------|-------|-------|-----|
| `institution` | `institution123` | institution@acurate.edu | Kurum admini hesabı |

**Not:** Kurum adminleri normalde super admin tarafından oluşturulur. Test için `institution` hesabı hazır.

---

## 👑 SUPER ADMIN HESAPLARI

| Username | Şifre | Email | Login URL |
|----------|-------|-------|-----------|
| `superadmin` | *Değişken* | superadmin@acurate.com | http://localhost:3000/super-admin-x7k9m2p4q1w8r3n6 |

**Not:** Super admin şifresi için `backend/reset_superadmin_password.py` scriptini kullan:
```bash
cd backend
python reset_superadmin_password.py
```

---

## 📋 HIZLI BAŞLANGIÇ

### 1. Öğrenci Olarak Giriş
```
URL: http://localhost:3000/login
Username: beyza2
Password: beyza123
```

### 2. Öğretmen Olarak Giriş
```
URL: http://localhost:3000/login
Username: ahmet.bulut
Password: ahmet123
```

### 3. Kurum Admini Olarak Giriş
```
URL: http://localhost:3000/login
Username: institution
Password: institution123
```

### 4. Super Admin Olarak Giriş
```
URL: http://localhost:3000/super-admin-x7k9m2p4q1w8r3n6
Username: superadmin
Password: (reset_superadmin_password.py ile oluştur)
```

---

## 🔄 TEST VERİLERİNİ YENİDEN OLUŞTURMA

Eğer test verileri yoksa veya yeniden oluşturmak istersen:

```bash
cd backend
python create_test_data.py
```

Bu script:
- 5 Program Outcome oluşturur
- 1 öğretmen oluşturur (`ahmet.bulut`)
- 1 kurum admini oluşturur (`institution`)
- 50 öğrenci oluşturur (2'si özel: `beyza2`, `beyza.karasahan`)
- Kurslar, enrollments, assessments, grades ve PO achievements oluşturur

---

## 📝 ŞİFRE ÖZETİ

| Rol | Username Örnekleri | Şifre |
|-----|-------------------|-------|
| **Öğrenci** | `beyza2`, `beyza.karasahan` | `beyza123` |
| **Öğrenci** | `student3`, `student4`, ... | `student123` |
| **Öğretmen** | `ahmet.bulut` | `ahmet123` |
| **Kurum** | `institution` | `institution123` |
| **Super Admin** | `superadmin` | Script ile oluştur |

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Test Ortamı:** Bu şifreler sadece development/test ortamı içindir.
2. **Production:** Production'da mutlaka güçlü şifreler kullanılmalıdır.
3. **Şifre Değiştirme:** Kullanıcılar ilk girişte şifrelerini değiştirebilir (geçici şifre durumunda zorunlu).
4. **Email:** Test hesapları için email gönderimi çalışmaz (SendGrid sandbox mode).

---

**Son Güncelleme:** Aralık 2024

