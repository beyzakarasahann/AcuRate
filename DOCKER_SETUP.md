# 🐳 Docker Setup Guide

Bu proje PostgreSQL veritabanı için Docker Compose kullanır.

## Hızlı Başlangıç

### 1. PostgreSQL'i Başlat

```bash
# Proje root dizininden
docker-compose up -d postgres
```

### 2. PostgreSQL Durumunu Kontrol Et

```bash
docker-compose ps
```

Çıktı şöyle olmalı:
```
NAME                COMMAND                  SERVICE   STATUS         PORTS
acurate_postgres    "docker-entrypoint.s…"   postgres  Up 2 minutes   0.0.0.0:5432->5432/tcp
```

### 3. Logları Görüntüle

```bash
docker-compose logs postgres
```

### 4. PostgreSQL'i Durdur

```bash
docker-compose down
```

### 5. Veritabanını Sıfırla (Tüm verileri siler)

```bash
docker-compose down -v
docker-compose up -d postgres
```

## Environment Variables

⚠️ **ÖNEMLİ:** Bu proje Docker PostgreSQL kullanır. Yerel PostgreSQL kurulumu gerekmez.

`backend/.env` dosyasında şu değerleri kullanın:

```env
POSTGRES_DB=acurate_db
POSTGRES_USER=acurate_user
POSTGRES_PASSWORD=acurate_pass_2024
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

**Not**: 
- Django **host makinede** çalışıyorsa: `POSTGRES_HOST=localhost` kullanın (Docker Compose PostgreSQL'i localhost:5432'ye expose eder)
- Django **Docker container içinde** çalışıyorsa: `POSTGRES_HOST=postgres` kullanın (Docker network içinden erişim)

## Production için

Production ortamında:
1. `docker-compose.yml` dosyasındaki şifreleri değiştirin
2. `.env` dosyasındaki şifreleri güçlü değerlerle güncelleyin
3. `DJANGO_SECRET_KEY` değerini güvenli bir değerle değiştirin
4. `DJANGO_DEBUG=False` yapın

## Troubleshooting

### Port 5432 zaten kullanılıyor

Eğer localhost'ta zaten PostgreSQL çalışıyorsa, `docker-compose.yml` dosyasında portu değiştirin:

```yaml
ports:
  - "5433:5432"  # 5433 portunu kullan
```

Ve `.env` dosyasında:
```env
POSTGRES_PORT=5433
```

### Veritabanı bağlantı hatası

1. PostgreSQL container'ının çalıştığını kontrol edin: `docker-compose ps`
2. Logları kontrol edin: `docker-compose logs postgres`
3. `.env` dosyasındaki değerlerin `docker-compose.yml` ile eşleştiğini kontrol edin

## Veri Kalıcılığı

PostgreSQL verileri Docker volume'unda saklanır (`postgres_data`). Container'ı durdursanız bile veriler korunur.

Verileri tamamen silmek için:
```bash
docker-compose down -v
```

