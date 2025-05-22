import { Instructor } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const instructorsApi = {
  getAll: async (): Promise<Instructor[]> => {
    const response = await fetch(`${API_URL}/instructors`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch instructors');
    }
    
    return response.json();
  },

  getById: async (id: string): Promise<Instructor> => {
    const response = await fetch(`${API_URL}/instructors/${id}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch instructor');
    }
    
    return response.json();
  },

  create: async (data: FormData): Promise<Instructor> => {
    const response = await fetch(`${API_URL}/instructors`, {
      method: 'POST',
      credentials: 'include',
      body: data, // FormData will automatically set the correct Content-Type
    });
    
    if (!response.ok) {
      throw new Error('Failed to create instructor');
    }
    
    return response.json();
  },

  update: async (id: string, data: FormData): Promise<Instructor> => {
    const response = await fetch(`${API_URL}/instructors/${id}`, {
      method: 'PUT',
      credentials: 'include',
      body: data, // FormData will automatically set the correct Content-Type
    });
    
    if (!response.ok) {
      throw new Error('Failed to update instructor');
    }
    
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/instructors/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete instructor');
    }
  },
}; 