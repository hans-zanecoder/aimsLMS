import axios from 'axios';

interface Course {
  _id: string;
  title: string;
  description: string;
  instructorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  category: string;
  duration: number;
  status: string;
  level: string;
  image: string | null;
  averageRating: number;
  totalEnrollment: number;
  modules: any[];
  startDate?: string;
  endDate?: string;
  progress?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const coursesApi = {
  // Get all courses
  getAllCourses: async (params?: {
    status?: string;
    category?: string;
    instructor?: string;
    level?: string;
    search?: string;
    featured?: boolean;
    sortBy?: string;
  }): Promise<Course[]> => {
    try {
      const response = await axios.get(`${API_URL}/courses`, { params, withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  // Get course by ID
  getCourseById: async (id: string): Promise<Course> => {
    try {
      const response = await axios.get(`${API_URL}/courses/${id}`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  },

  // Get featured courses
  getFeaturedCourses: async (): Promise<Course[]> => {
    try {
      const response = await axios.get(`${API_URL}/courses/featured`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error fetching featured courses:', error);
      throw error;
    }
  },

  // Get enrolled courses for current user
  getEnrolledCourses: async (): Promise<Course[]> => {
    try {
      const response = await axios.get(`${API_URL}/courses/enrolled`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      throw error;
    }
  },

  // Enroll in a course
  enrollInCourse: async (courseId: string): Promise<any> => {
    try {
      const response = await axios.post(`${API_URL}/courses/${courseId}/enroll`, {}, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }
};

export type { Course }; 