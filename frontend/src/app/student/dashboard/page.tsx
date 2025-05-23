'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import programsApi, { Program, EnrollmentStats } from '@/services/programsApi';
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
  Bell,
  Book,
  Video,
  FileText,
  Folder
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
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrolledPrograms, setEnrolledPrograms] = useState<Program[]>([]);
  const [stats, setStats] = useState<EnrollmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First try to fetch all programs as it's the most critical data
        const programsData = await programsApi.getAll();
        setPrograms(programsData);
        
        // Then fetch enrollment data and stats in parallel
        // Use Promise.allSettled to handle partial failures
        const [enrolledResult, statsResult] = await Promise.allSettled([
          programsApi.getEnrolledPrograms(),
          programsApi.getEnrollmentStats()
        ]);
        
        // Handle enrolled programs result
        if (enrolledResult.status === 'fulfilled') {
          setEnrolledPrograms(enrolledResult.value);
        } else {
          console.error('Error fetching enrolled programs:', enrolledResult.reason);
          // Don't set error state here as we have the main programs data
        }
        
        // Handle enrollment stats result
        if (statsResult.status === 'fulfilled') {
          setStats(statsResult.value);
        } else {
          console.error('Error fetching enrollment stats:', statsResult.reason);
          // Set default stats if fetch fails
          setStats({
            enrolledCount: 0,
            completedCount: 0,
            hoursStudied: 0,
            assignmentsDue: 0
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load programs. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const dashboardStats = [
    { 
      label: 'Enrolled Courses', 
      value: stats?.enrolledCount.toString() || '0', 
      icon: BookOpen, 
      trend: '+1 this month', 
      trendUp: true 
    },
    { 
      label: 'Completed Courses', 
      value: stats?.completedCount.toString() || '0', 
      icon: Award, 
      trend: 'On track', 
      trendUp: null 
    },
    { 
      label: 'Hours Studied', 
      value: stats?.hoursStudied.toString() || '0', 
      icon: Clock, 
      trend: '+5 this week', 
      trendUp: true 
    },
    { 
      label: 'Assignments Due', 
      value: stats?.assignmentsDue.toString() || '0', 
      icon: Calendar, 
      trend: 'Due this week', 
      trendUp: false 
    },
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
                  {dashboardStats.map((stat) => (
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
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>My Enrolled Programs</h2>
                    {enrolledPrograms.length > 0 && (
                      <button 
                        className={styles.viewAllButton}
                        onClick={() => setActiveTab('courses')}
                      >
                        View All
                      </button>
                    )}
                  </div>
                  
                  {isLoading ? (
                    <div className={styles.loadingState}>
                      <div className={styles.loadingSpinner} />
                      <p>Loading your programs...</p>
                    </div>
                  ) : error ? (
                    <div className={styles.errorState}>
                      <p>{error}</p>
                      <button 
                        className={styles.retryButton}
                        onClick={() => {
                          setIsLoading(true);
                          setError(null);
                          programsApi.getEnrolledPrograms()
                            .then(data => {
                              setEnrolledPrograms(data);
                              setIsLoading(false);
                            })
                            .catch(err => {
                              setError('Failed to fetch your programs');
                              setIsLoading(false);
                              console.error('Error fetching enrolled programs:', err);
                            });
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  ) : enrolledPrograms.length === 0 ? (
                    <div className={styles.emptyState}>
                      <GraduationCap className="h-12 w-12 text-gray-400" />
                      <h3>No programs enrolled</h3>
                      <p>Browse available programs below to get started</p>
                    </div>
                  ) : (
                    <div className={styles.programsGrid}>
                      {enrolledPrograms.slice(0, 3).map((program) => (
                        <div key={program._id} className={styles.programCard}>
                          <div className={styles.programCardHeader}>
                            <h3 className={styles.programCardTitle}>{program.name}</h3>
                          </div>
                          <div className={styles.programCardContent}>
                            <div className={styles.programStats}>
                              <div className={styles.statItem}>
                                <Book className="h-5 w-5" />
                                <div className={styles.statInfo}>
                                  <div className={styles.statLabel}>Books</div>
                                  <div className={styles.statValue}>{program.bookCount}</div>
                                </div>
                              </div>
                              <div className={styles.statItem}>
                                <Video className="h-5 w-5" />
                                <div className={styles.statInfo}>
                                  <div className={styles.statLabel}>Videos</div>
                                  <div className={styles.statValue}>{program.videoCount}</div>
                                </div>
                              </div>
                              <div className={styles.statItem}>
                                <FileText className="h-5 w-5" />
                                <div className={styles.statInfo}>
                                  <div className={styles.statLabel}>Assignments</div>
                                  <div className={styles.statValue}>{program.assignmentCount}</div>
                                </div>
                              </div>
                            </div>
                            <button 
                              className={styles.viewButton}
                              onClick={() => router.push(`/student/program/${program._id}`)}
                            >
                              VIEW COURSE
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.sectionContent}>
                  <h2 className={styles.sectionTitle}>Available Programs</h2>
                  {isLoading ? (
                    <div className={styles.loadingState}>
                      <div className={styles.loadingSpinner} />
                      <p>Loading programs...</p>
                    </div>
                  ) : error ? (
                    <div className={styles.errorState}>
                      <p>{error}</p>
                      <button 
                        className={styles.retryButton}
                        onClick={() => {
                          setIsLoading(true);
                          setError(null);
                          programsApi.getAll()
                            .then(data => {
                              setPrograms(data);
                              setIsLoading(false);
                            })
                            .catch(err => {
                              setError('Failed to fetch programs');
                              setIsLoading(false);
                              console.error('Error fetching programs:', err);
                            });
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  ) : programs.length === 0 ? (
                    <div className={styles.emptyState}>
                      <GraduationCap className="h-12 w-12 text-gray-400" />
                      <h3>No programs available</h3>
                      <p>Check back later for new programs</p>
                    </div>
                  ) : (
                    <div className={styles.programsGrid}>
                      {programs.map((program) => (
                        <div key={program._id} className={styles.programCard}>
                          <div className={styles.programCardHeader}>
                            <h3 className={styles.programCardTitle}>{program.name}</h3>
                          </div>
                          <div className={styles.programCardContent}>
                            <div className={styles.programStats}>
                              <div className={styles.statItem}>
                                <Book className="h-5 w-5" />
                                <div className={styles.statInfo}>
                                  <div className={styles.statLabel}>Books</div>
                                  <div className={styles.statValue}>{program.bookCount}</div>
                                </div>
                              </div>
                              <div className={styles.statItem}>
                                <Video className="h-5 w-5" />
                                <div className={styles.statInfo}>
                                  <div className={styles.statLabel}>Videos</div>
                                  <div className={styles.statValue}>{program.videoCount}</div>
                                </div>
                              </div>
                              <div className={styles.statItem}>
                                <FileText className="h-5 w-5" />
                                <div className={styles.statInfo}>
                                  <div className={styles.statLabel}>Assignments</div>
                                  <div className={styles.statValue}>{program.assignmentCount}</div>
                                </div>
                              </div>
                            </div>
                            <button 
                              className={styles.viewButton}
                              onClick={() => router.push(`/student/program/${program._id}`)}
                            >
                              VIEW DETAILS
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  {isLoading ? (
                    <div className={styles.loadingState}>
                      <div className={styles.loadingSpinner} />
                      <p>Loading your courses...</p>
                    </div>
                  ) : error ? (
                    <div className={styles.errorState}>
                      <p>{error}</p>
                      <button 
                        className={styles.retryButton}
                        onClick={() => {
                          setIsLoading(true);
                          setError(null);
                          programsApi.getEnrolledPrograms()
                            .then(data => {
                              setEnrolledPrograms(data);
                              setIsLoading(false);
                            })
                            .catch(err => {
                              setError('Failed to fetch your courses');
                              setIsLoading(false);
                              console.error('Error fetching enrolled courses:', err);
                            });
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  ) : enrolledPrograms.length === 0 ? (
                    <div className={styles.emptyState}>
                      <BookOpen className="h-12 w-12 text-gray-400" />
                      <h3>No enrolled courses yet</h3>
                      <p>Browse available programs to enroll in courses</p>
                    </div>
                  ) : (
                    <div className={styles.programsGrid}>
                      {enrolledPrograms.map((program) => (
                        <div key={program._id} className={styles.programCard}>
                          <div className={styles.programCardHeader}>
                            <h3 className={styles.programCardTitle}>{program.name}</h3>
                          </div>
                          <div className={styles.programCardContent}>
                            <div className={styles.programStats}>
                              <div className={styles.statItem}>
                                <Book className="h-5 w-5" />
                                <div className={styles.statInfo}>
                                  <div className={styles.statLabel}>Books</div>
                                  <div className={styles.statValue}>{program.bookCount}</div>
                                </div>
                              </div>
                              <div className={styles.statItem}>
                                <Video className="h-5 w-5" />
                                <div className={styles.statInfo}>
                                  <div className={styles.statLabel}>Videos</div>
                                  <div className={styles.statValue}>{program.videoCount}</div>
                                </div>
                              </div>
                              <div className={styles.statItem}>
                                <FileText className="h-5 w-5" />
                                <div className={styles.statInfo}>
                                  <div className={styles.statLabel}>Assignments</div>
                                  <div className={styles.statValue}>{program.assignmentCount}</div>
                                </div>
                              </div>
                            </div>
                            <button 
                              className={styles.viewButton}
                              onClick={() => router.push(`/student/program/${program._id}`)}
                            >
                              VIEW COURSE
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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