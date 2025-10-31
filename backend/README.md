# 🎓 AcuRate Backend - Django REST API

**Academic Performance Analysis System**

This is the backend service for AcuRate, built with Django 5.2.1 and Django REST Framework.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Models](#models)
- [Database Schema](#database-schema)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Setup](#setup)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Next Steps](#next-steps)

---

## 🎯 Overview

AcuRate is an academic performance analysis system designed to track student achievements against Program Outcomes (POs). It provides:

- **Multi-role system**: Students, Teachers, and Institutions
- **Course management**: Track courses, enrollments, and assessments
- **Performance tracking**: Monitor student grades and PO achievements
- **Analytics**: Generate insights on academic performance
- **Accreditation support**: Track PO achievement for accreditation purposes

---

## 📊 Models

### 1. **User** (Custom User Model)
Custom authentication model with role-based access control.

**Roles**:
- `STUDENT`: Can view their own performance and grades
- `TEACHER`: Can manage courses and grade students
- `INSTITUTION`: Can view all analytics and reports

**Key Fields**:
- `role`: User role (Student/Teacher/Institution)
- `email`: Unique email address
- `student_id`: Unique student ID (for students)
- `department`: Department name
- `year_of_study`: Current year (1-6, for students)

**Relations**:
- → Courses (as teacher)
- → Enrollments (as student)
- → Grades (as student)
- → PO Achievements (as student)

---

### 2. **ProgramOutcome (PO)**
Learning objectives that students should achieve by graduation.

**Examples**:
- PO1: Engineering Knowledge
- PO2: Problem Analysis
- PO3: Design/Development

**Key Fields**:
- `code`: Unique PO code (e.g., PO1, PO2)
- `title`: PO title
- `description`: Detailed description
- `target_percentage`: Target achievement % (default: 70%)
- `department`: Department this PO belongs to

**Relations**:
- → Courses (many-to-many through CoursePO)
- → Assessments (many-to-many)
- → Student Achievements

---

### 3. **Course**
Academic courses offered by the institution.

**Key Fields**:
- `code`: Course code (e.g., CS101)
- `name`: Course name
- `credits`: Number of credits (1-10)
- `semester`: Fall/Spring/Summer
- `academic_year`: e.g., 2024-2025
- `teacher`: Assigned teacher (FK to User)

**Relations**:
- → Teacher (FK to User)
- → Program Outcomes (M2M through CoursePO)
- → Students (M2M through Enrollment)
- → Assessments

**Unique Together**: (code, academic_year)

---

### 4. **CoursePO** (Through Model)
Maps courses to program outcomes with weights.

**Purpose**: Tracks how much each course contributes to each PO.

**Key Fields**:
- `course`: Course FK
- `program_outcome`: PO FK
- `weight`: Contribution weight (default: 1.0)

**Example**:
- CS101 → PO1 (weight: 1.5)
- CS101 → PO5 (weight: 1.0)

---

### 5. **Enrollment**
Student enrollment in courses.

**Key Fields**:
- `student`: Student FK
- `course`: Course FK
- `is_active`: Whether enrollment is active
- `final_grade`: Final course grade (0-100)
- `enrolled_at`: Enrollment date

**Unique Together**: (student, course)

---

### 6. **Assessment**
Evaluations within a course (exams, projects, assignments).

**Types**:
- Midterm Exam
- Final Exam
- Quiz
- Homework
- Project
- Lab Work
- Presentation
- Other

**Key Fields**:
- `course`: Course FK
- `title`: Assessment title
- `assessment_type`: Type of assessment
- `weight`: Percentage in final grade
- `max_score`: Maximum possible score
- `due_date`: Due/exam date
- `related_pos`: POs this assessment evaluates (M2M)

---

### 7. **StudentGrade**
Individual student grades on assessments.

**Key Fields**:
- `student`: Student FK
- `assessment`: Assessment FK
- `score`: Score received
- `feedback`: Teacher feedback
- `graded_at`: Timestamp

**Properties**:
- `percentage`: Score as percentage
- `weighted_contribution`: Contribution to final grade

**Validation**: Score cannot exceed max_score

**Unique Together**: (student, assessment)

---

### 8. **StudentPOAchievement**
Tracks student achievement for each Program Outcome.

**Key Fields**:
- `student`: Student FK
- `program_outcome`: PO FK
- `current_percentage`: Current achievement %
- `total_assessments`: Total assessments for this PO
- `completed_assessments`: Completed assessments
- `last_calculated`: Last calculation timestamp

**Properties**:
- `is_target_met`: Whether target is achieved
- `gap_to_target`: Gap to target percentage
- `completion_rate`: Completion percentage

**Unique Together**: (student, program_outcome)

---

## 🗄️ Database Schema

```
┌─────────────────┐
│      User       │
│  (Custom Auth)  │
│─────────────────│
│ • id            │
│ • username      │
│ • email         │
│ • role          │◄──────────┐
│ • student_id    │           │
│ • department    │           │
└────────┬────────┘           │
         │                    │
         │ teaches            │
         ▼                    │
┌─────────────────┐           │
│     Course      │           │
│─────────────────│           │
│ • code          │           │
│ • name          │           │
│ • credits       │           │
│ • semester      │           │
│ • academic_year │           │
└────────┬────────┘           │
         │                    │
         │                    │
    ┌────┴────┐               │
    │         │               │
    ▼         ▼               │
┌─────────┐ ┌──────────────┐ │
│CoursePO │ │  Enrollment  │─┘
│─────────│ │──────────────│ student
│ weight  │ │ final_grade  │
└────┬────┘ └──────┬───────┘
     │             │
     ▼             ▼
┌────────────┐ ┌──────────────┐
│ProgramOut- │ │  Assessment  │
│   come     │ │──────────────│
│────────────│ │ • title      │
│ • code     │◄┤ • type       │
│ • title    │ │ • weight     │
│ • target%  │ │ • max_score  │
└─────┬──────┘ └──────┬───────┘
      │               │
      │               ▼
      │        ┌──────────────┐
      │        │StudentGrade  │
      │        │──────────────│
      │        │ • score      │
      │        │ • feedback   │
      │        └──────────────┘
      │
      ▼
┌────────────────────┐
│ StudentPO-         │
│   Achievement      │
│────────────────────│
│ • current_%        │
│ • total_assess     │
│ • completed_assess │
└────────────────────┘
```

---

## ✨ Features

### ✅ Implemented

1. **User Management**
   - Custom user model with roles
   - Student, Teacher, Institution roles
   - Profile management

2. **Course Management**
   - Course creation and management
   - Teacher assignment
   - Semester and academic year tracking

3. **Program Outcomes**
   - PO definition and management
   - Target percentage setting
   - Course-PO mapping with weights

4. **Enrollment System**
   - Student enrollment in courses
   - Final grade tracking
   - Active/inactive status

5. **Assessment Management**
   - Multiple assessment types
   - Weight in final grade
   - PO mapping for assessments

6. **Grading System**
   - Individual student grades
   - Percentage calculation
   - Weighted contribution
   - Teacher feedback

7. **PO Achievement Tracking**
   - Per-student PO achievement
   - Progress tracking
   - Target achievement status
   - Completion rate

8. **Admin Panel**
   - Colorful, professional interface
   - Role badges
   - Status indicators
   - Inline editing
   - Search and filters

### 🚧 To Be Implemented (by Bilgisu)

1. **API Endpoints**
   - RESTful API for all models
   - CRUD operations
   - Filtering and pagination

2. **Authentication**
   - JWT token authentication
   - Login/logout endpoints
   - Token refresh

3. **Permissions**
   - Role-based permissions
   - Custom permission classes

4. **Analytics Endpoints**
   - Department performance
   - PO achievement statistics
   - Student performance reports

5. **Bulk Operations**
   - Bulk grade upload
   - Bulk enrollment

6. **API Documentation**
   - Swagger/OpenAPI
   - Postman collection

---

## 🛠️ Technology Stack

### Core
- **Python**: 3.12+
- **Django**: 5.2.1
- **Django REST Framework**: 3.15.2

### Database
- **SQLite**: Development (default)
- **PostgreSQL**: Production (recommended)
  - Driver: psycopg2-binary 2.9.10

### Authentication
- **JWT**: djangorestframework-simplejwt 5.3.1

### Additional
- **CORS**: django-cors-headers 4.6.0
- **Environment**: python-decouple 3.8
- **Images**: Pillow 11.0.0
- **Date Utils**: python-dateutil 2.9.0

---

## 🚀 Setup

### Quick Start

```bash
# Create virtual environment
python -m venv venv

# Activate (Mac/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load test data
python create_test_data.py

# Start server
python manage.py runserver
```

**Admin Panel**: http://127.0.0.1:8000/admin/

For detailed setup instructions, see [SETUP.md](SETUP.md).

---

## 📡 API Documentation

### Base URL
```
http://127.0.0.1:8000/api/
```

### Authentication
All API endpoints (except login) require JWT authentication:

```http
Authorization: Bearer <access_token>
```

### Endpoints (To be implemented by Bilgisu)

```
POST   /api/auth/login/           - Login
POST   /api/auth/refresh/         - Refresh token
POST   /api/auth/logout/          - Logout

GET    /api/users/                - List users
GET    /api/users/{id}/           - User detail
POST   /api/users/                - Create user
PATCH  /api/users/{id}/           - Update user
DELETE /api/users/{id}/           - Delete user

GET    /api/program-outcomes/     - List POs
GET    /api/courses/              - List courses
GET    /api/enrollments/          - List enrollments
GET    /api/assessments/          - List assessments
GET    /api/grades/               - List grades
GET    /api/achievements/         - List achievements

GET    /api/analytics/department/ - Department analytics
GET    /api/analytics/student/{id}/ - Student analytics
```

---

## 🧪 Testing

### Test Data Credentials

**Teachers**:
- Username: `teacher1` / Password: `teacher123`
- Username: `teacher2` / Password: `teacher123`

**Students**:
- Username: `student1` / Password: `student123`
- Username: `student2` / Password: `student123`
- Username: `student3` / Password: `student123`

**Superuser** (create manually):
- Username: `admin` / Password: `admin123`

### Database
- **Test Data**: Run `python create_test_data.py`
- **Reset Database**: Delete `db.sqlite3` and re-run migrations

---

## 📝 Next Steps

### For Bilgisu (API Development)

1. **Create Serializers** (`api/serializers.py`)
   - UserSerializer
   - ProgramOutcomeSerializer
   - CourseSerializer
   - AssessmentSerializer
   - StudentGradeSerializer
   - StudentPOAchievementSerializer

2. **Create ViewSets** (`api/views.py`)
   - Use ModelViewSet for CRUD operations
   - Add custom actions (e.g., grade_student, calculate_po)
   - Implement filtering and pagination

3. **Setup URLs** (`api/urls.py`)
   - Use DefaultRouter
   - Register all viewsets

4. **Authentication**
   - JWT login view
   - Token refresh view
   - Custom authentication classes

5. **Permissions** (`api/permissions.py`)
   - IsStudent
   - IsTeacher
   - IsInstitution
   - Custom object permissions

6. **Testing** (`api/tests.py`)
   - Unit tests for models
   - Integration tests for APIs
   - Authentication tests

7. **Documentation**
   - Add drf-yasg for Swagger
   - Create API_DOCUMENTATION.md
   - Create Postman collection

### For Frontend Team

1. **Wait for API endpoints** (Bilgisu)
2. **Use mock data** in the meantime
3. **Integrate API calls** after endpoints are ready

---

## 📞 Contact

**Backend Lead**: Alperen (Models, Database, Admin)
**API Development**: Bilgisu (Serializers, Endpoints, Auth)

---

## 📄 License

AcuRate - Academic Performance Analysis System
© 2024 - All Rights Reserved

---

**Happy Coding! 🚀**

