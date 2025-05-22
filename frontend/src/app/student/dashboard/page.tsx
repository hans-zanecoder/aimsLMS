'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  GraduationCap,
  Calendar,
  Clock,
  Award,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Bell
} from 'lucide-react';
import styles from './dashboard.module.css';
import StudentBooks from '@/components/StudentBooks';
import React from 'react';

export default function StudentDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const userMenuRef = React.useRef<HTMLDivElement | null>(null);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Update the hash when tab changes
    if (activeTab !== 'dashboard') {
      window.history.replaceState(null, '', `#${activeTab}`);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [activeTab]);

  useEffect(() => {
    // Check hash on initial load
    const hash = window.location.hash.replace('#', '');
    if (hash && ['dashboard', 'courses', 'books', 'profile'].includes(hash)) {
      setActiveTab(hash);
    }
    
    // Listen for hash changes
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['dashboard', 'courses', 'books', 'profile'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return null;
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const stats = [
    { label: 'Enrolled Courses', value: '2', icon: BookOpen, trend: '+1 this month', trendUp: true },
    { label: 'Completed Courses', value: '1', icon: Award, trend: 'On track', trendUp: null },
    { label: 'Hours Studied', value: '48', icon: Clock, trend: '+5 this week', trendUp: true },
    { label: 'Assignments Due', value: '3', icon: Calendar, trend: 'Due this week', trendUp: false },
  ];

  return (
    <div className={styles.root} data-theme={theme}>
      <div className={styles.dashboardContainer}>
        {/* Sidebar */}
        <div className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHeader}>
            <h1 className={styles.logo}>AIMA LMS</h1>
          </div>
          <div className={styles.sidebarNav}>
            <ul className={styles.navList}>
              <li className={styles.navItem}>
                <button
                  className={`${styles.navButton} ${activeTab === 'dashboard' ? styles.navButtonActive : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <LayoutDashboard className={styles.navIcon} />
                  <span className={styles.navLabel}>Dashboard</span>
                </button>
              </li>
              <li className={styles.navItem}>
                <button
                  className={`${styles.navButton} ${activeTab === 'courses' ? styles.navButtonActive : ''}`}
                  onClick={() => setActiveTab('courses')}
                >
                  <GraduationCap className={styles.navIcon} />
                  <span className={styles.navLabel}>My Courses</span>
                </button>
              </li>
              <li className={styles.navItem}>
                <button
                  className={`${styles.navButton} ${activeTab === 'books' ? styles.navButtonActive : ''}`}
                  onClick={() => setActiveTab('books')}
                >
                  <BookOpen className={styles.navIcon} />
                  <span className={styles.navLabel}>Books</span>
                </button>
              </li>
              <li className={styles.navItem}>
                <button
                  className={`${styles.navButton} ${activeTab === 'profile' ? styles.navButtonActive : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <User className={styles.navIcon} />
                  <span className={styles.navLabel}>Profile</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        {isSidebarOpen && (
          <div className={styles.sidebarOverlay} onClick={toggleSidebar} />
        )}

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Top Bar */}
          <div className={styles.topBar}>
            <div className={styles.topBarLeft}>
              <button className={styles.menuButton} onClick={toggleSidebar}>
                {isSidebarOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              <h2 className={styles.pageTitle}>Student Portal</h2>
            </div>
            
            <div className={styles.topBarRight}>
              <div className={styles.notifications}>
                <button className={styles.notificationButton}>
                  <Bell className="h-5 w-5" />
                </button>
                <div className={styles.notificationBadge}>3</div>
              </div>
              
              <div className={styles.userMenu} ref={userMenuRef}>
                <div 
                  className={styles.userMenuButton}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className={styles.userAvatar}>
                    {user.firstName.charAt(0)}
                    {user.lastName.charAt(0)}
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.firstName} {user.lastName}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                </div>
                {isUserMenuOpen && (
                  <div className={styles.userMenuDropdown}>
                    <button className={styles.userMenuLogout} onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Dashboard Content */}
          <div className={styles.dashboardContent}>
            {activeTab === 'dashboard' && (
              <>
                <div className={styles.welcomeSection}>
                  <h1 className={styles.welcomeTitle}>Welcome back, {user.firstName}!</h1>
                  <p className={styles.welcomeText}>
                    Track your progress, access your courses, and manage your learning journey.
                  </p>
                </div>
                
                <div className={styles.statsGrid}>
                  {stats.map((stat) => (
                    <div key={stat.label} className={styles.statCard}>
                      <div className={styles.statHeader}>
                        <div className={styles.statLabel}>{stat.label}</div>
                        <div className={styles.statIcon}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className={styles.statValue}>{stat.value}</div>
                      {stat.trend && (
                        <div className={styles.statTrend}>
                          <div className={stat.trendUp === true ? styles.trendUp : stat.trendUp === false ? styles.trendDown : ''}>
                            <span className={styles.trendValue}>{stat.trend}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className={styles.sectionContent}>
                  <h2 className={styles.sectionTitle}>Recent Courses</h2>
                  <div className={styles.coursesGrid}>
                    {/* Example course cards */}
                    <div className={styles.courseCard}>
                      <div className={styles.courseCardHeader}>
                        <h3 className={styles.courseCardTitle}>Makeup Artistry Basics</h3>
                        <div className={`${styles.courseCardBadge} ${styles.active}`}>In Progress</div>
                      </div>
                      <div className={styles.courseCardContent}>
                        <div className={styles.courseCardInfo}>
                          <div className={styles.courseCardInstructor}>Instructor: Sarah Anderson</div>
                          <div className={styles.courseCardProgress}>
                            <div className={styles.progressLabel}>
                              <span>Progress</span>
                              <span>75%</span>
                            </div>
                            <div className={styles.progressBar}>
                              <div className={styles.progressFill} style={{ width: '75%' }}></div>
                            </div>
                          </div>
                        </div>
                        <button className={styles.courseCardButton}>Continue</button>
                      </div>
                    </div>
                    
                    <div className={styles.courseCard}>
                      <div className={styles.courseCardHeader}>
                        <h3 className={styles.courseCardTitle}>Advanced Color Theory</h3>
                        <div className={`${styles.courseCardBadge} ${styles.warning}`}>Just Started</div>
                      </div>
                      <div className={styles.courseCardContent}>
                        <div className={styles.courseCardInfo}>
                          <div className={styles.courseCardInstructor}>Instructor: Michael Chen</div>
                          <div className={styles.courseCardProgress}>
                            <div className={styles.progressLabel}>
                              <span>Progress</span>
                              <span>15%</span>
                            </div>
                            <div className={styles.progressBar}>
                              <div className={styles.progressFill} style={{ width: '15%' }}></div>
                            </div>
                          </div>
                        </div>
                        <button className={styles.courseCardButton}>Continue</button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {activeTab === 'courses' && (
              <div className={styles.sectionContent}>
                <h2 className={styles.sectionTitle}>My Courses</h2>
                <p className={styles.sectionDescription}>
                  Manage your enrolled courses and track your progress.
                </p>
                <div className={styles.coursesGrid}>
                  {/* This would be populated with real courses */}
                  <div className={styles.emptyState}>
                    <BookOpen className="h-12 w-12 text-gray-400" />
                    <h3>Course content will be available soon</h3>
                    <p>We're working on bringing you the best learning experience</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'books' && (
              <div className={styles.sectionContent}>
                <StudentBooks />
              </div>
            )}
            
            {activeTab === 'profile' && (
              <div className={styles.sectionContent}>
                <h2 className={styles.sectionTitle}>Your Profile</h2>
                <p className={styles.sectionDescription}>
                  View and manage your personal information.
                </p>
                <div className={styles.profileContainer}>
                  <div className={styles.profileCard}>
                    <div className={styles.profileHeader}>
                      <div className={styles.profileAvatar}>
                        {user.firstName.charAt(0)}
                        {user.lastName.charAt(0)}
                      </div>
                      <div>
                        <h3 className={styles.profileName}>{user.firstName} {user.lastName}</h3>
                        <p className={styles.profileEmail}>{user.email}</p>
                      </div>
                    </div>
                    <div className={styles.profileInfo}>
                      <div className={styles.profileInfoItem}>
                        <span className={styles.profileInfoLabel}>Role</span>
                        <span className={styles.profileInfoValue}>Student</span>
                      </div>
                      <div className={styles.profileInfoItem}>
                        <span className={styles.profileInfoLabel}>Join Date</span>
                        <span className={styles.profileInfoValue}>{user.joinDate || 'Not specified'}</span>
                      </div>
                      <div className={styles.profileInfoItem}>
                        <span className={styles.profileInfoLabel}>Phone</span>
                        <span className={styles.profileInfoValue}>{user.phone || 'Not specified'}</span>
                      </div>
                      <div className={styles.profileInfoItem}>
                        <span className={styles.profileInfoLabel}>Location</span>
                        <span className={styles.profileInfoValue}>{user.location || 'Not specified'}</span>
                      </div>
                    </div>
                    <div className={styles.profileActions}>
                      <button className={styles.secondaryButton}>Edit Profile</button>
                      <button className={styles.dangerButton} onClick={logout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 