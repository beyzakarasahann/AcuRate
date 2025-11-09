# 🔧 Failed to Fetch Hatası Çözümü

## Hata: "Failed to fetch" - Tüm Rollerde (Student, Teacher, Institution)

### ✅ Yapılması Gerekenler:

#### 1. Browser Console'u Aç ve Hata Detayını Bak

**Chrome/Edge:**
- `Cmd + Option + J` (Mac) veya `F12` (Windows)
- "Console" tab'ına bak

**Safari:**
- `Cmd + Option + C` (Mac)

**Bakılacak Hatalar:**
- ❌ `CORS policy` hatası mı?
- ❌ `net::ERR_CONNECTION_REFUSED` hatası mı?
- ❌ `404 Not Found` hatası mı?
- ❌ Başka bir network error?

---

#### 2. Backend Sunucusunun Çalışıp Çalışmadığını Kontrol Et

**Terminal'de:**
```bash
curl http://localhost:8000/api/auth/login/
```

**Beklenen Sonuç:**
```json
{"detail":"Method \"GET\" not allowed."}
```

✅ Bu mesaj geliyorsa backend çalışıyor demektir.

❌ "Connection refused" geliyorsa backend çalışmıyor:
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

---

#### 3. Frontend URL'lerini Kontrol Et

**Browser'da Developer Tools açıkken:**
1. "Network" tab'ına git
2. Login yapmayı dene
3. Hangi URL'ye istek gönderiliyor bak

**Beklenen URL:**
```
http://localhost:8000/api/auth/login/
```

**Yanlış URL örnekleri:**
```
http://localhost:3000/api/auth/login/  ❌ (Frontend port'una gidiyor)
http://localhost:8001/api/auth/login/  ❌ (Yanlış port)
undefined/api/auth/login/              ❌ (Environment variable yok)
```

---

#### 4. Environment Variable Kontrolü

**`.env.local` dosyasını kontrol et:**
```bash
cat frontend/.env.local
```

**İçeriği şöyle olmalı:**
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

❌ Eğer dosya yoksa:
```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
```

**Sonra frontend'i yeniden başlat:**
```bash
# Eski process'i durdur (Ctrl+C ile)
# Sonra tekrar başlat:
npm run dev
```

---

#### 5. CORS Hatası İse

**Backend settings.py'da kontrol et:**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

Bu ayar zaten yapılmış olmalı.

---

#### 6. Browser Console'da Tam Hata Mesajı

**Console'da şunu çalıştır:**
```javascript
fetch('http://localhost:8000/api/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({username: 'student1', password: 'student123'})
})
.then(r => r.json())
.then(d => console.log('✅ SUCCESS:', d))
.catch(e => console.error('❌ ERROR:', e))
```

Bu komutu çalıştır ve sonucu paylaş!

---

## 📊 Durum Özeti

✅ Backend API çalışıyor (curl ile test edildi)
✅ Serializer düzeltildi (`phone_number` → `phone`)
✅ JWT tokens başarıyla üretiliyor
✅ Environment variable var (`.env.local`)
🔄 Frontend yeniden başlatıldı

## 🎯 Sonraki Adım

**Lütfen şunu yap:**
1. Browser'ı tamamen kapat ve tekrar aç
2. http://localhost:3000/login sayfasına git
3. `Cmd + Option + J` ile Console'u aç
4. Student1 / student123 ile login dene
5. Console'da görünen HATAYI EKRAN GÖRÜNTÜSÜ veya KOPYALA-YAPIŞTIR ile paylaş

**Örnek hatalar:**

```
❌ Failed to fetch
❌ CORS policy: No 'Access-Control-Allow-Origin' header
❌ net::ERR_CONNECTION_REFUSED
❌ 404 Not Found
```

Bu bilgi olmadan tam olarak sorunu çözemem!

