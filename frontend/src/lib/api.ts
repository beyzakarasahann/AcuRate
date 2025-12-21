/**
 * AcuRate - API Client
 * Centralized API communication with authentication support
 */

// Get API base URL from environment variable
// Ensure it ends with /api but no trailing slash
const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    // Remove trailing slash if present
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  // Default fallback
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

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
  office_location?: string;
  is_active: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_temporary_password?: boolean;
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
  department: string;
  target_percentage: number;
  is_active: boolean | string;
  created_at?: string;
  updated_at?: string;
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
  program_outcomes?: Array<{
    id: number;
    program_outcome: number;
    po_code: string;
    po_title: string;
    weight: number | string;
  }>;
  learning_outcomes?: Array<{
    id: number;
    code: string;
    title: string;
    description: string;
    course: number;
    target_percentage: number;
  }>;
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
  feedback_ranges?: FeedbackRange[];
  related_pos?: number[];
  is_active?: boolean;
}

export interface AssessmentLO {
  id: number;
  assessment: number | { id: number; title?: string };
  assessment_title?: string;
  assessment_type?: string;
  learning_outcome: number | { id: number; code?: string; title?: string };
  lo_code?: string;
  lo_title?: string;
  lo_description?: string;
  course_code?: string;
  weight: number;
  created_at?: string;
  updated_at?: string;
}

export interface LOPO {
  id: number;
  learning_outcome: number | { id: number; code?: string; title?: string };
  lo_code?: string;
  lo_title?: string;
  lo_description?: string;
  program_outcome: number | { id: number; code?: string; title?: string };
  po_code?: string;
  po_title?: string;
  course_code?: string;
  weight: number;
  created_at?: string;
  updated_at?: string;
  due_date?: string;
  is_active: boolean;
  related_pos?: number[];
  feedback_ranges?: FeedbackRange[];
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
  program_outcome: number | { id: number; code?: string; title?: string };
  po_code?: string;
  po_title?: string;
  achievement_percentage?: number; // From serializer (maps to current_percentage)
  current_percentage?: number; // Direct field from model
  target_percentage: number;
  is_achieved?: boolean;
  completed_assessments: number;
  total_assessments: number;
  created_at?: string;
  updated_at?: string;
}

export interface StudentLOAchievement {
  id: number;
  student: number;
  student_name?: string;
  student_id?: string;
  learning_outcome: number | { id: number; code?: string; title?: string };
  lo_code?: string;
  lo_title?: string;
  lo_description?: string;
  course?: number;
  course_code?: string;
  course_name?: string;
  current_percentage: number;
  target_percentage: number;
  achievement_percentage?: number;
  is_target_met?: boolean;
  completed_assessments: number;
  total_assessments: number;
  completion_rate?: number;
  last_calculated?: string;
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

export interface SuperAdminDashboardData {
  total_institutions: number;
  total_teachers: number;
  total_students: number;
  institution_logins: {
    last_24h: number;
    last_7d: number;
    last_30d: number;
  };
  today_activities: number;
  most_active_institution: string | null;
  most_active_user: string | null;
  recent_logs: Array<{
    type: string;
    action: string;
    description: string;
    timestamp: string;
    user: string;
  }>;
}

export interface ContactRequest {
  id: number;
  institution_name: string;
  institution_type: string;
  institution_type_display?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  request_type: string;
  request_type_display?: string;
  message?: string;
  status: 'pending' | 'contacted' | 'demo_scheduled' | 'completed' | 'archived';
  status_display?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  action_type: string;
  action_type_display: string;
  description: string;
  user: {
    id: number;
    username: string;
    full_name: string;
    role: string;
  } | null;
  institution: {
    id: number;
    username: string;
    full_name: string;
  } | null;
  department: string | null;
  related_object_type: string | null;
  related_object_id: number | null;
  metadata: Record<string, any>;
  created_at: string;
  time_ago: string;
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
    // Ensure endpoint starts with / if not already
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${normalizedEndpoint}`;
    const token = TokenManager.getAccessToken();
    const method = options.method || 'GET';
    
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Client] ${method} ${url}`);
    }
    
    // Store endpoint for error handling
    const requestEndpoint = normalizedEndpoint;

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
            // If retry also fails with 401, check if it's a super admin endpoint
            // Super admin endpoints might return 401 for permission issues, not auth issues
            const isSuperAdminEndpoint = requestEndpoint.includes('/super-admin/');
            if (retryResponse.status === 401 && !isSuperAdminEndpoint && method !== 'DELETE') {
              TokenManager.clearTokens();
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
              throw new Error('Authentication failed');
            }
            // Try to get error message from response
            let errorMessage = `Request failed: ${retryResponse.status} ${retryResponse.statusText}`;
            try {
              const errorData = await retryResponse.json();
              errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage;
            } catch {
              const errorText = await retryResponse.text();
              if (errorText) {
                errorMessage = errorText.substring(0, 200);
              }
            }
            throw new Error(errorMessage);
          }
          try {
            return await retryResponse.json();
          } catch {
            throw new Error('Invalid JSON response from server');
          }
        } else {
          // Refresh failed, but only logout if it's not a DELETE or super admin request
          // DELETE requests and super admin endpoints might return 401 for permission issues, not auth issues
          const isSuperAdminEndpoint = requestEndpoint.includes('/super-admin/');
          if (method !== 'DELETE' && !isSuperAdminEndpoint) {
            TokenManager.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            throw new Error('Authentication failed');
          } else {
            // For super admin endpoints or DELETE requests, don't logout
            // Just throw a more descriptive error
            const errorMsg = isSuperAdminEndpoint 
              ? 'Permission denied. Please ensure you have super admin access.'
              : 'Request failed. Please check your permissions.';
            throw new Error(errorMsg);
          }
        }
      }

      // Handle 204 No Content (common for DELETE requests)
      if (response.status === 204) {
        return { success: true } as T;
      }

      // Handle 200 OK for DELETE requests (some APIs return 200 with success message)
      if (response.status === 200 && method === 'DELETE') {
        try {
          const data = await response.json();
          return data;
        } catch {
          // If no JSON, return success
          return { success: true } as T;
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
            // For super admin endpoints, don't logout on 401 - it might be a permission issue
            const isSuperAdminEndpoint = requestEndpoint.includes('/super-admin/');
            if (response.status === 401 && !isSuperAdminEndpoint && method !== 'DELETE') {
              // Only logout for non-super-admin, non-DELETE requests
              TokenManager.clearTokens();
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
              throw new Error(errorMessage || 'Authentication failed. Please log in again.');
            }
            throw new Error(errorMessage);
          }
          
          // Check for errors object (Django REST Framework validation errors)
          if (data?.errors && typeof data.errors === 'object') {
            // Return errors object for form validation
            throw new Error(JSON.stringify({ errors: data.errors }));
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
        
        // Check if this is a super admin endpoint
        const isSuperAdminEndpoint = requestEndpoint?.includes('/super-admin/');
        
        // Clean up error messages that might contain HTML or be objects
        let cleanMessage = '';
        if (error.message) {
          if (typeof error.message === 'string') {
            cleanMessage = error.message;
          } else if (typeof error.message === 'object' && error.message !== null) {
            // Try to extract meaningful error from object
            try {
              // Check if it's a structured error object
              const messageObj = error.message as Record<string, any>;
              if (
                'message' in messageObj &&
                typeof messageObj.message === 'string'
              ) {
                cleanMessage = messageObj.message;
              } else if (
                'error' in messageObj &&
                typeof messageObj.error === 'string'
              ) {
                cleanMessage = messageObj.error;
              } else if (
                'detail' in messageObj &&
                typeof messageObj.detail === 'string'
              ) {
                cleanMessage = messageObj.detail;
              } else {
                // Try to stringify the message object
                cleanMessage = JSON.stringify(error.message);
              }
            } catch {
              cleanMessage = String(error.message);
            }
          } else {
            cleanMessage = String(error.message);
          }
        } else if (typeof error === 'string') {
          cleanMessage = error;
        } else if (error && typeof error === 'object') {
          // Try to extract error message from object
          try {
            // Check for common error object structures
            if ('message' in error && typeof error.message === 'string') {
              cleanMessage = error.message;
            } else if ('error' in error && typeof error.error === 'string') {
              cleanMessage = error.error;
            } else if ('detail' in error && typeof error.detail === 'string') {
              cleanMessage = error.detail;
            } else {
              cleanMessage = JSON.stringify(error);
            }
          } catch {
            cleanMessage = 'An unknown error occurred';
          }
        } else {
          cleanMessage = 'An unknown error occurred';
        }
        
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
        
        // Don't log authentication/permission errors for super admin endpoints (they might be permission issues)
        if (!isAuthError) {
          // Ensure cleanMessage is a string before logging
          let logMessage = cleanMessage;
          if (typeof cleanMessage !== 'string') {
            try {
              logMessage = JSON.stringify(cleanMessage);
            } catch {
              logMessage = String(cleanMessage);
            }
          }
          
          if (isSuperAdminEndpoint) {
            // For super admin endpoints, only log if it's not a permission/auth issue
            if (!logMessage.toLowerCase().includes('permission') && 
                !logMessage.toLowerCase().includes('authentication') &&
                !logMessage.toLowerCase().includes('unauthorized') &&
                !logMessage.toLowerCase().includes('401')) {
              console.error('API Error:', logMessage);
            }
          } else {
            console.error('API Error:', logMessage);
          }
        }
        
        // Update error message if it was cleaned
        if (cleanMessage !== error.message) {
          throw new Error(cleanMessage);
        }
        throw error;
      }
      
      // Handle unknown errors - convert to string properly
      let errorMessage = 'An unexpected error occurred';
      if (error && typeof error === 'object') {
        try {
          // Try to extract meaningful error info from object
          if ('message' in error && typeof error.message === 'string') {
            errorMessage = error.message;
          } else if ('error' in error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else {
            // Try to stringify the error object
            errorMessage = JSON.stringify(error);
          }
        } catch {
          // If JSON.stringify fails, use a generic message
          errorMessage = 'An unexpected error occurred';
        }
      } else if (error) {
        errorMessage = String(error);
      }
      
      // Include endpoint info if available
      const endpointInfo = requestEndpoint ? ` on ${method} ${requestEndpoint}` : '';
      console.error('API Error:', errorMessage);
      throw new Error(`${errorMessage}${endpointInfo}. Please check the console for details.`);
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

  async forgotPassword(data: { username?: string; email?: string }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await this.request<{ success: boolean; message?: string; error?: string }>('/auth/forgot-password/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error: any) {
      // Handle error properly - extract message from error object
      let errorMessage = 'Failed to process password reset request. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        // Try to extract error message from object
        if ('error' in error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('detail' in error && typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else {
          // If it's an object but we can't extract a message, stringify it
          try {
            const errorStr = JSON.stringify(error);
            // Only use stringified version if it's not just "[object Object]"
            if (errorStr && errorStr !== '{}' && !errorStr.includes('[object')) {
              errorMessage = errorStr;
            }
          } catch {
            // If stringify fails, use default message
          }
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Return error response in expected format
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async forgotUsername(data: { email: string }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await this.request<{ success: boolean; message?: string; error?: string }>('/auth/forgot-username/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error: any) {
      // Handle error properly - extract message from error object
      let errorMessage = 'Failed to process username recovery request. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        // Try to extract error message from object
        if ('error' in error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('detail' in error && typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else {
          // If it's an object but we can't extract a message, stringify it
          try {
            const errorStr = JSON.stringify(error);
            // Only use stringified version if it's not just "[object Object]"
            if (errorStr && errorStr !== '{}' && !errorStr.includes('[object')) {
              errorMessage = errorStr;
            }
          } catch {
            // If stringify fails, use default message
          }
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Return error response in expected format
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getUsers(params?: { role?: string; search?: string; department?: string }): Promise<User[]> {
    const query = new URLSearchParams();
    if (params?.role) {
      query.append('role', params.role);
    }
    if (params?.search) {
      query.append('search', params.search);
    }
    if (params?.department) {
      query.append('department', params.department);
    }
    const endpoint = `/users/${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await this.request<any>(endpoint);
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results;
    }
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  }


  async getTeachers(params?: { search?: string }): Promise<User[]> {
    const query = new URLSearchParams({ role: 'TEACHER' });
    if (params?.search) {
      query.append('search', params.search);
    }
    
    // Handle pagination - fetch all pages
    let allTeachers: User[] = [];
    let page = 1;
    let hasNext = true;
    
    while (hasNext) {
      const pageQuery = new URLSearchParams(query);
      pageQuery.append('page', page.toString());
      const endpoint = `/users/?${pageQuery.toString()}`;
      const response = await this.request<any>(endpoint);
      
      if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
        allTeachers = [...allTeachers, ...response.results];
        // Check if there's a next page
        hasNext = !!response.next;
        page++;
      } else if (Array.isArray(response)) {
        // If response is directly an array (no pagination)
        allTeachers = [...allTeachers, ...response];
        hasNext = false;
      } else {
        hasNext = false;
      }
    }
    
    return allTeachers;
  }

  async getStudents(params?: { search?: string; department?: string }): Promise<User[]> {
    const query = new URLSearchParams({ role: 'STUDENT' });
    if (params?.search) {
      query.append('search', params.search);
    }
    if (params?.department) {
      query.append('department', params.department);
    }
    
    // Handle pagination - fetch all pages
    let allStudents: User[] = [];
    let page = 1;
    let hasNext = true;
    
    while (hasNext) {
      const pageQuery = new URLSearchParams(query);
      pageQuery.append('page', page.toString());
      const endpoint = `/users/?${pageQuery.toString()}`;
      const response = await this.request<any>(endpoint);
      
      if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
        allStudents = [...allStudents, ...response.results];
        // Check if there's a next page
        hasNext = !!response.next;
        page++;
      } else if (Array.isArray(response)) {
        // If response is directly an array (no pagination)
        allStudents = [...allStudents, ...response];
        hasNext = false;
      } else {
        hasNext = false;
      }
    }
    
    return allStudents;
  }

  async createTeacher(data: {
    first_name: string;
    last_name: string;
    email: string;
    department?: string;
  }): Promise<User> {
    // Backend generates a temporary password and emails it to the teacher.
    return await this.request<User>('/teachers/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createStudent(data: {
    email: string;
    first_name?: string;
    last_name?: string;
    department?: string;
    student_id?: string;
    year_of_study?: number;
  }): Promise<{ success: boolean; student: User; email_sent?: boolean; email_warning?: string; email_error?: string; credentials?: { username: string; password: string; email: string; student_id: string } }> {
    return await this.request('/students/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkImportStudents(file: FormData): Promise<{ success: boolean; created?: number; updated?: number; errors?: string[]; error?: { message: string } }> {
    const token = TokenManager.getAccessToken();
    const endpoint = `${API_BASE_URL}/bulk/import/students/`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: file, // Don't set Content-Type, let browser set it with boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: `Request failed with status ${response.status}` } }));
      throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  }

  async deleteTeacher(teacherId: number): Promise<void> {
    await this.request(`/users/${teacherId}/`, {
      method: 'DELETE',
    });
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

  async getContactRequests(params?: { status?: string; search?: string }): Promise<ContactRequest[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();
    // Django REST Framework expects trailing slash for ViewSet list endpoints
    const endpoint = `/contact-requests/${queryString ? `?${queryString}` : ''}`;
    console.log('🔵 Fetching contact requests from:', `${this.baseUrl}${endpoint}`);
    try {
      const response = await this.request<ContactRequest[]>(endpoint);
      console.log('🔵 API Response type:', typeof response, 'Is Array:', Array.isArray(response));
      console.log('🔵 API Response:', response);
      // Ensure we always return an array
      if (Array.isArray(response)) {
        console.log(`✅ Returning ${response.length} contact requests`);
        return response;
      } else if (response && typeof response === 'object') {
        // Sometimes DRF returns objects, try to extract array
        console.warn('⚠️ Response is not an array, attempting to extract:', response);
        // Check if it's a paginated response
        const responseObj = response as { results?: ContactRequest[] };
        if ('results' in responseObj && Array.isArray(responseObj.results)) {
          console.log('✅ Found paginated response, returning results array');
          return responseObj.results;
        }
        return [];
      }
      console.warn('⚠️ Response is not an array or object, returning empty array');
      return [];
    } catch (error: any) {
      console.error('❌ Error fetching contact requests:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      // If it's a 403 or 401, user might not have permission
      if (error.message?.includes('403') || error.message?.includes('401')) {
        throw new Error('You do not have permission to view contact requests. Make sure you are logged in as superuser.');
      }
      throw error;
    }
  }

  async updateContactRequest(id: number, data: Partial<ContactRequest>): Promise<ContactRequest> {
    return await this.request<ContactRequest>(`/contact-requests/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
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
  async getProgramOutcomes(params?: { department?: string }): Promise<ProgramOutcome[]> {
    const queryParams = new URLSearchParams();
    if (params?.department) {
      queryParams.append('department', params.department);
    }
    const queryString = queryParams.toString();
    const endpoint = `/program-outcomes/${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<ProgramOutcome[]>(endpoint);
    // Ensure response is an array (ViewSet returns array directly)
    return Array.isArray(response) ? response : [];
  }

  async getProgramOutcome(id: number): Promise<ProgramOutcome> {
    return await this.request<ProgramOutcome>(`/program-outcomes/${id}/`);
  }

  async createProgramOutcome(data: Partial<ProgramOutcome>): Promise<ProgramOutcome> {
    return await this.request<ProgramOutcome>('/program-outcomes/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProgramOutcome(id: number, data: Partial<ProgramOutcome>): Promise<ProgramOutcome> {
    return await this.request<ProgramOutcome>(`/program-outcomes/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patchProgramOutcome(id: number, data: Partial<ProgramOutcome>): Promise<ProgramOutcome> {
    return await this.request<ProgramOutcome>(`/program-outcomes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProgramOutcome(id: number): Promise<void> {
    return await this.request<void>(`/program-outcomes/${id}/`, {
      method: 'DELETE',
    });
  }

  // Learning Outcomes
  async getLearningOutcomes(params?: { course?: number }): Promise<LearningOutcome[]> {
    const queryParams = new URLSearchParams();
    if (params?.course) queryParams.append('course', params.course.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/learning-outcomes/${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<any>(endpoint);
    
    // Handle paginated response (DRF returns { results: [...] })
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results;
    }
    // If it's already an array, return as is
    if (Array.isArray(response)) {
      return response;
    }
    // Fallback: return empty array
    console.warn('⚠️ API: Unexpected response format from getLearningOutcomes:', response);
    return [];
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

  async createCourse(data: Partial<Course>): Promise<Course> {
    return await this.request<Course>('/courses/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourse(id: number, data: Partial<Course>): Promise<Course> {
    return await this.request<Course>(`/courses/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patchCourse(id: number, data: Partial<Course>): Promise<Course> {
    return await this.request<Course>(`/courses/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(id: number): Promise<void> {
    return await this.request<void>(`/courses/${id}/`, {
      method: 'DELETE',
    });
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
    const queryParams = new URLSearchParams();
    if (params?.student) queryParams.append('student', params.student.toString());
    if (params?.program_outcome) queryParams.append('program_outcome', params.program_outcome.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/po-achievements/${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<any>(endpoint);
    
    // Handle paginated response (DRF returns { results: [...] })
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results;
    }
    // If it's already an array, return as is
    if (Array.isArray(response)) {
      return response;
    }
    // Fallback: return empty array
    console.warn('⚠️ API: Unexpected response format from getPOAchievements:', response);
    return [];
  }

  // LO Achievements
  async getLOAchievements(params?: { student?: number; learning_outcome?: number; course?: number }): Promise<StudentLOAchievement[]> {
    const queryParams = new URLSearchParams();
    if (params?.student) queryParams.append('student', params.student.toString());
    if (params?.learning_outcome) queryParams.append('learning_outcome', params.learning_outcome.toString());
    if (params?.course) queryParams.append('course', params.course.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/lo-achievements/${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<any>(endpoint);
    
    // Handle paginated response (DRF returns { results: [...] })
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results;
    }
    // If it's already an array, return as is
    if (Array.isArray(response)) {
      return response;
    }
    // Fallback: return empty array
    return [];
  }

  // Assessments
  async getAssessments(params?: { course?: number }): Promise<Assessment[]> {
    const queryParams = new URLSearchParams();
    if (params?.course) queryParams.append('course', params.course.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/assessments/${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<any>(endpoint);
    
    // Handle paginated response (DRF returns { results: [...] })
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results;
    }
    // If it's already an array, return as is
    if (Array.isArray(response)) {
      return response;
    }
    // Fallback: return empty array
    console.warn('⚠️ API: Unexpected response format from getAssessments:', response);
    return [];
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

  async getCourseAnalyticsDetail(
    courseId: number,
    filters?: {
      instructor?: string;
      section?: string;
      attempt?: 'first' | 'retake' | 'all';
      semester?: string;
    }
  ): Promise<{
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
    const params = new URLSearchParams();
    if (filters) {
      if (filters.instructor && filters.instructor !== 'all') {
        params.append('instructor', filters.instructor);
      }
      if (filters.section && filters.section !== 'all') {
        params.append('section', filters.section);
      }
      if (filters.attempt && filters.attempt !== 'all') {
        params.append('attempt', filters.attempt);
      }
      if (filters.semester && filters.semester !== 'all') {
        params.append('semester', filters.semester);
      }
    }
    const queryString = params.toString();
    const url = `/course-analytics/${courseId}/${queryString ? `?${queryString}` : ''}`;
    return await this.request(url);
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

  // Departments
  async getDepartments(): Promise<Array<{
    name: string;
    students: number;
    courses: number;
    faculty: number;
    avg_grade: number | null;
    po_achievement: number | null;
    status: 'excellent' | 'good' | 'needs-attention';
  }>> {
    const response = await this.request<{
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
    }>('/analytics/departments/');
    return response.departments || [];
  }

  // Department Curriculum
  // Departments CRUD
  async getDepartmentsList(): Promise<Array<{
    id: number;
    name: string;
    code?: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
    created_at: string;
    updated_at: string;
  }>> {
    const response = await this.request<any>('/departments/');
    // Handle paginated response
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results;
    }
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  }

  async getDepartment(id: number): Promise<{
    id: number;
    name: string;
    code?: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
    created_at: string;
    updated_at: string;
  }> {
    return await this.request(`/departments/${id}/`);
  }

  async createDepartment(data: {
    name: string;
    code?: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
  }): Promise<{
    id: number;
    name: string;
    code?: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
    created_at: string;
    updated_at: string;
  }> {
    return await this.request('/departments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id: number, data: Partial<{
    name: string;
    code?: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
  }>): Promise<{
    id: number;
    name: string;
    code?: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
    created_at: string;
    updated_at: string;
  }> {
    return await this.request(`/departments/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patchDepartment(id: number, data: Partial<{
    name: string;
    code?: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
  }>): Promise<{
    id: number;
    name: string;
    code?: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
    created_at: string;
    updated_at: string;
  }> {
    return await this.request(`/departments/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(id: number): Promise<void> {
    return await this.request(`/departments/${id}/`, {
      method: 'DELETE',
    });
  }

  async getDepartmentCurriculum(department: string): Promise<{
    success: boolean;
    department: string;
    curriculum: Array<{
      year: number;
      fall_semester: Array<{
        course_id: number;
        course_code: string;
        course_name: string;
        credits: number;
        semester: string;
        academic_year: string;
        teacher: string;
        enrollment_count: number;
        description: string;
      }>;
      spring_semester: Array<{
        course_id: number;
        course_code: string;
        course_name: string;
        credits: number;
        semester: string;
        academic_year: string;
        teacher: string;
        enrollment_count: number;
        description: string;
      }>;
      summer_semester: Array<{
        course_id: number;
        course_code: string;
        course_name: string;
        credits: number;
        semester: string;
        academic_year: string;
        teacher: string;
        enrollment_count: number;
        description: string;
      }>;
      total_credits_fall: number;
      total_credits_spring: number;
      total_credits_summer: number;
    }>;
    total_credits: number;
    total_years: number;
  }> {
    const queryParams = new URLSearchParams({ department });
    return await this.request(`/analytics/department-curriculum/?${queryParams.toString()}`);
  }

  // Super Admin Dashboard
  async getSuperAdminDashboard(): Promise<SuperAdminDashboardData> {
    return await this.request<SuperAdminDashboardData>('/dashboard/super-admin/');
  }

  // Super Admin Institutions
  async getSuperAdminInstitutions(): Promise<{
    institutions: Institution[];
    summary: {
      total_institutions: number;
      total_students: number;
      total_teachers: number;
      total_courses: number;
    };
  }> {
    return await this.request<{
      institutions: Institution[];
      summary: {
        total_institutions: number;
        total_students: number;
        total_teachers: number;
        total_courses: number;
      };
    }>('/super-admin/institutions/');
  }

  // Create Institution
  async createInstitution(data: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    institution_name: string;
    institution_type?: string;
    department?: string;
    address?: string;
    city?: string;
    country?: string;
    website?: string;
    description?: string;
  }): Promise<{ success: boolean; message?: string; institution?: Institution; errors?: any }> {
    try {
      const response = await this.request<{ success: boolean; message?: string; institution?: Institution; errors?: any }>('/super-admin/institutions/create/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error: any) {
      // If error message contains JSON with errors, parse it
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.errors) {
          return {
            success: false,
            errors: errorData.errors
          };
        }
      } catch {
        // Not JSON, continue with normal error handling
      }
      
      // If it's a validation error about email, return it with errors structure
      if (error.message && (error.message.includes('email') || error.message.includes('already exists'))) {
        return {
          success: false,
          errors: {
            email: ['This email is already in use. Please use a different email address.']
          }
        };
      }
      
      // Return error in expected format
      return {
        success: false,
        errors: {
          non_field_errors: [error.message || 'Failed to create institution']
        }
      };
    }
  }

  // Delete Institution
  async resetInstitutionPassword(institutionId: number): Promise<{ success: boolean; message?: string; email_sent?: boolean; error?: string; credentials?: { username: string; password: string } }> {
    const response = await this.request(`/super-admin/institutions/${institutionId}/reset-password/`, {
      method: 'POST',
    });
    return response as { success: boolean; message?: string; email_sent?: boolean; error?: string; credentials?: { username: string; password: string } };
  }

  async deleteInstitution(institutionId: number): Promise<{ success: boolean; message?: string; error?: string }> {
    return await this.request(`/super-admin/institutions/${institutionId}/`, {
      method: 'DELETE',
    });
  }

  // Super Admin Activity Logs
  async getSuperAdminActivityLogs(params?: {
    institution_id?: number;
    action_type?: string;
    department?: string;
    search?: string;
    limit?: number;
  }): Promise<{ success: boolean; logs: ActivityLog[]; count: number }> {
    const queryParams = new URLSearchParams();
    if (params?.institution_id) queryParams.append('institution_id', params.institution_id.toString());
    if (params?.action_type) queryParams.append('action_type', params.action_type);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    let endpoint = '/super-admin/activity-logs/';
    if (queryString) {
      endpoint += `?${queryString}`;
    }
    return await this.request<{ success: boolean; logs: ActivityLog[]; count: number }>(endpoint);
  }

  // Assessment-LO Mappings
  async getAssessmentLOs(params?: { assessment?: number; learning_outcome?: number; courseId?: number; course?: number }): Promise<AssessmentLO[]> {
    const queryParams = new URLSearchParams();
    if (params?.assessment) queryParams.append('assessment', params.assessment.toString());
    if (params?.learning_outcome) queryParams.append('learning_outcome', params.learning_outcome.toString());
    if (params?.courseId) queryParams.append('courseId', params.courseId.toString());
    if (params?.course) queryParams.append('courseId', params.course.toString());
    
    const queryString = queryParams.toString();
    let endpoint = '/assessment-los/';
    if (queryString) {
      endpoint += `?${queryString}`;
    }
    const response = await this.request<any>(endpoint);
    // Handle paginated response (DRF returns { results: [...] })
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results;
    }
    // If it's already an array, return as is
    if (Array.isArray(response)) {
      return response;
    }
    // Fallback: return empty array
    return [];
  }

  async createAssessmentLO(data: Partial<AssessmentLO>): Promise<AssessmentLO> {
    return await this.request<AssessmentLO>('/assessment-los/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssessmentLO(id: number, data: Partial<AssessmentLO>): Promise<AssessmentLO> {
    return await this.request<AssessmentLO>(`/assessment-los/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAssessmentLO(id: number): Promise<void> {
    return await this.request(`/assessment-los/${id}/`, {
      method: 'DELETE',
    });
  }

  // LO-PO Mappings
  async getLOPOs(params?: { learning_outcome?: number; program_outcome?: number; courseId?: number; course?: number }): Promise<LOPO[]> {
    const queryParams = new URLSearchParams();
    if (params?.learning_outcome) queryParams.append('learning_outcome', params.learning_outcome.toString());
    if (params?.program_outcome) queryParams.append('program_outcome', params.program_outcome.toString());
    if (params?.courseId) queryParams.append('courseId', params.courseId.toString());
    if (params?.course) queryParams.append('courseId', params.course.toString());
    
    const queryString = queryParams.toString();
    let endpoint = '/lo-pos/';
    if (queryString) {
      endpoint += `?${queryString}`;
    }
    const response = await this.request<any>(endpoint);
    // Handle paginated response (DRF returns { results: [...] })
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results;
    }
    // If it's already an array, return as is
    if (Array.isArray(response)) {
      return response;
    }
    // Fallback: return empty array
    return [];
  }

  async createLOPO(data: Partial<LOPO>): Promise<LOPO> {
    return await this.request<LOPO>('/lo-pos/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLOPO(id: number, data: Partial<LOPO>): Promise<LOPO> {
    return await this.request<LOPO>(`/lo-pos/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteLOPO(id: number): Promise<void> {
    return await this.request(`/lo-pos/${id}/`, {
      method: 'DELETE',
    });
  }
}

export interface Institution {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  department?: string;
  phone?: string;
  is_active: boolean;
  is_superuser?: boolean;  // Flag to prevent deletion of super admin accounts
  date_joined: string;
  last_login?: string | null;
  login_status: 'never' | 'today' | 'recent' | 'month' | 'old';
  student_count: number;
  teacher_count: number;
  course_count: number;
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Export token manager for auth checks
export { TokenManager };

