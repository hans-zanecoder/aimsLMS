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
  campus?: string;
  practicalLocation?: string;
  paymentProfile?: {
    totalCost: number;
    downPayment: number;
    amountFinanced: number;
    paymentFrequency: 'weekly' | 'monthly';
    totalPayments: number;
    paymentAmount: number;
    paymentDates: string[];
    paymentHistory: {
      amount: number;
      date: string;
      remainingBalance: number;
    }[];
  };
}

export interface CourseInfo {
  id: string;
  title: string;
}

export interface CourseBasic {
  id: string;
  title: string;
  status?: string;
  category?: string;
  level?: string;
}

export interface Lesson {
  title: string;
  content: string;
  duration: number;
  resourcesUrls: string[];
  videoUrl?: string;
  isCompleted?: boolean;
}

export interface Module {
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Review {
  _id?: string;
  studentId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: string | { _id: string; firstName?: string; lastName?: string };
  program: string | { _id: string; name?: string };
  instructorId?: string | { _id: string; firstName?: string; lastName?: string };
  programId?: string | { _id: string; name?: string };
  language?: 'English' | 'Spanish';
  edstackID?: string;
  campus?: string;
  image: string;
  price: number;
  level: 'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'Draft' | 'Published' | 'Archived';
  isFeatured: boolean;
  category: string;
  modules: Module[];
  prerequisites: string[];
  learningObjectives: string[];
  tags: string[];
  courseId?: string;
  startDate?: string;
  endDate?: string;
  classDays?: string[];
  classStartTime?: string;
  classEndTime?: string;
  totalWeeks?: number;
  hoursPerWeek?: number;
  students?: string[] | { _id: string }[];
  createdAt: string;
  updatedAt: string;
  totalEnrollment?: number;
  averageRating?: number;
}

export interface CourseAudit {
  _id: string;
  courseId: string;
  edstackID?: string;
  userId: string | { 
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  actionType: 'create' | 'update' | 'delete';
  timestamp: string;
  previousData?: any;
  newData?: any;
  changedFields: string[];
  notes?: string;
}

export interface Program {
  _id: string;
  name: string;
  description: string;
  durationValue: number;
  durationUnit: string;
  icon: string;
  instructionModes: string[];
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

export interface Instructor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  startDate?: string; // YYYY-MM format, now optional
  profilePic?: string;
  programs?: string[] | Program[];
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  _id: string;
  title: string;
  description?: string;
  author?: string;
  programId: string | Program;
  bookType: 'pdf' | 'embed';
  pdfUrl?: string;
  embedCode?: string;
  embedHeight?: number;
  coverImage?: string;
  publishedDate: string;
  isPublished: boolean;
  additionalResources?: {
    title: string;
    url: string;
  }[];
  createdAt: string;
  updatedAt: string;
} 