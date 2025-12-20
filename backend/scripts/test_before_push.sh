#!/bin/bash

# Test Before Push Script
# Bu script, GitHub'a push etmeden önce testlerin geçip geçmediğini kontrol eder
# Kullanım: ./scripts/test_before_push.sh

set -e  # Hata durumunda dur

echo "🧪 Test Before Push - AcuRate Backend"
echo "======================================"
echo ""

# Backend dizinine geç
cd "$(dirname "$0")/.." || exit 1

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Docker kontrolü
echo "🐳 Docker kontrol ediliyor..."
if ! docker ps >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker çalışmıyor!${NC}"
    echo ""
    echo "Docker'ı başlatmak için:"
    echo "  docker-compose up -d"
    echo ""
    exit 1
fi

# PostgreSQL container kontrolü
echo "📦 PostgreSQL container kontrol ediliyor..."
if ! docker ps --filter name=acurate_postgres --format '{{.Names}}' | grep -q acurate_postgres; then
    echo -e "${YELLOW}⚠️  PostgreSQL container (acurate_postgres) çalışmıyor!${NC}"
    echo ""
    echo "PostgreSQL container'ını başlatmak için:"
    echo "  cd ..  # Proje root dizinine"
    echo "  docker-compose up -d postgres"
    echo ""
    echo "veya tüm servisleri başlatmak için:"
    echo "  docker-compose up -d"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL container çalışıyor${NC}"

# PostgreSQL bağlantısını kontrol et
echo "📊 Docker PostgreSQL bağlantısı kontrol ediliyor..."
if python -c "import psycopg2; psycopg2.connect(dbname='acurate_db', user='acurate_user', password='acurate_pass_2024', host='localhost', port='5432', connect_timeout=5)" 2>/dev/null; then
    echo -e "${GREEN}✅ Docker PostgreSQL bağlantısı başarılı${NC}"
else
    echo -e "${RED}❌ PostgreSQL bağlantısı başarısız!${NC}"
    echo ""
    echo "PostgreSQL container'ının hazır olmasını bekleyin:"
    echo "  docker logs acurate_postgres"
    echo ""
    echo "Container'ı yeniden başlatmak için:"
    echo "  docker-compose restart postgres"
    echo ""
    exit 1
fi

# Environment variables
export DJANGO_SECRET_KEY="${DJANGO_SECRET_KEY:-test-secret-key-for-local-testing}"
export DJANGO_DEBUG="False"
export DJANGO_SETTINGS_MODULE="backend.test_settings"

# Deprecated test dosyalarını hariç tut
EXCLUDE_PATTERNS="--ignore=api/tests/test_models.py \
                  --ignore=api/tests/test_api.py \
                  --ignore=api/tests/test_serializers.py \
                  --ignore=api/tests/test_permissions.py \
                  --ignore=api/tests/test_integration.py"

# Test veritabanını önceden oluştur (izin sorunlarını önlemek için)
echo ""
echo "🗄️  Test veritabanı kontrol ediliyor..."
python -c "
import psycopg2
try:
    conn = psycopg2.connect(dbname='postgres', user='acurate_user', password='acurate_pass_2024', host='localhost', port='5432')
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute(\"SELECT 1 FROM pg_database WHERE datname = 'test_acurate_db'\")
    if not cursor.fetchone():
        echo -e \"${YELLOW}📦 Test veritabanı oluşturuluyor...${NC}\"
        cursor.execute(\"CREATE DATABASE test_acurate_db OWNER acurate_user;\")
        echo -e \"${GREEN}✅ Test veritabanı oluşturuldu${NC}\"
    else:
        echo -e \"${GREEN}✅ Test veritabanı mevcut${NC}\"
    cursor.close()
    conn.close()
except Exception as e:
    echo -e \"${YELLOW}⚠️  Test veritabanı kontrolü başarısız: ${e}${NC}\"
" 2>/dev/null || echo -e "${YELLOW}⚠️  Test veritabanı kontrolü atlandı${NC}"

# Testleri çalıştır (slow testleri hariç)
echo ""
echo "🚀 Testler çalıştırılıyor..."
echo ""

if python -m pytest api/tests/ \
    $EXCLUDE_PATTERNS \
    -v \
    --tb=short \
    --strict-markers \
    -m "not slow" \
    --cov=api \
    --cov-report=term-missing \
    --cov-report=html \
    --reuse-db \
    --nomigrations; then
    echo ""
    echo -e "${GREEN}✅ Tüm testler başarıyla geçti!${NC}"
    echo ""
    echo "📊 Coverage raporu: htmlcov/index.html"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ Testler başarısız oldu!${NC}"
    echo -e "${RED}⚠️  GitHub'a push etmeden önce testleri düzeltin.${NC}"
    echo ""
    exit 1
fi

