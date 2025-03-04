'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Mail, Lock, Eye, EyeOff, Chrome, Facebook } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();
  const { toggleTheme, ThemeIcon } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
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