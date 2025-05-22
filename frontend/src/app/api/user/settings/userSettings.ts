export interface UserSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  bio: string;
}

export async function getUserSettings(): Promise<UserSettings> {
  try {
    const response = await fetch('/api/user/settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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