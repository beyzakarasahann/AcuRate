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

export interface LearningOutcome {
  id: number;
  code: string;
  title: string;
  description: string;
  course: number;
  course_code?: string;
  course_name?: string;
  target_percentage: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  description: string;
  credits: number;
  semester: number;
  semester_display: string;
  academic_year: string;
  department: string;
  teacher: number;
  teacher_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Enrollment {
  id: number;
  student: number;
  student_name?: string;
  student_id?: string;
  course: number;
  course_code?: string;
  course_name?: string;
  enrolled_at: string;
  is_active: boolean;
  final_grade?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface FeedbackRange {
  min_score: number;
  max_score: number;
  feedback: string;
}

export interface Assessment {
  id: number;
  course: number;
  course_code?: string;
  course_name?: string;
  title: string;
  description?: string;
  assessment_type: string;
  type_display?: string;
  weight: number;
  max_score: number;
  due_date?: string;
  is_active: boolean;
  related_pos?: number[];
  feedback_ranges?: FeedbackRange[];
  created_at?: string;
  updated_at?: string;
}

export interface StudentGrade {
  id: number;
  student: number;
  student_name: string;
  student_id?: string;
  assessment: number;
  assessment_title: string;
  assessment_type: string;
  score: number;
  max_score: number;
  percentage: number;
  feedback?: string;
  graded_at?: string;
  graded_by?: number;
}

export interface StudentPOAchievement {
  id: number;
  student: number;
  student_name: string;
  student_id: string;
  program_outcome: number;
  po_code?: string;
  po_title?: string;
  achievement_percentage: number;
  target_percentage: number;
  is_achieved?: boolean;
  completed_assessments: number;
  total_assessments: number;
  created_at?: string;
  updated_at?: string;
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
  gpa_ranking?: {
    rank: number;
    total_students: number;
    percentile: number;
  } | null;
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
    const method = options.method || 'GET';
    
    // Store endpoint for error handling
    const requestEndpoint = endpoint;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
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
          if (!retryResponse.ok) {
            const errorText = await retryResponse.text();
            throw new Error(`Request failed: ${retryResponse.status} ${retryResponse.statusText}`);
          }
          try {
            return await retryResponse.json();
          } catch {
            throw new Error('Invalid JSON response from server');
          }
        } else {
          // Refresh failed, logout
          TokenManager.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error('Authentication failed');
        }
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          throw new Error('Failed to parse JSON response. The server may be down or returned an invalid response.');
        }
      } else {
        // Non-JSON response (likely HTML error page from Django)
        const text = await response.text();
        if (!response.ok) {
          // Extract meaningful error info from HTML if possible
          let errorInfo = '';
          if (text.includes('<title>')) {
            // Try to extract title from HTML
            const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
            if (titleMatch) {
              errorInfo = titleMatch[1].trim();
            }
          }
          // For 500 errors, provide a user-friendly message with endpoint info
          if (response.status === 500) {
            throw new Error(`Server error (500): The backend encountered an internal error on ${method} ${endpoint}. Please check the backend logs.`);
          }
          throw new Error(`Server error: ${response.status} ${response.statusText} on ${method} ${endpoint}. ${errorInfo || text.substring(0, 100)}`);
        }
        throw new Error('Expected JSON response but received non-JSON content');
      }

      if (!response.ok) {
        // Handle server errors (500, 502, 503, etc.)
        if (response.status >= 500) {
          const errorMessage = data?.error || data?.message || data?.detail || 
            `Server error (${response.status}): The backend encountered an internal error on ${method} ${endpoint}. Please check the backend logs or try again later.`;
          throw new Error(errorMessage);
        }
        
        // Handle authentication errors (400, 401) with user-friendly messages
        if (response.status === 400 || response.status === 401) {
          // Check for error field first (new backend format)
          const errorMessage = data?.error || data?.message || data?.detail;
          if (errorMessage && typeof errorMessage === 'string') {
            // Only show "Incorrect username or password" for login-specific errors
            if (
              (errorMessage.toLowerCase().includes('invalid') ||
              errorMessage.toLowerCase().includes('credential') ||
              errorMessage.toLowerCase().includes('password') ||
              errorMessage.toLowerCase().includes('username')) &&
              endpoint.includes('/auth/login')
            ) {
              throw new Error('Incorrect username or password');
            }
            // For other authentication errors, use the actual error message
            if (response.status === 401) {
              throw new Error(errorMessage || 'Authentication failed. Please log in again.');
            }
            throw new Error(errorMessage);
          }
          
          // Check for non_field_errors (Django REST Framework format)
          if (data?.non_field_errors && Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
            const firstError = data.non_field_errors[0];
            if (typeof firstError === 'string') {
              // Only show "Incorrect username or password" for login-specific errors
              if (
                (firstError.toLowerCase().includes('invalid') ||
                firstError.toLowerCase().includes('credential') ||
                firstError.toLowerCase().includes('password') ||
                firstError.toLowerCase().includes('username')) &&
                endpoint.includes('/auth/login')
              ) {
                throw new Error('Incorrect username or password');
              }
              throw new Error(firstError);
            }
            throw new Error(firstError);
          }
          
          // Default error message based on status code
          if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          }
          throw new Error(data?.error || data?.message || data?.detail || `Request failed with status ${response.status}`);
        }
        // Try to extract detailed error messages from Django REST Framework format
        let errorMessage = data?.error || data?.message || data?.detail;
        
        // If no direct error message, check for field-specific errors
        if (!errorMessage && typeof data === 'object') {
          const fieldErrors: string[] = [];
          for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value) && value.length > 0) {
              fieldErrors.push(`${key}: ${value[0]}`);
            } else if (typeof value === 'string') {
              fieldErrors.push(`${key}: ${value}`);
            } else if (typeof value === 'object' && value !== null) {
              // Handle nested error objects
              const nestedErrors = Object.entries(value).map(([k, v]) => {
                if (Array.isArray(v) && v.length > 0) {
                  return `${key}.${k}: ${v[0]}`;
                }
                return `${key}.${k}: ${v}`;
              });
              fieldErrors.push(...nestedErrors);
            }
          }
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join(', ');
          }
        }
        
        // Log the full error data for debugging
        if (response.status === 400) {
          console.error('400 Error Details:', JSON.stringify(data, null, 2));
        }
        
        if (!errorMessage) {
          errorMessage = `Request failed with status ${response.status} on ${method} ${endpoint}`;
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('API Error: Network error - Backend server may be down', error);
        throw new Error('Cannot connect to the server. Please make sure the backend is running on http://localhost:8000');
      }
      
      // Re-throw if it's already an Error
      if (error instanceof Error) {
        // Don't log user-friendly authentication errors to console
        const isAuthError = error.message === 'Incorrect username or password' || 
                           error.message === 'Authentication failed' ||
                           error.message.toLowerCase().includes('incorrect username or password');
        
        // Clean up error messages that might contain HTML
        let cleanMessage = error.message;
        if (cleanMessage.includes('<!DOCTYPE') || cleanMessage.includes('<html')) {
          // Extract meaningful info from HTML error if possible
          const titleMatch = cleanMessage.match(/<title>([^<]+)<\/title>/i);
          if (titleMatch) {
            cleanMessage = `Server Error: ${titleMatch[1].trim()}`;
          } else {
            // Try to extract endpoint from error message if available
            const endpointMatch = cleanMessage.match(/(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)/);
            const endpointInfo = endpointMatch ? ` on ${endpointMatch[1]} ${endpointMatch[2]}` : '';
            cleanMessage = `Server error: The backend encountered an internal error${endpointInfo}. Please check the backend logs.`;
          }
        }
        
        if (!isAuthError) {
          console.error('API Error:', cleanMessage);
        }
        
        // Update error message if it was cleaned
        if (cleanMessage !== error.message) {
          throw new Error(cleanMessage);
        }
        throw error;
      }
      
      // Handle unknown errors
      console.error('API Error:', error);
      // Include endpoint info if available
      const endpointInfo = requestEndpoint ? ` on ${method} ${requestEndpoint}` : '';
      const errorDetails = error instanceof Error ? error.message : String(error);
      throw new Error(`An unexpected error occurred${endpointInfo}: ${errorDetails}. Please check the console for details.`);
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
    // Try /users/me/ first (ViewSet action)
    try {
      const response = await this.request<User>('/users/me/');
      TokenManager.setUser(response);
      return response;
    } catch (error: any) {
      // Fallback to /auth/me/ if /users/me/ doesn't work
      try {
        const response = await this.request<{ success: boolean; user: User }>('/auth/me/');
        if (response.success && response.user) {
          TokenManager.setUser(response.user);
          return response.user;
        }
        throw new Error('Failed to get current user');
      } catch (fallbackError: any) {
        // If both fail, throw the original error with more context
        const errorMessage = error?.message || fallbackError?.message || 'Failed to get current user';
        throw new Error(errorMessage);
      }
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.request<{ success: boolean; user: User; message?: string }>('/users/update_profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (response.success && response.user) {
      TokenManager.setUser(response.user);
      return response.user;
    }
    throw new Error(response.message || 'Failed to update profile');
  }

  async changePassword(oldPassword: string, newPassword: string, newPasswordConfirm: string): Promise<void> {
    const response = await this.request<{ success: boolean; message?: string; error?: string }>('/users/change_password/', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      }),
    });
    if (!response.success) {
      throw new Error(response.error || response.message || 'Failed to change password');
    }
  }

  // Contact Request
  async createContactRequest(data: {
    institution_name: string;
    institution_type: string;
    contact_name: string;
    contact_email: string;
    contact_phone?: string;
    request_type: string;
    message?: string;
  }): Promise<{ success: boolean; message: string; request_id?: number }> {
    const response = await this.request<{ success: boolean; message: string; request_id?: number; errors?: any }>('/contact/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.success) {
      throw new Error(response.errors ? JSON.stringify(response.errors) : 'Failed to submit contact request');
    }
    return response;
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
    const response = await this.request<ProgramOutcome[]>('/program-outcomes/');
    // Ensure response is an array (ViewSet returns array directly)
    return Array.isArray(response) ? response : [];
  }

  async getProgramOutcome(id: number): Promise<ProgramOutcome> {
    return await this.request<ProgramOutcome>(`/program-outcomes/${id}/`);
  }

  // Learning Outcomes
  async getLearningOutcomes(params?: { course?: number }): Promise<LearningOutcome[]> {
    const queryParams = new URLSearchParams(params as any).toString();
    const endpoint = `/learning-outcomes/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.request<LearningOutcome[]>(endpoint);
    return Array.isArray(response) ? response : [];
  }

  async getLearningOutcome(id: number): Promise<LearningOutcome> {
    return await this.request<LearningOutcome>(`/learning-outcomes/${id}/`);
  }

  async createLearningOutcome(data: Partial<LearningOutcome>): Promise<LearningOutcome> {
    return await this.request<LearningOutcome>('/learning-outcomes/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLearningOutcome(id: number, data: Partial<LearningOutcome>): Promise<LearningOutcome> {
    return await this.request<LearningOutcome>(`/learning-outcomes/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLearningOutcome(id: number): Promise<void> {
    return await this.request<void>(`/learning-outcomes/${id}/`, {
      method: 'DELETE',
    });
  }

  // Courses
  async getCourses(params?: { semester?: string; academic_year?: string }): Promise<Course[]> {
    const queryParams = new URLSearchParams(params as any).toString();
    const endpoint = `/courses/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.request<any>(endpoint);
    console.log('🔵 API: getCourses response:', response);
    console.log('🔵 API: Response type:', typeof response);
    console.log('🔵 API: Is array?', Array.isArray(response));
    console.log('🔵 API: Has results?', response && 'results' in response);
    
    // Handle paginated response (DRF returns { results: [...] })
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      console.log('🔵 API: Returning paginated results:', response.results.length);
      return response.results;
    }
    // If it's already an array, return as is
    if (Array.isArray(response)) {
      console.log('🔵 API: Returning direct array:', response.length);
      return response;
    }
    // If response is an empty object or unexpected format, return empty array
    if (response && typeof response === 'object' && Object.keys(response).length === 0) {
      console.warn('⚠️ API: Empty object response from getCourses');
      return [];
    }
    // Fallback: return empty array
    console.warn('⚠️ API: Unexpected response format from getCourses:', response);
    return [];
  }

  async getCourse(id: number): Promise<Course> {
    return await this.request<Course>(`/courses/${id}/`);
  }

  // Enrollments
  async getEnrollments(params?: { course?: number; student?: number }): Promise<Enrollment[]> {
    const queryParams = new URLSearchParams(params as any).toString();
    const endpoint = `/enrollments/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.request<any>(endpoint);
    console.log('🔵 API: getEnrollments response:', response);
    // Handle paginated response (DRF returns { results: [...] })
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      console.log('🔵 API: Returning paginated enrollments:', response.results.length);
      return response.results;
    }
    // If it's already an array, return as is
    if (Array.isArray(response)) {
      console.log('🔵 API: Returning direct enrollments array:', response.length);
      return response;
    }
    // Fallback: return empty array
    console.warn('⚠️ API: Unexpected response format from getEnrollments:', response);
    return [];
  }

  // Grades
  async getGrades(params?: { student?: number; assessment?: number }): Promise<StudentGrade[]> {
    const queryParams = new URLSearchParams(params as any).toString();
    const endpoint = `/grades/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.request<any>(endpoint);
    console.log('🔵 API: getGrades response:', response);
    // Handle paginated response (DRF returns { results: [...] })
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      console.log('🔵 API: Returning paginated grades:', response.results.length);
      return response.results;
    }
    // If it's already an array, return as is
    if (Array.isArray(response)) {
      console.log('🔵 API: Returning direct grades array:', response.length);
      return response;
    }
    // Fallback: return empty array
    console.warn('⚠️ API: Unexpected response format from getGrades:', response);
    return [];
  }

  // PO Achievements
  async getPOAchievements(params?: { student?: number; program_outcome?: number }): Promise<StudentPOAchievement[]> {
    const queryParams = new URLSearchParams(params as any).toString();
    const endpoint = `/po-achievements/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.request<StudentPOAchievement[]>(endpoint);
    // Ensure response is an array (ViewSet returns array directly)
    return Array.isArray(response) ? response : [];
  }

  // Assessments
  async getAssessments(params?: { course?: number }): Promise<Assessment[]> {
    const queryParams = new URLSearchParams(params as any).toString();
    const endpoint = `/assessments/${queryParams ? `?${queryParams}` : ''}`;
    return await this.request<Assessment[]>(endpoint);
  }

  async getAssessment(id: number): Promise<Assessment> {
    return await this.request<Assessment>(`/assessments/${id}/`);
  }

  async createAssessment(data: Partial<Assessment>): Promise<Assessment> {
    return await this.request<Assessment>('/assessments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment> {
    return await this.request<Assessment>(`/assessments/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAssessment(id: number): Promise<void> {
    return await this.request<void>(`/assessments/${id}/`, {
      method: 'DELETE',
    });
  }

  // Student Grades
  async createGrade(data: Partial<StudentGrade>): Promise<StudentGrade> {
    return await this.request<StudentGrade>('/grades/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGrade(id: number, data: Partial<StudentGrade>): Promise<StudentGrade> {
    return await this.request<StudentGrade>(`/grades/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGrade(id: number): Promise<void> {
    return await this.request<void>(`/grades/${id}/`, {
      method: 'DELETE',
    });
  }

  // Course Analytics
  async getCourseAnalytics(): Promise<{
    success: boolean;
    courses: Array<{
      course_id: number;
      course_code: string;
      course_name: string;
      instructor: string;
      semester: string;
      class_average: number;
      class_median: number;
      class_size: number;
      user_score: number | null;
      user_percentile: number | null;
      trend: 'up' | 'down' | 'neutral';
    }>;
  }> {
    return await this.request('/course-analytics/');
  }

  async getCourseAnalyticsDetail(courseId: number): Promise<{
    success: boolean;
    course: {
      id: number;
      code: string;
      name: string;
      instructor: string;
      semester: string;
    };
    analytics: {
      class_average: number;
      class_median: number;
      class_size: number;
      highest_score: number;
      lowest_score: number;
      user_score: number | null;
      user_percentile: number | null;
      score_distribution: number[];
      boxplot_data: {
        min: number;
        q1: number;
        median: number;
        q3: number;
        max: number;
      };
      assessment_comparison: Array<{
        assessment: string;
        class_average: number;
        user_score: number | null;
      }>;
    };
  }> {
    return await this.request(`/course-analytics/${courseId}/`);
  }

  // Institution Analytics
  async getAnalyticsDepartments(): Promise<{
    success: boolean;
    departments: Array<{
      name: string;
      students: number;
      courses: number;
      faculty: number;
      avg_grade: number | null;
      po_achievement: number | null;
      status: 'excellent' | 'good' | 'needs-attention';
    }>;
  }> {
    return await this.request('/analytics/departments/');
  }

  async getAnalyticsPOTrends(params?: {
    semester?: string;
    academic_year?: string;
  }): Promise<{
    success: boolean;
    program_outcomes: Array<{
      code: string;
      title: string;
      target_percentage: number;
      current_percentage: number | null;
      total_students: number;
      students_achieved: number;
      achievement_rate: number;
      status: 'excellent' | 'achieved' | 'not-achieved';
    }>;
    filters: {
      semester?: string;
      academic_year?: string;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.semester) queryParams.append('semester', params.semester);
    if (params?.academic_year) queryParams.append('academic_year', params.academic_year);
    const queryString = queryParams.toString();
    const endpoint = `/analytics/po-trends/${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async getAnalyticsPerformanceDistribution(params?: {
    department?: string;
  }): Promise<{
    success: boolean;
    distribution: {
      '0-20': number;
      '21-40': number;
      '41-60': number;
      '61-80': number;
      '81-100': number;
    };
    statistics: {
      total_students: number;
      average: number;
      median: number;
      min: number;
      max: number;
    };
    filters: {
      department?: string;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.department) queryParams.append('department', params.department);
    const queryString = queryParams.toString();
    const endpoint = `/analytics/performance-distribution/${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async getAnalyticsCourseSuccess(params?: {
    department?: string;
    semester?: string;
    academic_year?: string;
  }): Promise<{
    success: boolean;
    courses: Array<{
      course_id: number;
      course_code: string;
      course_name: string;
      department: string;
      semester: string;
      academic_year: string;
      instructor: string;
      total_students: number;
      successful_students: number;
      success_rate: number;
      average_grade: number | null;
    }>;
    filters: {
      department?: string;
      semester?: string;
      academic_year?: string;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.department) queryParams.append('department', params.department);
    if (params?.semester) queryParams.append('semester', params.semester);
    if (params?.academic_year) queryParams.append('academic_year', params.academic_year);
    const queryString = queryParams.toString();
    const endpoint = `/analytics/course-success/${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async getAnalyticsAlerts(): Promise<{
    success: boolean;
    alerts: Array<{
      type: 'warning' | 'info' | 'success';
      title: string;
      description: string;
      created_at: string;
      time: string;
    }>;
  }> {
    return await this.request('/analytics/alerts/');
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Export token manager for auth checks
export { TokenManager };

