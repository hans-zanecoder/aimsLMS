'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, ApiError } from '@/utils/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isRedirecting: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authOperationInProgress, setAuthOperationInProgress] = useState(false);
  const router = useRouter();

  // Function to safely perform navigation
  const safeNavigate = async (url: string) => {
    console.log('Attempting navigation to:', url);
    setIsRedirecting(true);

    try {
      console.log('Using Next.js router for navigation');
      
      // Start navigation
      router.push(url);
      
      // Instead of immediately checking, wait for navigation to complete
      // Try multiple times with increasing delays
      for (let i = 0; i < 3; i++) {
        console.log(`Navigation check attempt ${i + 1}`);
        
        // Wait with increasing delay (1s, 2s, 3s)
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
        
        // Get the current path without query parameters
        const currentPath = window.location.pathname;
        console.log('Current path:', currentPath, 'Expected path:', url);
        
        // Check if we've reached the target URL or if we're in a loading state
        if (currentPath === url) {
          console.log('Navigation successful');
          return;
        }
        
        // If we're still on the login page after multiple attempts, something's wrong
        if (i === 2 && currentPath === '/login') {
          throw new Error('Still on login page after multiple attempts');
        }
      }
      
      // If we get here, navigation didn't complete in time
      throw new Error('Navigation timeout - this might be due to slow network or server response');
      
    } catch (error) {
      console.error('Navigation error:', error);
      throw new Error(`Navigation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRedirecting(false);
    }
  };

  // Token refresh timer
  const setupTokenRefresh = useCallback(() => {
    // Refresh token every 23 hours to be safe (token lives for 24 hours)
    const refreshInterval = 23 * 60 * 60 * 1000;
    const intervalId = setInterval(async () => {
      try {
        if (user) {
          console.log('Refreshing auth token...');
          await authApi.refreshToken();
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If token refresh fails, user should re-login
        await logout();
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [user]);

  const checkUser = useCallback(async () => {
    if (authOperationInProgress) return;
    
    try {
      setAuthOperationInProgress(true);
      setLoading(true);
      const userData = await authApi.me();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error checking user session:', error);
      // Don't set an error here as this is a normal state during initial load
      setUser(null);
      return null;
    } finally {
      setLoading(false);
      setAuthOperationInProgress(false);
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    const cleanupFn = setupTokenRefresh();
    return cleanupFn;
  }, [setupTokenRefresh]);

  const login = async (email: string, password: string) => {
    if (authOperationInProgress) {
      throw new Error('Authentication operation already in progress');
    }
    
    try {
      setAuthOperationInProgress(true);
      setLoading(true);
      setError(null);
      
      console.log('Attempting login for:', email);
      const { user } = await authApi.login(email, password);
      
      console.log('Login API call successful, setting user state...');
      setUser(user);
      
      console.log('Login successful, user role:', user.role);
      
      // Give more time for the user state to be set
      await new Promise(resolve => setTimeout(resolve, 500));

      // Determine the dashboard path based on role
      const dashboardPath = `/${user.role}/dashboard`;
      console.log('Dashboard path:', dashboardPath);

      // Attempt navigation
      await safeNavigate(dashboardPath);
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        if (error.message.includes('Navigation')) {
          errorMessage = 'Failed to redirect to dashboard. This might be due to slow network or server response. Please wait a moment and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
      setAuthOperationInProgress(false);
    }
  };

  const logout = async () => {
    if (authOperationInProgress) {
      throw new Error('Authentication operation already in progress');
    }
    
    try {
      setAuthOperationInProgress(true);
      setLoading(true);
      console.log('Logging out...');
      
      // Call logout endpoint
      await authApi.logout().catch(error => {
        console.error('Logout API call failed:', error);
        // Continue with local logout even if API call fails
      });

      // Clear user state
      setUser(null);
      setError(null);

      // Navigate to login page
      await safeNavigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if navigation fails, ensure we clear the state
      setUser(null);
      setError(null);
      // Let the error propagate up
      throw error;
    } finally {
      setLoading(false);
      setAuthOperationInProgress(false);
    }
  };

  const clearError = () => setError(null);

  const updateProfile = async (data: Partial<User>) => {
    if (authOperationInProgress) {
      throw new Error('Authentication operation already in progress');
    }
    
    try {
      setAuthOperationInProgress(true);
      setLoading(true);
      setError(null);
      
      const updatedUser = await authApi.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError(error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
      }
      throw error;
    } finally {
      setLoading(false);
      setAuthOperationInProgress(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      isRedirecting,
      login, 
      logout, 
      clearError, 
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 