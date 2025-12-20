# Test Scripts

Bu klasör, test çalıştırma ve doğrulama scriptlerini içerir.

## 🧪 test_before_push.sh / test_before_push.py

GitHub'a push etmeden önce testlerin geçip geçmediğini kontrol eder.

### Kullanım

**Bash script:**
```bash
cd backend
./scripts/test_before_push.sh
```

**Python script:**
```bash
cd backend
python scripts/test_before_push.py
```

### Özellikler

- ✅ Docker'ın çalışıp çalışmadığını kontrol eder
- ✅ Docker PostgreSQL bağlantısını otomatik kontrol eder
- ✅ PostgreSQL yoksa hata verir ve Docker'ı başlatmayı önerir
- ✅ Deprecated test dosyalarını otomatik hariç tutar
- ✅ Slow testleri hariç tutar (hızlı test)
- ✅ Coverage raporu oluşturur
- ✅ Renkli çıktı (başarı/hata durumları)

### Çıktı

- ✅ **Başarılı:** Tüm testler geçti, push edebilirsiniz
- ❌ **Başarısız:** Testler başarısız, push etmeden önce düzeltin

### Notlar

- Script, deprecated Django TestCase dosyalarını otomatik olarak hariç tutar
- Sadece pytest testleri çalıştırılır
- Slow testler hariç tutulur (hızlı feedback için)
- Coverage raporu `htmlcov/index.html` dosyasında oluşturulur

## 🔄 Pre-commit Hook (Opsiyonel)

Git commit öncesi otomatik test çalıştırmak için:

```bash
# .git/hooks/pre-commit dosyası oluştur
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
cd backend
python scripts/test_before_push.py
EOF

chmod +x .git/hooks/pre-commit
```

**Not:** Pre-commit hook, her commit'te testleri çalıştırır. Bu biraz yavaş olabilir. Alternatif olarak sadece push öncesi manuel çalıştırabilirsiniz.
