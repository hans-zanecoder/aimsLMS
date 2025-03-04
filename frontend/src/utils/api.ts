const API_URL = '/api';

// Import types
import { User, LoginResponse, MessageResponse, Student, Course } from '../types';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
  retries?: number;
}

/**
 * Custom API error class with additional information
 */
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Generic API request function with retry mechanism
 */
export async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    credentials = 'include',
    retries = 1, // Default to 1 retry
  } = options;

  let lastError: Error | null = null;
  
  // Try the request up to retries + 1 times
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        credentials,
      };

      if (body) {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_URL}/${endpoint}`, requestOptions);

      if (!response.ok) {
        let errorMessage = `API error: ${response.status}`;
        let errorData = {};
        
        try {
          errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        throw new ApiError(errorMessage, response.status, errorData);
      }

      // If the response is 204 No Content, return empty object as data
      if (response.status === 204) {
        return {} as T;
      }
      
      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If it's a network error and we have retries left, wait and retry
      if (!(error instanceof ApiError) && attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff with max 10s
        console.log(`API request failed, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // No more retries or it's a server error, throw the error
      throw lastError;
    }
  }

  // This should never happen due to the logic above, but TypeScript requires it
  throw lastError || new Error('Unknown API error');
}

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    apiRequest<LoginResponse>('auth/login', { 
      method: 'POST', 
      body: { email, password } 
    }),
  
  logout: () => 
    apiRequest<MessageResponse>('auth/logout', { 
      method: 'POST' 
    }),
  
  me: () => 
    apiRequest<User>('auth/me'),
  
  updateProfile: (data: Partial<User>) => 
    apiRequest<User>('auth/profile', { 
      method: 'PUT', 
      body: data 
    }),
    
  refreshToken: () => 
    apiRequest<MessageResponse>('auth/refresh-token', { 
      method: 'POST' 
    }),
};

// Students API
export const studentsApi = {
  getAll: () => 
    apiRequest<Student[]>('students'),
  
  getById: (id: string) => 
    apiRequest<Student>(`students/${id}`),
  
  create: (data: Partial<Student>) => 
    apiRequest<Student>('students', { 
      method: 'POST', 
      body: data 
    }),
  
  update: (id: string, data: Partial<Student>) => 
    apiRequest<Student>(`students/${id}`, { 
      method: 'PUT', 
      body: data 
    }),
  
  delete: (id: string) => 
    apiRequest<MessageResponse>(`students/${id}`, { 
      method: 'DELETE' 
    }),
  
  enroll: (id: string, courseId: string) => 
    apiRequest<Student>(`students/${id}/enroll`, { 
      method: 'POST', 
      body: { courseId } 
    }),
};

// Courses API
export const coursesApi = {
  getAll: (params?: { status?: string; category?: string; instructor?: string }) => {
    const query = params 
      ? Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&')
      : '';
    
    return apiRequest<Course[]>(`courses${query ? `?${query}` : ''}`);
  },
  
  getById: (id: string) => 
    apiRequest<Course>(`courses/${id}`),
  
  create: (data: Partial<Course>) => 
    apiRequest<Course>('courses', { 
      method: 'POST', 
      body: data 
    }),
  
  update: (id: string, data: Partial<Course>) => 
    apiRequest<Course>(`courses/${id}`, { 
      method: 'PUT', 
      body: data 
    }),
  
  delete: (id: string) => 
    apiRequest<MessageResponse>(`courses/${id}`, { 
      method: 'DELETE' 
    }),
  
  addModule: (id: string, moduleData: any) => 
    apiRequest<Course>(`courses/${id}/modules`, { 
      method: 'POST', 
      body: moduleData 
    }),
}; 