const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Import types
import { User, LoginResponse, MessageResponse, Student, Course, Program, Instructor } from '../types';
import axios from 'axios';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  isFormData?: boolean;
  credentials?: RequestCredentials;
  retries?: number;
}

/**
 * Custom API error class with additional information
 */
export class ApiError extends Error {
  status: number;
  data: any;
  validationErrors?: Array<{field: string, message: string}>;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    
    // Extract validation errors if they exist
    if (data && data.errors && Array.isArray(data.errors)) {
      this.validationErrors = data.errors;
    }
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
    isFormData = false,
    credentials = 'include',
    retries = 2, // Increase default to 2 retries
  } = options;

  let lastError: Error | null = null;
  
  // Try the request up to retries + 1 times
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const requestOptions: RequestInit = {
        method,
        headers: {
          // Only set Content-Type for non-FormData requests
          ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
          ...headers,
        },
        credentials,
      };

      if (body) {
        // For FormData, just pass the body directly
        // For regular requests, stringify the JSON
        requestOptions.body = isFormData ? body : JSON.stringify(body);
      }

      const response = await fetch(`${API_URL}/${endpoint}`, requestOptions);

      if (!response.ok) {
        let errorMessage = `API error: ${response.status}`;
        let errorData = {};
        
        try {
          errorData = await response.json();
          errorMessage = (errorData as any).message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        // Special handling for rate limiting
        if (response.status === 429) {
          // Add more descriptive message for rate limiting
          errorMessage = "Too many requests. Please try again later.";
          
          // If we have retries left, use exponential backoff with rate limit errors
          if (attempt < retries) {
            const retryAfter = response.headers.get('Retry-After');
            let delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(1000 * Math.pow(2, attempt + 2), 15000);
            console.log(`Rate limited, retrying in ${delay}ms...`, errorData);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
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
      
      // If it's a network error or certain API errors, and we have retries left, wait and retry
      const isApiError = error instanceof ApiError;
      const isRetryableStatus = isApiError && (error.status >= 500 || error.status === 429);
      
      if ((!isApiError || isRetryableStatus) && attempt < retries) {
        // Calculate delay: exponential backoff with jitter
        const baseDelay = Math.min(1000 * Math.pow(2, attempt + 1), 15000);
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        
        console.log(`API request failed (${isApiError ? `Status ${(error as ApiError).status}` : 'Network error'}), retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // No more retries or it's a client error, throw the error
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
    
  unenroll: (id: string, courseId: string) => 
    apiRequest<Student>(`students/${id}/unenroll`, { 
      method: 'POST', 
      body: { courseId } 
    }),
};

// Courses API
export const coursesApi = {
  getAll: (params?: { status?: string; category?: string; instructor?: string; populate?: string }) => {
    const queryParams = params || {};
    
    // Add a parameter to ensure we always populate the instructor data
    queryParams.populate = 'instructorId,instructor';
    
    const query = Object.entries(queryParams)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');
    
    return apiRequest<Course[]>(`courses${query ? `?${query}` : ''}`);
  },
  
  getById: (id: string) => 
    apiRequest<Course>(`courses/${id}`),
  
  create: (data: Partial<Course> | FormData) => {
    // Check if we're dealing with FormData
    const isFormData = data instanceof FormData;
    
    return apiRequest<Course>('courses', { 
      method: 'POST', 
      body: data,
      isFormData
    });
  },
  
  update: (id: string, data: Partial<Course> | FormData) => {
    // Check if we're dealing with FormData
    const isFormData = data instanceof FormData;
    
    return apiRequest<Course>(`courses/${id}`, { 
      method: 'PUT', 
      body: data,
      isFormData
    });
  },
  
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

export const programsApi = {
  getAll: async (): Promise<Program[]> => {
    try {
      const response = await fetch(`${API_URL}/programs`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching programs:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Program> => {
    try {
      const response = await fetch(`${API_URL}/programs/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch program');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching program:', error);
      throw error;
    }
  },

  create: async (data: Omit<Program, '_id'>): Promise<Program> => {
    try {
      const response = await fetch(`${API_URL}/programs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to create program');
      }
      return response.json();
    } catch (error) {
      console.error('Error creating program:', error);
      throw error;
    }
  },

  update: async (id: string, data: Partial<Program>): Promise<Program> => {
    try {
      const response = await fetch(`${API_URL}/programs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to update program');
      }
      return response.json();
    } catch (error) {
      console.error('Error updating program:', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/programs/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to delete program');
      }
    } catch (error) {
      console.error('Error deleting program:', error);
      throw error;
    }
  },
};

export const instructorsApi = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/instructors`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch instructors');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching instructors:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/instructors/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch instructor');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching instructor:', error);
      throw error;
    }
  },

  create: async (data: Omit<Instructor, '_id'>) => {
    try {
      const response = await fetch(`${API_URL}/instructors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to create instructor');
      }
      return response.json();
    } catch (error) {
      console.error('Error creating instructor:', error);
      throw error;
    }
  },

  update: async (id: string, data: Partial<Instructor>) => {
    try {
      const response = await fetch(`${API_URL}/instructors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to update instructor');
      }
      return response.json();
    } catch (error) {
      console.error('Error updating instructor:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/instructors/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to delete instructor');
      }
    } catch (error) {
      console.error('Error deleting instructor:', error);
      throw error;
    }
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    try {
      const response = await apiRequest<any>('dashboard/stats');
      return response;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },
  
  getUserStats: async () => {
    try {
      // Fetch all users, students, and instructors
      const [users, students, instructors] = await Promise.all([
        apiRequest<any[]>('users'),
        apiRequest<any[]>('students'),
        apiRequest<any[]>('instructors')
      ]);
      
      // Count total platform users (all users + any students/instructors not in users table)
      const totalUsers = users.length;
      const studentUsers = students.filter(student => 
        !users.some(user => user._id === student.userId)
      ).length;
      const instructorUsers = instructors.filter(instructor => 
        !users.some(user => user._id === instructor._id)
      ).length;
      
      // Calculate true total users
      const platformTotalUsers = totalUsers + studentUsers + instructorUsers;
      
      // Count by role from users table
      const studentCount = users.filter(user => user.role === 'student').length;
      const instructorCount = users.filter(user => user.role === 'instructor').length;
      const adminCount = users.filter(user => user.role === 'admin').length;
      
      // Get month over month growth
      const thisMonth = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const thisMonthUsers = users.filter(user => 
        new Date(user.createdAt) <= thisMonth
      ).length;
      
      const lastMonthUsers = users.filter(user => 
        new Date(user.createdAt) <= lastMonth
      ).length;
      
      const growth = lastMonthUsers > 0 
        ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
        : '0';
      
      return {
        totalUsers: platformTotalUsers,
        students: studentCount + studentUsers,
        instructors: instructorCount + instructorUsers,
        admins: adminCount,
        growth: `${growth}%`,
        trendUp: parseFloat(growth) >= 0
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalUsers: 0,
        students: 0,
        instructors: 0,
        admins: 0,
        growth: '0%',
        trendUp: null
      };
    }
  },
  
  getCourseStats: async () => {
    try {
      // Fetch all courses
      const courses = await apiRequest<Course[]>('courses');
      
      // Get current date for comparing end dates
      const currentDate = new Date();
      
      // Count by status and end date
      const totalCourses = courses.length;
      // Active courses are those that are Published AND have not ended yet
      const activeCourses = courses.filter(course => 
        course.status === 'Published' && 
        (!course.endDate || new Date(course.endDate) >= currentDate)
      ).length;
      
      // Count completed courses (Published but end date has passed)
      const completedCourses = courses.filter(course => 
        course.status === 'Published' && 
        course.endDate && new Date(course.endDate) < currentDate
      ).length;
      
      const draftCourses = courses.filter(course => course.status === 'Draft').length;
      const archivedCourses = courses.filter(course => course.status === 'Archived').length;
      
      // Get week over week growth
      const thisWeek = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const newCourses = courses.filter(course => 
        new Date(course.createdAt) > lastWeek
      ).length;
      
      return {
        totalCourses,
        activeCourses,
        completedCourses,
        draftCourses,
        archivedCourses,
        newCourses,
        trendUp: newCourses > 0
      };
    } catch (error) {
      console.error('Error fetching course stats:', error);
      return {
        totalCourses: 0,
        activeCourses: 0,
        completedCourses: 0,
        draftCourses: 0,
        archivedCourses: 0,
        newCourses: 0,
        trendUp: null
      };
    }
  },
  
  getCampusStats: async () => {
    try {
      const courses = await apiRequest<Course[]>('courses');
      
      // Count unique campuses
      const campuses = new Set<string>();
      courses.forEach(course => {
        if (course.campus) {
          campuses.add(course.campus);
        }
      });
      
      // Override to return 2 locations as requested
      return {
        totalCampuses: 2,
        campuses: Array.from(campuses)
      };
    } catch (error) {
      console.error('Error fetching campus stats:', error);
      return {
        totalCampuses: 2, // Return 2 even on error
        campuses: []
      };
    }
  }
}; 