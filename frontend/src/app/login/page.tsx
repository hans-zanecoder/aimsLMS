'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Mail, Lock, Eye, EyeOff, Chrome, Facebook, AlertCircle, X } from 'lucide-react';
import styles from './login.module.css';

interface AlertProps {
  type: 'error' | 'warning';
  message: string;
  onClose: () => void;
}

const Alert = ({ type, message, onClose }: AlertProps) => (
  <div className={`${styles.alert} ${styles[type]}`}>
    <div className={styles.alertContent}>
      <AlertCircle className={styles.alertIcon} />
      <span>{message}</span>
    </div>
    <button onClick={onClose} className={styles.alertClose}>
      <X className={styles.closeIcon} />
    </button>
  </div>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'warning'; message: string } | null>(null);
  const { login, error, isRedirecting: authRedirecting } = useAuth();
  const { toggleTheme, ThemeIcon } = useTheme();

  // Sync with auth context redirection state
  useEffect(() => {
    setIsRedirecting(authRedirecting);
  }, [authRedirecting]);

  // Clear alert after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAlert(null);
    
    try {
      await login(email, password);
    } catch (err) {
      console.error('Login failed:', err);
      // Show error alert
      setAlert({
        type: 'error',
        message: err instanceof Error 
          ? err.message.includes('Navigation failed')
            ? 'Failed to redirect after login. Please try refreshing the page.'
            : err.message
          : 'An unexpected error occurred during login'
      });
    } finally {
      // Only set loading to false if we're not redirecting
      if (!isRedirecting) {
        setIsLoading(false);
      }
    }
  };

  // Show loading state during redirection
  if (isRedirecting) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.redirectingOverlay}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
            <span>Redirecting to dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginContainer}>
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.logo}>AIMA LMS</h2>
          <button onClick={toggleTheme} className={styles.themeToggle}>
            <ThemeIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className={styles.mainContent}>
        <div className={styles.loginForm}>
          <h1 className={styles.title}>Log In</h1>
          <p className={styles.subtitle}>Welcome to AIMA Learning Management System</p>
          <p className={styles.description}>
            Access your courses, track your progress, and connect with instructors.
          </p>

          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={styles.input}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={styles.input}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeButton}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className={styles.eyeIcon} />
                  ) : (
                    <Eye className={styles.eyeIcon} />
                  )}
                </button>
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <a href="#" className={styles.forgotPassword}>
              Forgot password?
            </a>

            <button 
              type="submit" 
              className={`${styles.loginButton} ${isLoading ? styles.loading : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className={styles.loadingSpinner}>
                  <div className={styles.spinner}></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                'Log in'
              )}
            </button>

            <div className={styles.divider}>
              <span>Or Continue With</span>
            </div>

            <div className={styles.socialButtons}>
              <button type="button" className={styles.socialButton} disabled={isLoading}>
                <Chrome className="h-5 w-5 text-[#4285F4]" />
                Google
              </button>
              <button type="button" className={styles.socialButton} disabled={isLoading}>
                <Facebook className="h-5 w-5 text-[#1877F2]" />
                Facebook
              </button>
            </div>

            <p className={styles.signupText}>
              Don't have an account?{' '}
              <a href="#" className={styles.signupLink}>
                Sign up
              </a>
            </p>
          </form>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>&copy; 2024 AIMA LMS. All rights reserved.</p>
          <div className={styles.footerLinks}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
} 