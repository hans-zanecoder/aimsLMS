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
}

export interface CreateProgramData {
  name: string;
  description?: string;
  durationValue?: string;
  durationUnit?: string;
  icon?: string | null;
  instructionModes?: string[];
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
  }
};

export default programsApi; 