# Super Admin Şifre Sıfırlama

Super admin şifresini unuttuğunuzda, aşağıdaki yöntemlerden birini kullanarak şifrenizi sıfırlayabilirsiniz.

## Yöntem 1: Otomatik Script (Önerilen)

```bash
cd backend
python manage.py shell < reset_superadmin_password.py
```

veya

```bash
cd backend
python reset_superadmin_password.py
```

Bu script otomatik olarak:
- İlk super admin hesabını bulur
- Yeni bir güvenli şifre oluşturur
- Şifreyi sıfırlar
- Yeni şifreyi ekrana yazdırır

## Yöntem 2: Django Shell (Manuel)

```bash
cd backend
python manage.py shell
```

Sonra shell'de şu komutları çalıştırın:

```python
from api.models import User
import secrets

# Super admin bul
superadmin = User.objects.filter(is_superuser=True).first()

# Yeni şifre oluştur
new_password = secrets.token_urlsafe(16)

# Şifreyi değiştir
superadmin.set_password(new_password)
superadmin.save()

# Yeni şifreyi göster
print(f"Username: {superadmin.username}")
print(f"Email: {superadmin.email}")
print(f"Yeni Şifre: {new_password}")
```

## Yöntem 3: Belirli Bir Kullanıcı Adı İçin

```bash
cd backend
python manage.py shell
```

```python
from api.models import User
import secrets

# Belirli kullanıcı adı ile bul
superadmin = User.objects.get(username='superadmin', is_superuser=True)

# Kendi şifrenizi belirleyin
new_password = "YeniSifreniz123!"

# Şifreyi değiştir
superadmin.set_password(new_password)
superadmin.save()

print(f"Şifre başarıyla değiştirildi!")
print(f"Yeni şifre: {new_password}")
```

## Yöntem 4: Yeni Super Admin Oluşturma

Eğer hiç super admin yoksa, yeni bir tane oluşturabilirsiniz:

```bash
cd backend
python manage.py shell
```

```python
from api.models import User
import secrets

password = secrets.token_urlsafe(16)

new_admin = User.objects.create_user(
    username='superadmin',
    email='superadmin@acurate.com',
    password=password,
    is_superuser=True,
    is_staff=True,
    is_active=True,
    role=User.Role.INSTITUTION
)

print(f"Super Admin oluşturuldu!")
print(f"Username: {new_admin.username}")
print(f"Email: {new_admin.email}")
print(f"Password: {password}")
```

## Önemli Notlar

⚠️ **Güvenlik:**
- Yeni şifreyi mutlaka güvenli bir yerde saklayın
- Şifreyi kimseyle paylaşmayın
- İlk girişten sonra şifrenizi değiştirmeniz önerilir

🔐 **Giriş:**
- Super Admin Login: `http://localhost:3000/super-admin-x7k9m2p4q1w8r3n6`
- Normal Login: `http://localhost:3000/login` (super admin için kullanılamaz)

## Sorun Giderme

Eğer şifre sıfırlama işlemi başarısız olursa:

1. Backend'in çalıştığından emin olun
2. Veritabanı bağlantısını kontrol edin
3. Super admin hesabının `is_superuser=True` olduğunu kontrol edin:
   ```python
   from api.models import User
   User.objects.filter(is_superuser=True).values('username', 'email', 'is_superuser')
   ```


