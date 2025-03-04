'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  ThemeIcon: React.ComponentType<{ className?: string }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with undefined to avoid flash of incorrect theme
  const [theme, setTheme] = useState<Theme | undefined>(undefined);

  useEffect(() => {
    // Check if theme is stored in localStorage
    const storedTheme = localStorage.getItem('theme') as Theme;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.setAttribute('data-theme', storedTheme);
      // Also set the data-theme attribute on any elements with the .root class
      document.querySelectorAll('.root').forEach(element => {
        element.setAttribute('data-theme', storedTheme);
      });
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      // Also set the data-theme attribute on any elements with the .root class
      document.querySelectorAll('.root').forEach(element => {
        element.setAttribute('data-theme', 'dark');
      });
    } else {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
      // Also set the data-theme attribute on any elements with the .root class
      document.querySelectorAll('.root').forEach(element => {
        element.setAttribute('data-theme', 'light');
      });
    }
  }, []);

  const toggleTheme = () => {
    if (!theme) return; // Guard against undefined theme

    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Also set the data-theme attribute on any elements with the .root class
    document.querySelectorAll('.root').forEach(element => {
      element.setAttribute('data-theme', newTheme);
    });
  };

  // Default to Sun icon if theme not initialized yet
  const ThemeIcon = !theme || theme === 'light' ? Moon : Sun;

  // Don't render children until theme is initialized
  if (theme === undefined) {
    return null; // Or return a minimal loading state
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, ThemeIcon }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}