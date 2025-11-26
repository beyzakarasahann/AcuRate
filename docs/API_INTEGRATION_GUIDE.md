# 🔗 AcuRate API Integration Guide

## ✅ Completed Tasks

### Backend API
- ✅ **Serializers** created for all models (JSON conversion)
- ✅ **Views/ViewSets** created with CRUD endpoints
- ✅ **URL routing** configured
- ✅ **JWT Authentication** implemented
- ✅ **Dashboard endpoints** created for all roles

### Frontend Integration
- ✅ **API Client** (`src/lib/api.ts`) with TypeScript types
- ✅ **Token Management** (localStorage + auto-refresh)
- ✅ **Login Page** connected to backend API
- ✅ **Error Handling** and loading states

## 🚀 API Endpoints

### Base URL
```
http://localhost:8000/api
```

### Authentication Endpoints

#### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "student1",
  "password": "student123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "student1",
    "email": "student1@acurate.com",
    "role": "STUDENT",
    ...
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1...",
    "refresh": "eyJ0eXAiOiJKV1..."
  }
}
```

#### Logout
```http
POST /api/auth/logout/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1..."
}
```

#### Get Current User
```http
GET /api/auth/me/
Authorization: Bearer <access_token>
```

#### Refresh Token
```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1..."
}
```

### Dashboard Endpoints

#### Student Dashboard
```http
GET /api/dashboard/student/
Authorization: Bearer <access_token>

Response:
{
  "student": { ... },
  "enrollments": [ ... ],
  "po_achievements": [ ... ],
  "recent_grades": [ ... ],
  "overall_gpa": 3.74,
  "total_credits": 95,
  "completed_courses": 5
}
```

#### Teacher Dashboard
```http
GET /api/dashboard/teacher/
Authorization: Bearer <access_token>

Response:
{
  "teacher": { ... },
  "courses": [ ... ],
  "total_students": 25,
  "pending_assessments": 3,
  "recent_submissions": [ ... ]
}
```

#### Institution Dashboard
```http
GET /api/dashboard/institution/
Authorization: Bearer <access_token>

Response:
{
  "total_students": 150,
  "total_teachers": 25,
  "total_courses": 45,
  "active_enrollments": 200,
  "po_achievements": [ ... ],
  "department_stats": [ ... ]
}
```

### Resource Endpoints (CRUD)

#### Program Outcomes
```http
GET    /api/program-outcomes/           # List all
GET    /api/program-outcomes/:id/       # Get one
POST   /api/program-outcomes/           # Create
PUT    /api/program-outcomes/:id/       # Update
DELETE /api/program-outcomes/:id/       # Delete
GET    /api/program-outcomes/statistics/  # Get stats
```

#### Courses
```http
GET    /api/courses/                    # List all
GET    /api/courses/:id/                # Get one
POST   /api/courses/                    # Create
PUT    /api/courses/:id/                # Update
DELETE /api/courses/:id/                # Delete
GET    /api/courses/:id/students/       # Get enrolled students
GET    /api/courses/:id/assessments/    # Get course assessments

# Query Params
?semester=FALL&year=2025
```

#### Enrollments
```http
GET    /api/enrollments/                # List all
GET    /api/enrollments/:id/            # Get one
POST   /api/enrollments/                # Create
PUT    /api/enrollments/:id/            # Update
DELETE /api/enrollments/:id/            # Delete

# Query Params
?course=1&student=2
```

#### Assessments
```http
GET    /api/assessments/                # List all
GET    /api/assessments/:id/            # Get one
POST   /api/assessments/                # Create
PUT    /api/assessments/:id/            # Update
DELETE /api/assessments/:id/            # Delete
GET    /api/assessments/:id/grades/     # Get all grades

# Query Params
?course=1
```

#### Student Grades
```http
GET    /api/grades/                     # List all
GET    /api/grades/:id/                 # Get one
POST   /api/grades/                     # Create
PUT    /api/grades/:id/                 # Update
DELETE /api/grades/:id/                 # Delete

# Query Params
?student=1&assessment=2
```

#### PO Achievements
```http
GET    /api/po-achievements/            # List all (read-only)
GET    /api/po-achievements/:id/        # Get one

# Query Params
?student=1&program_outcome=2
```

## 💻 Frontend Usage

### Setup Environment Variables

Create `.env.local` in `frontend/` directory:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Using the API Client

```typescript
import { api, TokenManager } from '@/lib/api';

// Login
const response = await api.login('student1', 'student123');
if (response.success) {
  // Tokens are automatically stored
  console.log('User:', response.user);
  // Redirect to dashboard
}

// Get current user
const user = await api.getCurrentUser();

// Get dashboard data
const dashboardData = await api.getStudentDashboard();

// Get courses
const courses = await api.getCourses({ semester: 'FALL', year: 2025 });

// Get enrollments
const enrollments = await api.getEnrollments({ student: userId });

// Get PO achievements
const achievements = await api.getPOAchievements({ student: userId });

// Check if authenticated
if (TokenManager.isAuthenticated()) {
  // User is logged in
}

// Get stored user
const storedUser = TokenManager.getUser();

// Logout
await api.logout();
```

### Authentication Flow

1. **User logs in** → API returns JWT tokens
2. **Tokens stored** in localStorage (access + refresh)
3. **API calls** automatically include access token in headers
4. **Token expires** → Automatically refreshed using refresh token
5. **Refresh fails** → User redirected to login page

### Example: Login Page

```typescript
'use client';
import { api } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await api.login(username, password);
      
      if (response.success && response.user) {
        // Redirect based on role
        const redirectMap = {
          'STUDENT': '/student',
          'TEACHER': '/teacher',
          'INSTITUTION': '/institution'
        };
        router.push(redirectMap[response.user.role] || '/');
      } else {
        setError('Login failed');
      }
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      {/* Form inputs */}
    </form>
  );
}
```

### Example: Student Dashboard

```typescript
'use client';
import { api, type DashboardData } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await api.getStudentDashboard();
        setData(dashboardData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;
  
  return (
    <div>
      <h1>Welcome, {data.student?.first_name}</h1>
      <p>GPA: {data.overall_gpa?.toFixed(2)}</p>
      <p>Credits: {data.total_credits}</p>
      
      {/* Courses */}
      <div>
        {data.enrollments?.map(enrollment => (
          <div key={enrollment.id}>
            <h3>{enrollment.course_name}</h3>
            <p>Grade: {enrollment.letter_grade || 'In Progress'}</p>
          </div>
        ))}
      </div>
      
      {/* PO Achievements */}
      <div>
        {data.po_achievements?.map(po => (
          <div key={po.id}>
            <h4>{po.po_title}</h4>
            <p>Achievement: {po.achievement_percentage}%</p>
            <p>Target: {po.target_percentage}%</p>
            <p>{po.is_achieved ? '✅ Achieved' : '❌ Not Achieved'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔒 Authentication & Permissions

### Role-Based Access

- **STUDENT**: Can view own data only
- **TEACHER**: Can view courses they teach + enrolled students
- **INSTITUTION**: Can view all data + analytics

### Protected Routes (Middleware)

The middleware (`src/middleware.ts`) checks:
1. User is authenticated (has token)
2. User role matches route (e.g., students can't access `/teacher`)

## 🧪 Testing the API

### 1. Start Backend Server
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

### 2. Test with cURL

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"student123"}'

# Get dashboard (replace TOKEN with access token from login)
curl -X GET http://localhost:8000/api/dashboard/student/ \
  -H "Authorization: Bearer TOKEN"
```

### 3. Start Frontend Server
```bash
cd frontend
npm run dev
```

Visit http://localhost:3000/login

### Demo Credentials

**Students:**
- student1 / student123 (Alice Smith - 2024001)
- student2 / student123 (Bob Wilson - 2024002)
- student3 / student123 (Charlie Brown - 2024003)

**Teachers:**
- teacher1 / teacher123 (Sarah Johnson)
- teacher2 / teacher123 (Michael Chen)

**Institution:**
- admin / admin123

## 📊 Next Steps

### For Bilgisu (Backend Developer):
1. ✅ API endpoints created - ready for testing
2. Add more complex analytics endpoints
3. Implement file upload for profile pictures
4. Add API documentation (Swagger)
5. Add rate limiting
6. Write unit tests

### For Tuana (Frontend Developer):
1. ✅ API client ready - integrate into institution dashboard
2. Update all dashboard pages to use real API data
3. Add loading spinners and error handling
4. Implement data caching (React Query)
5. Add form validation
6. Test all user flows

### For Beyza (Frontend Developer):
1. ✅ Login integrated - test with real API
2. Update student/teacher pages to use API
3. Add real-time updates (WebSocket later)
4. Implement notifications
5. Add profile editing
6. Test authentication flows

## 🐛 Troubleshooting

### CORS Errors
- Backend `settings.py` already configured for localhost:3000
- If using different port, add to `CORS_ALLOWED_ORIGINS`

### 401 Unauthorized
- Token expired → Auto-refresh should handle this
- Token missing → User needs to login again
- Check browser console for error details

### 403 Forbidden
- User doesn't have permission for this resource
- Check role-based access rules in backend views

### Connection Refused
- Make sure backend server is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

## 📝 Summary

✅ **Backend**: Full REST API with JWT authentication, role-based access, and dashboard endpoints

✅ **Frontend**: API client with automatic token management, error handling, and TypeScript types

✅ **Integration**: Login page connected, ready for dashboard integration

🎯 **Status**: Backend-Frontend connection established and working!

Frontend ve backend başarıyla bağlandı! 🎉

