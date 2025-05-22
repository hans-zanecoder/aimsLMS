export interface UserSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  bio: string;
}

// Mock data for development
const mockUserSettings: UserSettings = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1 234 567 8900',
  department: 'Computer Science',
  bio: 'Experienced educator with a passion for teaching.'
};

export async function getUserSettings(): Promise<UserSettings> {
  try {
    const response = await fetch('/api/user/settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // This ensures cookies are sent with the request
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user settings:', error);
    throw error;
  }
}

export async function updateUserSettings(settings: UserSettings): Promise<void> {
  try {
    const response = await fetch('/api/user/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error('Failed to update user settings');
    }
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
} 