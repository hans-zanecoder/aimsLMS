import { getAuthToken } from '@/utils/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

export interface UserSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio?: string;
}

export const getUserSettings = async (): Promise<UserSettings> => {
  const response = await fetch(`${API_URL}/user/settings`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user settings');
  }
  
  return response.json();
};

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  const response = await fetch(`${API_URL}/user/settings`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update user settings');
  }
  
  return response.json();
}; 