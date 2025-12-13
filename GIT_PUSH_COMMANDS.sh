#!/bin/bash
# Git Push to Main - Production Ready Changes

echo "🚀 Main branch'e push işlemi başlatılıyor..."

# 1. Tüm değişiklikleri kontrol et
echo "📋 Git durumu kontrol ediliyor..."
git status

# 2. Tüm değişiklikleri stage'e ekle
echo "📦 Değişiklikler stage'e ekleniyor..."
git add .

# 3. Commit mesajı
COMMIT_MSG="feat: Production hazırlığı ve güvenlik iyileştirmeleri

✨ Production Dosyaları:
- Backend ve Frontend Dockerfile'ları eklendi
- Production docker-compose.yml oluşturuldu
- .dockerignore dosyaları eklendi

🔒 Güvenlik İyileştirmeleri:
- Argon2 password hashing eklendi
- Content Security Policy (CSP) header eklendi
- Permissions-Policy header eklendi
- API throttling (DRF) yapılandırıldı
- Database SSL encryption eklendi
- SecurityHeadersMiddleware oluşturuldu

📦 Dependencies:
- Gunicorn ve WhiteNoise eklendi (requirements.txt)
- argon2-cffi eklendi

🧹 Temizlik:
- 15+ gereksiz dosya silindi (test scripts, duplicate files, sensitive data)

📚 Dokümantasyon:
- Production analiz raporları eklendi
- Güvenlik analiz raporu güncellendi"

# 4. Commit yap
echo "💾 Commit yapılıyor..."
git commit -m "$COMMIT_MSG"

# 5. Main branch kontrolü
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Mevcut branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "🔄 Main branch'e geçiliyor..."
    git checkout main 2>/dev/null || git checkout -b main
fi

# 6. Push yap
echo "⬆️  Main branch'e push yapılıyor..."
git push origin main

echo "✅ Push işlemi tamamlandı!"
