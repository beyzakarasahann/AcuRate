# 🛠️ AcuRate Backend - Setup Guide

**Complete step-by-step installation and configuration guide**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Configuration](#configuration)
5. [Running the Server](#running-the-server)
6. [Troubleshooting](#troubleshooting)
7. [Production Setup](#production-setup)

---

## ✅ Prerequisites

### Required Software

1. **Python 3.12+**
   ```bash
   # Check Python version
   python --version
   # or
   python3 --version
   ```

2. **pip** (Python package manager)
   ```bash
   # Check pip version
   pip --version
   ```

3. **Git** (for version control)
   ```bash
   # Check Git version
   git --version
   ```

### Optional (for Production)

4. **PostgreSQL 14+**
   - Mac: `brew install postgresql@14`
   - Ubuntu: `sudo apt install postgresql postgresql-contrib`
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/)

---

## 📦 Installation

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/AcuRate.git
cd AcuRate/backend
```

### Step 2: Create Virtual Environment

**Mac/Linux**:
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Verify activation (should show venv path)
which python
```

**Windows**:
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Verify activation
where python
```

**Note**: You should see `(venv)` in your terminal prompt when activated.

### Step 3: Install Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install all requirements
pip install -r requirements.txt
```

**Expected Output**:
```
Successfully installed Django-5.2.1 djangorestframework-3.15.2 ...
```

### Step 4: Verify Installation

```bash
# Check installed packages
pip list

# Should see:
# Django                    5.2.1
# djangorestframework       3.15.2
# psycopg2-binary          2.9.10
# djangorestframework-simplejwt  5.3.1
# django-cors-headers      4.6.0
# python-decouple          3.8
# Pillow                   11.0.0
# python-dateutil          2.9.0
```

---

## 🗄️ Database Setup

### Option A: SQLite (Development - Default)

SQLite is already configured and requires no additional setup!

**Location**: `backend/db.sqlite3` (will be created automatically)

**Pros**:
- ✅ No installation required
- ✅ Zero configuration
- ✅ Perfect for development

**Cons**:
- ❌ Not suitable for production
- ❌ Limited concurrent access

### Option B: PostgreSQL (Production - Recommended)

#### Install PostgreSQL

**Mac (Homebrew)**:
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows**:
- Download installer from [postgresql.org](https://www.postgresql.org/download/)
- Run installer (default settings are fine)
- Remember the password you set for `postgres` user

#### Create Database

```bash
# Access PostgreSQL (Mac/Linux)
psql postgres

# Or (Ubuntu)
sudo -u postgres psql

# Or (Windows - use pgAdmin or SQL Shell)
```

**In PostgreSQL shell**:
```sql
-- Create database
CREATE DATABASE acurate_db;

-- Create user
CREATE USER acurate_user WITH PASSWORD 'your_strong_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE acurate_db TO acurate_user;

-- Exit
\q
```

#### Update settings.py

Open `backend/settings.py` and update the `DATABASES` section:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'acurate_db',
        'USER': 'acurate_user',
        'PASSWORD': 'your_strong_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

**Or use environment variables** (recommended):

1. Create `.env` file in `backend/` directory:
   ```env
   DATABASE_ENGINE=django.db.backends.postgresql
   DATABASE_NAME=acurate_db
   DATABASE_USER=acurate_user
   DATABASE_PASSWORD=your_strong_password
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   ```

2. Update `settings.py`:
   ```python
   from decouple import config
   
   DATABASES = {
       'default': {
           'ENGINE': config('DATABASE_ENGINE', default='django.db.backends.sqlite3'),
           'NAME': config('DATABASE_NAME', default=BASE_DIR / 'db.sqlite3'),
           'USER': config('DATABASE_USER', default=''),
           'PASSWORD': config('DATABASE_PASSWORD', default=''),
           'HOST': config('DATABASE_HOST', default=''),
           'PORT': config('DATABASE_PORT', default=''),
       }
   }
   ```

---

## ⚙️ Configuration

### Step 1: Environment Variables (Optional but Recommended)

Create `.env` file in `backend/` directory:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (if using PostgreSQL)
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=acurate_db
DATABASE_USER=acurate_user
DATABASE_PASSWORD=your_strong_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Note**: Add `.env` to `.gitignore` to keep secrets safe!

### Step 2: Run Migrations

```bash
# Check for migration issues
python manage.py check

# Create migrations for api app
python manage.py makemigrations api

# Expected output:
# Migrations for 'api':
#   api/migrations/0001_initial.py
#     - Create model User
#     - Create model ProgramOutcome
#     - Create model Course
#     - ...

# Apply all migrations
python manage.py migrate

# Expected output:
# Running migrations:
#   Applying contenttypes.0001_initial... OK
#   Applying auth.0001_initial... OK
#   Applying api.0001_initial... OK
#   ...
```

### Step 3: Create Superuser

```bash
python manage.py createsuperuser
```

**Enter details**:
```
Username: admin
Email address: admin@acurate.com
Password: admin123
Password (again): admin123
Superuser created successfully.
```

### Step 4: Load Test Data

```bash
python create_test_data.py
```

**Expected output**:
```
======================================================================
🚀 ACURATE TEST DATA GENERATOR
======================================================================

🗑️  Clearing existing data...
✅ Existing data cleared

📚 Creating Program Outcomes...
  ✓ Created PO1: Engineering Knowledge (Target: 70.00%)
  ✓ Created PO2: Problem Analysis (Target: 75.00%)
  ...
✅ Created 5 Program Outcomes

👨‍🏫 Creating Teachers...
  ✓ Created Sarah Johnson (teacher1)
  ✓ Created Michael Chen (teacher2)
✅ Created 2 Teachers

...

======================================================================
🎉 TEST DATA CREATION COMPLETED!
======================================================================
```

### Step 5: Collect Static Files (for Production)

```bash
# Only needed for production
python manage.py collectstatic
```

---

## 🚀 Running the Server

### Development Server

```bash
# Start Django development server
python manage.py runserver

# Or specify port
python manage.py runserver 8000

# Or bind to all interfaces
python manage.py runserver 0.0.0.0:8000
```

**Expected output**:
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
October 31, 2024 - 10:30:00
Django version 5.2.1, using settings 'backend.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

### Access the Application

1. **Admin Panel**: http://127.0.0.1:8000/admin/
   - Login with superuser credentials (admin / admin123)

2. **API Root** (after Bilgisu implements): http://127.0.0.1:8000/api/

3. **API Documentation** (after Swagger setup): http://127.0.0.1:8000/api/docs/

---

## 🔧 Troubleshooting

### Issue 1: Module Not Found

**Error**:
```
ModuleNotFoundError: No module named 'rest_framework'
```

**Solution**:
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Reinstall requirements
pip install -r requirements.txt
```

### Issue 2: Database Connection Error

**Error**:
```
django.db.utils.OperationalError: connection to server failed
```

**Solution for PostgreSQL**:
```bash
# Check if PostgreSQL is running
# Mac
brew services list

# Ubuntu
sudo systemctl status postgresql

# Start PostgreSQL if not running
# Mac
brew services start postgresql@14

# Ubuntu
sudo systemctl start postgresql
```

**Solution for SQLite**:
```bash
# Delete database and recreate
rm db.sqlite3
python manage.py migrate
python create_test_data.py
```

### Issue 3: Migration Errors

**Error**:
```
django.db.migrations.exceptions.InconsistentMigrationHistory
```

**Solution**:
```bash
# Delete all migrations except __init__.py
rm api/migrations/0*.py

# Delete database
rm db.sqlite3  # or DROP DATABASE in PostgreSQL

# Recreate migrations
python manage.py makemigrations
python manage.py migrate
python create_test_data.py
```

### Issue 4: Port Already in Use

**Error**:
```
Error: That port is already in use.
```

**Solution**:
```bash
# Use different port
python manage.py runserver 8001

# Or find and kill process using port 8000
# Mac/Linux
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Issue 5: Permission Denied

**Error**:
```
PermissionError: [Errno 13] Permission denied
```

**Solution**:
```bash
# Make sure you're in the project directory
cd backend

# Check file permissions
ls -la

# Fix permissions (Mac/Linux)
chmod +x manage.py
chmod +x create_test_data.py
```

### Issue 6: Admin Panel Not Loading CSS

**Error**: Admin panel appears without styling

**Solution**:
```bash
# Collect static files
python manage.py collectstatic --noinput

# Or run with --insecure flag (development only)
python manage.py runserver --insecure
```

---

## 🌐 Production Setup

### 1. Environment Variables

Create production `.env` file:

```env
SECRET_KEY=<generate-random-secret-key>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=acurate_prod
DATABASE_USER=acurate_prod_user
DATABASE_PASSWORD=<strong-password>
DATABASE_HOST=localhost
DATABASE_PORT=5432

CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### 2. Security Settings

Update `settings.py`:

```python
# settings.py
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
```

### 3. Web Server (Gunicorn + Nginx)

```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn backend.wsgi:application --bind 0.0.0.0:8000
```

**Nginx configuration** (`/etc/nginx/sites-available/acurate`):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /static/ {
        alias /path/to/AcuRate/backend/staticfiles/;
    }

    location /media/ {
        alias /path/to/AcuRate/backend/media/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Systemd Service

Create `/etc/systemd/system/acurate.service`:

```ini
[Unit]
Description=AcuRate Django Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/AcuRate/backend
ExecStart=/path/to/AcuRate/backend/venv/bin/gunicorn \
          --workers 3 \
          --bind 0.0.0.0:8000 \
          backend.wsgi:application

[Install]
WantedBy=multi-user.target
```

Start service:

```bash
sudo systemctl start acurate
sudo systemctl enable acurate
```

---

## 📝 Common Commands

```bash
# Start server
python manage.py runserver

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load test data
python create_test_data.py

# Django shell
python manage.py shell

# Check for issues
python manage.py check

# Run tests
python manage.py test

# Collect static files
python manage.py collectstatic
```

---

## 🆘 Need Help?

1. **Check Django Documentation**: https://docs.djangoproject.com/
2. **Check DRF Documentation**: https://www.django-rest-framework.org/
3. **Contact Alperen**: Backend/Database issues
4. **Contact Bilgisu**: API/Serializer issues

---

**Good Luck! 🚀**

