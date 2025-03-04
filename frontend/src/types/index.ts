export interface User {
  id: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  department?: string;
  joinDate?: string;
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  department: string;
  enrollmentDate: string;
  coursesEnrolled: number;
  coursesList: CourseInfo[];
  status: 'Active' | 'Inactive' | 'Pending';
  progress: number;
}

export interface CourseInfo {
  id: string;
  title: string;
}

export interface Lesson {
  title: string;
  content: string;
  duration: number;
  resourcesUrls: string[];
}

export interface Module {
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  category: string;
  image?: string;
  duration: number;
  modules: Module[];
  enrolledStudents: string[];
  status: 'Draft' | 'Published' | 'Archived';
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  message: string;
}

export interface LoginResponse {
  user: User;
}

export interface MessageResponse {
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  link?: string;
}

export interface StatCard {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  trend?: string;
  trendUp?: boolean | null;
  description?: string;
} 