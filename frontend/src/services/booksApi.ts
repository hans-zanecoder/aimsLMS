import { Book } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

export const booksApi = {
  // Get all books
  getAll: async (params?: { programId?: string; isPublished?: boolean; search?: string }): Promise<Book[]> => {
    try {
      // Build query string from params
      let queryString = '';
      if (params) {
        const queryParams = new URLSearchParams();
        if (params.programId) queryParams.append('programId', params.programId);
        if (params.isPublished !== undefined) queryParams.append('isPublished', String(params.isPublished));
        if (params.search) queryParams.append('search', params.search);
        queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      }
      
      const response = await fetch(`${API_URL}/books${queryString}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  },

  // Get student's books
  getStudentBooks: async (): Promise<Book[]> => {
    try {
      const response = await fetch(`${API_URL}/books/student`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching student books:', error);
      throw error;
    }
  },

  // Get book by ID
  getById: async (id: string): Promise<Book> => {
    try {
      const response = await fetch(`${API_URL}/books/${id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching book ${id}:`, error);
      throw error;
    }
  },

  // Create a new book
  create: async (formData: FormData): Promise<Book> => {
    try {
      const response = await fetch(`${API_URL}/books`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating book:', error);
      throw error;
    }
  },

  // Update a book
  update: async (id: string, formData: FormData): Promise<Book> => {
    try {
      const response = await fetch(`${API_URL}/books/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating book ${id}:`, error);
      throw error;
    }
  },

  // Delete a book
  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/books/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting book ${id}:`, error);
      throw error;
    }
  }
}; 