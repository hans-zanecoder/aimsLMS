export interface Program {
  _id: string;
  name: string;
  description: string;
  durationValue: string;
  durationUnit: string;
  icon: string | null;
  instructionModes: string[];
  createdAt: string;
  updatedAt: string;
  bookCount: number;
  videoCount: number;
  assignmentCount: number;
  enrolledCount?: number;
}

export interface Book {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  author: string;
  programId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  _id: string;
  title: string;
  description: string;
  embedCode: string;
  duration: number;
  thumbnail: string;
  programId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  programId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramData {
  name: string;
  description?: string;
  durationValue?: string;
  durationUnit?: string;
  icon?: string | null;
  instructionModes?: string[];
}

export interface EnrollmentStats {
  enrolledCount: number;
  completedCount: number;
  hoursStudied: number;
  assignmentsDue: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

export const programsApi = {
  // Get all programs
  getAll: async (): Promise<Program[]> => {
    try {
      const response = await fetch(`${API_URL}/programs`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching programs:', error);
      throw error;
    }
  },

  // Get a specific program by ID
  getById: async (id: string): Promise<Program> => {
    try {
      const response = await fetch(`${API_URL}/programs/${id}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching program ${id}:`, error);
      throw error;
    }
  },

  // Create a new program
  create: async (programData: CreateProgramData): Promise<Program> => {
    try {
      const response = await fetch(`${API_URL}/programs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(programData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating program:', error);
      throw error;
    }
  },

  // Update an existing program
  update: async (id: string, programData: Partial<CreateProgramData>): Promise<Program> => {
    try {
      const response = await fetch(`${API_URL}/programs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(programData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating program ${id}:`, error);
      throw error;
    }
  },

  // Delete a program
  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/programs/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting program ${id}:`, error);
      throw error;
    }
  },

  // Get books for a program
  getProgramBooks: async (programId: string): Promise<Book[]> => {
    try {
      const response = await fetch(`${API_URL}/programs/${programId}/books`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching books for program ${programId}:`, error);
      throw error;
    }
  },

  // Get videos for a program
  getProgramVideos: async (programId: string): Promise<Video[]> => {
    try {
      const response = await fetch(`${API_URL}/programs/${programId}/videos`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching videos for program ${programId}:`, error);
      throw error;
    }
  },

  // Get assignments for a program
  getProgramAssignments: async (programId: string): Promise<Assignment[]> => {
    try {
      const response = await fetch(`${API_URL}/programs/${programId}/assignments`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching assignments for program ${programId}:`, error);
      throw error;
    }
  },

  // Get enrollment statistics for the logged-in user
  getEnrollmentStats: async (): Promise<EnrollmentStats> => {
    try {
      const response = await fetch(`${API_URL}/programs/enrollment-stats`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching enrollment stats:', error);
      throw error;
    }
  },

  // Get enrolled programs for the logged-in user
  getEnrolledPrograms: async (): Promise<Program[]> => {
    try {
      const response = await fetch(`${API_URL}/programs/enrolled`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching enrolled programs:', error);
      throw error;
    }
  }
};

export default programsApi; 