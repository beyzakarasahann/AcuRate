/**
 * AcuRate - API Client
 * Centralized API communication with authentication support
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'STUDENT' | 'TEACHER' | 'INSTITUTION';
  role_display: string;
  phone?: string;
  profile_picture?: string;
  student_id?: string;
  department?: string;
  year_of_study?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: User;
  tokens?: {
    access: string;
    refresh: string;
  };
  errors?: any;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  errors?: any;
}

export interface ProgramOutcome {
  id: number;
  code: string;
  title: string;
  description: string;
  target_percentage: number;
  is_active: boolean;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  description: string;
  credits: number;
  semester: string;
  semester_display: string;
  year: number;
  teacher: number;
  teacher_name: string;
  is_active: boolean;
}

export interface Enrollment {
  id: number;
  student: number;
  student_name: string;
  student_id: string;
  course: number;
  course_code: string;
  course_name: string;
  enrollment_date: string;
  status: string;
  status_display: string;
  final_grade?: number;
  letter_grade?: string;
  is_active: boolean;
}

export interface StudentGrade {
  id: number;
  student: number;
  student_name: string;
  assessment: number;
  assessment_title: string;
  assessment_type: string;
  score: number;
  max_score: number;
  percentage: number;
  feedback?: string;
  graded_at?: string;
}

export interface StudentPOAchievement {
  id: number;
  student: number;
  student_name: string;
  student_id: string;
  program_outcome: number;
  po_code: string;
  po_title: string;
  achievement_percentage: number;
  target_percentage: number;
  is_achieved: boolean;
  completed_assessments: number;
  total_assessments: number;
  semester: string;
  year: number;
}

export interface DashboardData {
  student?: User;
  teacher?: User;
  enrollments?: Enrollment[];
  po_achievements?: StudentPOAchievement[];
  recent_grades?: StudentGrade[];
  courses?: Course[];
  overall_gpa?: number;
  total_credits?: number;
  completed_courses?: number;
  total_students?: number;
  total_teachers?: number;
  total_courses?: number;
  active_enrollments?: number;
  pending_assessments?: number;
}

// Token management
class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';
  private static USER_KEY = 'user';

  static setTokens(access: string, refresh: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, access);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh);
    }
  }

  static getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  static getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  static clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  static setUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  static getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = TokenManager.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle token refresh on 401
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request with new token
          const newToken = TokenManager.getAccessToken();
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          return await retryResponse.json();
        } else {
          // Refresh failed, logout
          TokenManager.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error('Authentication failed');
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        TokenManager.setTokens(data.access, refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  // Authentication
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.success && response.tokens && response.user) {
      TokenManager.setTokens(response.tokens.access, response.tokens.refresh);
      TokenManager.setUser(response.user);
    }

    return response;
  }

  async logout(): Promise<void> {
    const refreshToken = TokenManager.getRefreshToken();
    try {
      await this.request('/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } finally {
      TokenManager.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ success: boolean; user: User }>('/auth/me/');
    if (response.user) {
      TokenManager.setUser(response.user);
      return response.user;
    }
    throw new Error('Failed to get current user');
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    role: string;
  }): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.tokens && response.user) {
      TokenManager.setTokens(response.tokens.access, response.tokens.refresh);
      TokenManager.setUser(response.user);
    }

    return response;
  }

  // Dashboard
  async getStudentDashboard(): Promise<DashboardData> {
    return await this.request<DashboardData>('/dashboard/student/');
  }

  async getTeacherDashboard(): Promise<DashboardData> {
    return await this.request<DashboardData>('/dashboard/teacher/');
  }

  async getInstitutionDashboard(): Promise<DashboardData> {
    return await this.request<DashboardData>('/dashboard/institution/');
  }

  // Program Outcomes
  async getProgramOutcomes(): Promise<ProgramOutcome[]> {
    return await this.request<ProgramOutcome[]>('/program-outcomes/');
  }

  async getProgramOutcome(id: number): Promise<ProgramOutcome> {
    return await this.request<ProgramOutcome>(`/program-outcomes/${id}/`);
  }

  // Courses
  async getCourses(params?: { semester?: string; year?: number }): Promise<Course[]> {
    const queryParams = new URLSearchParams(params as any).toString();
    const endpoint = `/courses/${queryParams ? `?${queryParams}` : ''}`;
    return await this.request<Course[]>(endpoint);
  }

  async getCourse(id: number): Promise<Course> {
    return await this.request<Course>(`/courses/${id}/`);
  }

  // Enrollments
  async getEnrollments(params?: { course?: number; student?: number }): Promise<Enrollment[]> {
    const queryParams = new URLSearchParams(params as any).toString();
    const endpoint = `/enrollments/${queryParams ? `?${queryParams}` : ''}`;
    return await this.request<Enrollment[]>(endpoint);
  }

  // Grades
  async getGrades(params?: { student?: number; assessment?: number }): Promise<StudentGrade[]> {
    const queryParams = new URLSearchParams(params as any).toString();
    const endpoint = `/grades/${queryParams ? `?${queryParams}` : ''}`;
    return await this.request<StudentGrade[]>(endpoint);
  }

  // PO Achievements
  async getPOAchievements(params?: { student?: number; program_outcome?: number }): Promise<StudentPOAchievement[]> {
    const queryParams = new URLSearchParams(params as any).toString();
    const endpoint = `/po-achievements/${queryParams ? `?${queryParams}` : ''}`;
    return await this.request<StudentPOAchievement[]>(endpoint);
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Export token manager for auth checks
export { TokenManager };

