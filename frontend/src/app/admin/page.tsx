'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Users,
  BookOpen,
  Building2,
  DollarSign,
  BarChart,
  Settings,
  Shield,
  LogOut,
  AlertCircle,
  Bell,
  Search,
  ChevronDown,
  Menu,
  Plus,
  Filter,
  Download,
  MoreVertical,
  Edit2,
  Trash2,
  Mail,
  ExternalLink,
  User,
  Upload,
  File,
  LayoutDashboard,
  GraduationCap,
  Calendar,
  Clock,
  FileText,
  Loader2
} from 'lucide-react'
import styles from './admin.module.css'
import { Student, Course } from '@/types'
import { studentsApi, coursesApi, dashboardApi } from '@/utils/api'
import StudentForm from '@/components/StudentForm'
import StudentDetail from '@/components/StudentDetail'
import EnrollmentForm from '@/components/EnrollmentForm'
import CourseForm from '@/components/CourseForm'
import CourseEditDialog from '@/components/CourseEditDialog'
import SettingsContent from './settings/components/SettingsContent'
import BooksList from '@/components/BooksList'
import CourseAuditDialog from '@/components/CourseAuditDialog'

type NavSection = 'dashboard' | 'students' | 'courses' | 'analytics' | 'permissions' | 'settings' | 'books';

const studentsList = [
  {
    id: '1',
    name: 'Sarah Anderson',
    email: 'sarah@example.com',
    enrollmentDate: '2024-01-15',
    coursesEnrolled: 3,
    status: 'Active',
    progress: 75,
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael@example.com',
    enrollmentDate: '2024-02-01',
    coursesEnrolled: 2,
    status: 'Active',
    progress: 45,
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    enrollmentDate: '2024-02-10',
    coursesEnrolled: 1,
    status: 'Pending',
    progress: 0,
  },
  {
    id: '4',
    name: 'James Rodriguez',
    email: 'james@example.com',
    enrollmentDate: '2024-01-20',
    coursesEnrolled: 4,
    status: 'Active',
    progress: 90,
  },
  {
    id: '5',
    name: 'Lisa Wang',
    email: 'lisa@example.com',
    enrollmentDate: '2024-02-05',
    coursesEnrolled: 2,
    status: 'Inactive',
    progress: 30,
  },
  {
    id: '6',
    name: 'Mickey Mouse',
    email: 'mickey@disney.com',
    enrollmentDate: '2024-01-01',
    coursesEnrolled: 5,
    status: 'Active',
    progress: 85,
  },
]

export default function AdminDashboard() {
  const { user, loading, error: authError, logout, updateProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme, ThemeIcon } = useTheme()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard')
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentFilter, setStudentFilter] = useState('all')
  
  // State for API data
  const [students, setStudents] = useState<Student[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [studentError, setStudentError] = useState<string | null>(null)
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loadingRecentUsers, setLoadingRecentUsers] = useState(false)
  
  // State for modals
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
  const [isStudentDetailModalOpen, setIsStudentDetailModalOpen] = useState(false)
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [showCourseEditDialog, setShowCourseEditDialog] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showCourseAudit, setShowCourseAudit] = useState(false)
  const [courseForAudit, setCourseForAudit] = useState<{ id: string, name: string } | null>(null)

  // State for course management
  const [courseSearch, setCourseSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [courseSortBy, setCourseSortBy] = useState('newest')
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [courseError, setCourseError] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])

  // Courses functions
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  const fetchCourses = async () => {
    // Rate limiting protection - don't allow fetches within 2 seconds of each other
    const now = Date.now();
    if (now - lastFetchTime < 2000) {
      console.log('Rate limiting fetch courses - too soon since last request');
      return;
    }
    
    setLastFetchTime(now);
    setLoadingCourses(true);
    setCourseError(null);
    try {
      const courseData = await coursesApi.getAll();
      setCourses(courseData);
      setFilteredCourses(courseData); // Initially set all courses
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourseError(error instanceof Error ? error.message : 'Failed to load courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  // Load courses on component mount
  useEffect(() => {
    if (activeSection === 'courses' && !loadingCourses && courses.length === 0) {
      fetchCourses();
    }
  }, [activeSection, loadingCourses, courses.length]);

  // Handle hash changes to set the active section
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['students', 'courses', 'analytics', 'permissions', 'settings', 'books'].includes(hash)) {
        setActiveSection(hash as NavSection);
        document.title = `AIMA LMS - ${hash.charAt(0).toUpperCase() + hash.slice(1)}`;
      } else {
        setActiveSection('dashboard');
        document.title = 'AIMA LMS - Dashboard';
      }
    };

    // Set initial section based on hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch students on mount or when active section changes to students
  useEffect(() => {
    if (activeSection === 'students') {
      fetchStudents();
    }
  }, [activeSection]);

  // Fetch initial data for dashboard
  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchDashboardData();
      fetchRecentUsers();
    }
  }, [activeSection]);

  // Fetch students from API
  const fetchStudents = async () => {
    try {
      console.log('Fetching students...');
      setIsLoadingStudents(true);
      setStudentError(null);
      
      try {
        const data = await studentsApi.getAll();
        console.log('Student data received:', data);
        
        // If we got valid data from the API, use it
        if (data && Array.isArray(data) && data.length > 0) {
          setStudents(data);
          updateRecentUsers(data);
        } else {
          console.log('No students found from API');
          setStudents([]);
        }
      } catch (apiError) {
        console.error('Error fetching students from API:', apiError);
        setStudentError('Failed to load students data. Please try again.');
        setStudents([]);
      }
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Update recent users based on student data
  const updateRecentUsers = (studentData: Student[]) => {
    // Take at most 5 recent students (sorted by newest)
    const recent = [...studentData]
      .sort((a, b) => {
        const dateA = a.enrollmentDate ? new Date(a.enrollmentDate).getTime() : 0;
        const dateB = b.enrollmentDate ? new Date(b.enrollmentDate).getTime() : 0;
        return dateB - dateA; // Sort by newest first
      })
      .slice(0, 5)
      .map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        role: 'Student',
        status: student.status,
        enrollmentDate: student.enrollmentDate
      }));
    
    setRecentUsers(recent);
  };

  // Fetch recent users for dashboard
  const fetchRecentUsers = async () => {
    if (activeSection !== 'dashboard') return;
    
    setLoadingRecentUsers(true);
    
    try {
      const data = await studentsApi.getAll();
      if (data && Array.isArray(data) && data.length > 0) {
        updateRecentUsers(data);
      } else {
        setRecentUsers([]);
      }
    } catch (error) {
      console.error('Error fetching recent users:', error);
      setRecentUsers([]);
    } finally {
      setLoadingRecentUsers(false);
    }
  };

  // Handle student creation
  const handleAddStudent = () => {
    setIsAddStudentModalOpen(true);
  };

  // Handle student update
  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsAddStudentModalOpen(true);
  };

  // Handle student deletion
  const handleDeleteStudent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentsApi.delete(id);
        // Refresh the student list
        fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student. Please try again.');
      }
    }
  };

  // Handle student email
  const handleEmailStudent = (student: Student) => {
    window.location.href = `mailto:${student.email}`;
  };

  // Handle student view detail
  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsStudentDetailModalOpen(true);
  };

  // Handle student enrollment
  const handleEnrollStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsEnrollmentModalOpen(true);
  };

  // Handle form submission success
  const handleFormSuccess = () => {
    fetchStudents();
  };

  // Navigation items configuration
  const navItems = [
    { id: 'dashboard' as NavSection, label: 'Dashboard', icon: BarChart },
    { id: 'students' as NavSection, label: 'Students', icon: Users },
    { id: 'courses' as NavSection, label: 'Courses', icon: BookOpen },
    { id: 'analytics' as NavSection, label: 'Analytics', icon: BarChart },
    { id: 'permissions' as NavSection, label: 'Permissions', icon: Shield },
    { id: 'settings' as NavSection, label: 'Settings', icon: Settings },
    { id: 'books' as NavSection, label: 'Books', icon: BookOpen },
  ]

  // Handle navigation click
  const handleNavClick = (section: NavSection) => {
    if (section === 'dashboard') {
      // For dashboard, use the base admin path without hash
      window.location.hash = '';
    } else {
      // For other sections, use hash-based navigation
      window.location.hash = section;
    }
    
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false)
    }
  }

  // Handle profile actions
  const handleProfileAction = (action: string) => {
    setIsUserMenuOpen(false)
    switch (action) {
      case 'settings':
        // Navigate to settings using hash
        window.location.hash = 'settings';
        break
      case 'logout':
        logout()
        break
    }
  }

  // State for dashboard statistics
  const [dashboardStats, setDashboardStats] = useState({
    users: { 
      totalUsers: 0, 
      students: 0,
      instructors: 0,
      admins: 0,
      growth: '0%', 
      trendUp: null as boolean | null 
    },
    courses: { 
      activeCourses: 0, 
      completedCourses: 0,
      newCourses: 0, 
      trendUp: null as boolean | null 
    },
    campuses: { totalCampuses: 2, campuses: [] as string[] }
  });
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (activeSection !== 'dashboard') return;
    
    setLoadingDashboard(true);
    setDashboardError(null);
    
    try {
      // Fetch statistics in parallel
      const [userStats, courseStats, campusStats] = await Promise.all([
        dashboardApi.getUserStats(),
        dashboardApi.getCourseStats(),
        dashboardApi.getCampusStats()
      ]);
      
      setDashboardStats({
        users: userStats,
        courses: courseStats,
        campuses: campusStats
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Create dynamic stats based on fetched data
  const dashboardStatItems = useMemo(() => [
    { 
      label: 'Total Users', 
      value: dashboardStats.users.totalUsers.toString(), 
      icon: Users, 
      trend: dashboardStats.users.growth,
      trendUp: dashboardStats.users.trendUp,
      description: 'vs. last month'
    },
    { 
      label: 'Active Courses', 
      value: dashboardStats.courses.activeCourses.toString(), 
      icon: BookOpen,
      trend: `+${dashboardStats.courses.newCourses}`,
      trendUp: dashboardStats.courses.trendUp,
      description: 'new this week'
    },
    { 
      label: 'Locations', 
      value: dashboardStats.campuses.totalCampuses.toString(), 
      icon: Building2,
      trend: '0',
      trendUp: null,
      description: 'no change'
    },
  ], [dashboardStats]);

  // Notifications data
  const notifications = [
    {
      title: 'New Course Request',
      description: 'Sarah Anderson requested to create a new course',
      time: '5 minutes ago',
      type: 'info'
    },
    {
      title: 'System Update',
      description: 'System maintenance scheduled for tonight',
      time: '1 hour ago',
      type: 'warning'
    }
  ];

  // State for system status
  const [systemStatus, setSystemStatus] = useState({
    serverLoad: 28,
    storageUsage: 64,
    databaseStatus: 'Healthy',
    lastBackup: '2 hours ago',
    sslStatus: 'Valid',
    cacheStatus: 'Optimized'
  });
  
  // Update system status based on courses and students counts
  useEffect(() => {
    if (courses.length > 0 || students.length > 0) {
      // Calculate server load based on number of courses and students
      const serverLoadPercentage = Math.min(
        Math.round((courses.length * 2 + students.length * 0.5) / 2),
        99
      );
      
      // Calculate storage usage based on number of courses (this is just a simulation)
      const storageUsagePercentage = Math.min(
        Math.round((courses.length * 5 + students.length * 2) / 3),
        99
      );
      
      setSystemStatus(prev => ({
        ...prev,
        serverLoad: serverLoadPercentage,
        storageUsage: storageUsagePercentage,
        lastBackup: '10 minutes ago' // Simulated value
      }));
    }
  }, [courses.length, students.length]);

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className={styles.dashboardContent}>
            <div className={styles.welcomeSection}>
              <h2 className={styles.welcomeTitle}>
                Welcome back, {user?.firstName || 'Admin'}! 👋
              </h2>
              <p className={styles.welcomeText}>
                Here's what's happening with your learning platform today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
              {loadingDashboard ? (
                // Loading state for stats
                Array(4).fill(0).map((_, index) => (
                  <div key={index} className={`${styles.statCard} ${styles.statCardLoading}`}>
                    <div className={styles.loadingContent}>
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span>Loading stats...</span>
                    </div>
                  </div>
                ))
              ) : dashboardError ? (
                // Error state
                <div className={styles.errorCard}>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <h3>Failed to Load Data</h3>
                  <p>{dashboardError}</p>
                  <button 
                    className={styles.retryButton}
                    onClick={fetchDashboardData}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                // Stats cards
                dashboardStatItems.map((stat) => (
                  <div key={stat.label} className={styles.statCard}>
                    <div className={styles.statHeader}>
                      <span className={styles.statLabel}>{stat.label}</span>
                      <div className={styles.statIcon}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className={styles.statValue}>{stat.value}</div>
                    <div className={styles.statTrend}>
                      <span className={`${styles.trendValue} ${stat.trendUp ? styles.trendUp : stat.trendUp === false ? styles.trendDown : ''}`}>
                        {stat.trendUp ? '↑' : stat.trendUp === false ? '↓' : ''} {stat.trend}
                      </span>
                      <span className={styles.trendDescription}>{stat.description}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.dashboardGrid}>
              {/* Recent Students */}
              <div className={styles.gridCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <Users className="h-5 w-5" /> Recent Students
                  </h3>
                  <button 
                    className={styles.cardAction}
                    onClick={() => window.location.hash = 'students'}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.userList}>
                  {loadingRecentUsers ? (
                    <div className={styles.loadingContainer}>
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span>Loading recent students...</span>
                    </div>
                  ) : recentUsers.length === 0 ? (
                    <div className={styles.emptyState}>
                      <Users className="h-12 w-12 text-gray-400" />
                      <h3>No students yet</h3>
                      <p>Add students to see them here</p>
                      <button 
                        className={styles.emptyStateButton}
                        onClick={handleAddStudent}
                      >
                        Add Student
                      </button>
                    </div>
                  ) : (
                    recentUsers.map((user, index) => (
                      <div key={index} className={styles.userItem}>
                        <div className={styles.userAvatar}>
                          {user.name.charAt(0)}
                        </div>
                        <div className={styles.userData}>
                          <div className={styles.userName}>{user.name}</div>
                          <div className={styles.userEmail}>{user.email}</div>
                        </div>
                        <div className={styles.userMeta}>
                          <span className={`${styles.userRole} ${styles[user.role.toLowerCase()]}`}>
                            {user.role}
                          </span>
                          <span className={`${styles.userStatus} ${styles[user.status.toLowerCase()]}`}>
                            {user.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* System Status */}
              {renderSystemStatus()}
            </div>
          </div>
        )
      case 'students':
        const filteredStudents = students.filter(student => {
          const matchesSearch = student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                              student.email.toLowerCase().includes(studentSearch.toLowerCase())
          const matchesFilter = studentFilter === 'all' || student.status.toLowerCase() === studentFilter.toLowerCase()
          return matchesSearch && matchesFilter
        })

        return (
          <div className={styles.sectionContent}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <h2 className={styles.sectionTitle}>Student Management</h2>
                <p className={styles.sectionDescription}>View and manage all students enrolled in your courses.</p>
              </div>
              <button 
                className={styles.primaryButton}
                onClick={handleAddStudent}
              >
                <Plus className="h-4 w-4" />
                Add New Student
              </button>
            </div>

            <div className={styles.actionBar}>
              <div className={styles.searchWrapper}>
                <Search className="h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.actionButtons}>
                <select 
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>

                <button className={styles.iconButton}>
                  <Filter className="h-4 w-4" />
                  Filters
                </button>
                <button className={styles.iconButton}>
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>

            {isLoadingStudents ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <span>Loading students...</span>
              </div>
            ) : studentError ? (
              <div className={styles.errorMessage}>
                <AlertCircle className="h-5 w-5" />
                <span>{studentError}</span>
                <button 
                  className={styles.retryButton}
                  onClick={fetchStudents}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Enrollment Date</th>
                        <th>Courses</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th className={styles.actionColumn}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className={styles.emptyState}>
                            <div className={styles.emptyStateContent}>
                              <Users className="h-12 w-12 text-gray-400" />
                              <h3>No students found</h3>
                              <p>Try adjusting your search or filters</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student.id}>
                            <td>
                              <div className={styles.studentInfo}>
                                <div className={styles.studentAvatar}>
                                  {student.name.charAt(0)}
                                </div>
                                <span className={styles.studentName}>{student.name}</span>
                              </div>
                            </td>
                            <td>{student.email}</td>
                            <td>{new Date(student.enrollmentDate).toLocaleDateString()}</td>
                            <td>{student.coursesEnrolled} courses</td>
                            <td>
                              <span className={`${styles.statusBadge} ${styles[student.status.toLowerCase()]}`}>
                                {student.status}
                              </span>
                            </td>
                            <td>
                              <div className={styles.progressBar}>
                                <div 
                                  className={styles.progressFill} 
                                  style={{ width: `${student.progress}%` }}
                                />
                                <span className={styles.progressText}>{student.progress}%</span>
                              </div>
                            </td>
                            <td className={styles.actionColumn}>
                              <div className={styles.actionButtons}>
                                <button 
                                  className={styles.iconButton} 
                                  title="Edit"
                                  onClick={() => handleEditStudent(student)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button 
                                  className={styles.iconButton} 
                                  title="Send Email"
                                  onClick={() => handleEmailStudent(student)}
                                >
                                  <Mail className="h-4 w-4" />
                                </button>
                                <button 
                                  className={styles.iconButton} 
                                  title="View Details"
                                  onClick={() => handleViewStudent(student)}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                                <button 
                                  className={`${styles.iconButton} ${styles.deleteButton}`} 
                                  title="Delete"
                                  onClick={() => handleDeleteStudent(student.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className={styles.mobileCards}>
                  {filteredStudents.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyStateContent}>
                        <Users className="h-12 w-12 text-gray-400" />
                        <h3>No students found</h3>
                        <p>Try adjusting your search or filters</p>
                      </div>
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <div key={student.id} className={styles.studentCard}>
                        <div className={styles.cardHeader}>
                          <div className={styles.studentAvatar}>
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className={styles.studentName}>{student.name}</div>
                            <div className={styles.cardEmail}>{student.email}</div>
                          </div>
                          <span className={`${styles.statusBadge} ${styles[student.status.toLowerCase()]}`}>
                            {student.status}
                          </span>
                        </div>
                        
                        <div className={styles.cardContent}>
                          <div className={styles.cardField}>
                            <span className={styles.fieldLabel}>Enrollment Date</span>
                            <span className={styles.fieldValue}>
                              {new Date(student.enrollmentDate).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className={styles.cardField}>
                            <span className={styles.fieldLabel}>Courses</span>
                            <span className={styles.fieldValue}>{student.coursesEnrolled} courses</span>
                          </div>
                          
                          <div className={styles.cardField}>
                            <span className={styles.fieldLabel}>Progress</span>
                            <div className={styles.progressBar}>
                              <div 
                                className={styles.progressFill} 
                                style={{ width: `${student.progress}%` }}
                              />
                              <span className={styles.progressText}>{student.progress}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className={styles.cardActions}>
                          <button 
                            className={styles.iconButton} 
                            title="Edit"
                            onClick={() => handleEditStudent(student)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            className={styles.iconButton} 
                            title="Send Email"
                            onClick={() => handleEmailStudent(student)}
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button 
                            className={styles.iconButton} 
                            title="View Details"
                            onClick={() => handleViewStudent(student)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button 
                            className={`${styles.iconButton} ${styles.deleteButton}`} 
                            title="Delete"
                            onClick={() => handleDeleteStudent(student.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles.pagination}>
                  <span className={styles.paginationInfo}>
                    Showing {filteredStudents.length} of {students.length} students
                  </span>
                  <div className={styles.paginationButtons}>
                    <button className={styles.paginationButton} disabled>Previous</button>
                    <button className={`${styles.paginationButton} ${styles.active}`}>1</button>
                    <button className={styles.paginationButton} disabled>Next</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )
      case 'courses':
        return (
          <div className={styles.sectionContent}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <h2 className={styles.sectionTitle}>Course Management</h2>
                <p className={styles.sectionDescription}>Manage your courses, instructors, and learning materials.</p>
              </div>
              <button 
                className={styles.primaryButton}
                onClick={handleAddCourse}
              >
                <Plus className="h-4 w-4" />
                Add New Course
              </button>
            </div>

            <div className={styles.actionBar}>
              <div className={styles.searchWrapper}>
                <Search className="h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.actionButtons}>
                <select 
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                  <option value="Archived">Archived</option>
                </select>
                <select 
                  value={courseSortBy}
                  onChange={(e) => setCourseSortBy(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {loadingCourses ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading courses...</p>
              </div>
            ) : courseError ? (
              <div className={styles.errorContainer}>
                <AlertCircle className="h-8 w-8 text-red-500" />
                <h3 className={styles.errorTitle}>Failed to Load Courses</h3>
                <p className={styles.errorMessage}>{courseError}</p>
                <button 
                  className={styles.secondaryButton}
                  onClick={() => {
                    // Add delay before retrying to prevent rapid requests
                    setTimeout(() => {
                      fetchCourses();
                    }, 1000);
                  }}
                  disabled={Date.now() - lastFetchTime < 2000} // Disable if too recent
                >
                  {Date.now() - lastFetchTime < 2000 ? 'Please wait...' : 'Retry'}
                </button>
                {courseError.includes('Too many requests') && (
                  <p className={styles.errorHint}>
                    The server is currently rate limiting requests. Please wait a moment before retrying.
                  </p>
                )}
              </div>
            ) : courses.length === 0 ? (
              <div className={styles.emptyState}>
                <BookOpen className="h-12 w-12 text-gray-400" />
                <h3>No courses yet</h3>
                <p>Add your first course to get started</p>
                <button 
                  className={styles.emptyStateButton}
                  onClick={handleAddCourse}
                >
                  Add Course
                </button>
              </div>
            ) : (
              <div className={styles.courseGrid}>
                {filteredCourses.map((course) => (
                  <div key={course._id} className={styles.courseCard}>
                    <div className={styles.courseImageContainer}>
                      {course.image ? (
                        <img 
                          src={course.image} 
                          alt={course.title}
                          className={styles.courseImage}
                        />
                      ) : (
                        <div className={styles.coursePlaceholder}>
                          <BookOpen className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                      <div className={`${styles.courseStatus} ${styles[course.status.toLowerCase()]}`}>
                        {course.status}
                      </div>
                    </div>
                    <div className={styles.courseContent}>
                      <h3 className={styles.courseTitle}>{course.title}</h3>
                      <p className={styles.courseDescription}>
                        {course.description.length > 120 
                          ? `${course.description.substring(0, 120)}...` 
                          : course.description}
                      </p>
                      <div className={styles.courseMeta}>
                        <div className={styles.courseInstructor}>
                          <User className="h-4 w-4" />
                          <span>
                            {course.instructorId && typeof course.instructorId === 'object' && course.instructorId.firstName 
                              ? `${course.instructorId.firstName} ${course.instructorId.lastName}` 
                              : typeof course.instructor === 'object' && course.instructor?.firstName 
                                ? `${course.instructor.firstName} ${course.instructor.lastName}` 
                                : 'Instructor'}
                          </span>
                        </div>
                        <div className={styles.courseCategory}>{course.category}</div>
                        <div className={styles.courseLevel}>{course.level}</div>
                      </div>
                      {(course.startDate || course.endDate || course.classStartTime) && (
                        <div className={styles.courseSchedule}>
                          {course.startDate && (
                            <div className={styles.scheduleItem}>
                              <Calendar className="h-4 w-4" />
                              <span>Start: {new Date(course.startDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {course.endDate && (
                            <div className={styles.scheduleItem}>
                              <Calendar className="h-4 w-4" />
                              <span>End: {new Date(course.endDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {course.classDays && course.classDays.length > 0 && (
                            <div className={styles.scheduleItem}>
                              <Clock className="h-4 w-4" />
                              <span>
                                {course.classDays.join(', ')}
                                {course.classStartTime && course.classEndTime && 
                                 ` ${course.classStartTime} - ${course.classEndTime}`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={styles.courseFooter}>
                      <div className={styles.courseStats}>
                        <div className={styles.courseStat}>
                          <span className={styles.courseStatLabel}>Students</span>
                          <span className={styles.courseStatValue}>{course.totalEnrollment || 0}</span>
                        </div>
                        <div className={styles.courseStat}>
                          <span className={styles.courseStatLabel}>Rating</span>
                          <span className={styles.courseStatValue}>{course.averageRating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div className={styles.courseStat}>
                          <span className={styles.courseStatLabel}>Modules</span>
                          <span className={styles.courseStatValue}>{course.modules?.length || 0}</span>
                        </div>
                      </div>
                      <div className={styles.courseActions}>
                        <button 
                          className={styles.iconButton}
                          onClick={() => handleEditCourse(course._id)}
                          aria-label="Edit course"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          className={styles.iconButton}
                          onClick={() => handleViewCourse(course._id)}
                          aria-label="View course"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button 
                          className={styles.iconButton}
                          onClick={() => handleAuditCourse(course._id)}
                          aria-label="View audit history"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button 
                          className={`${styles.iconButton} ${styles.dangerButton}`}
                          onClick={() => handleDeleteCourse(course._id)}
                          aria-label="Delete course"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      case 'analytics':
        return (
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Analytics & Reports</h2>
            <p className={styles.sectionDescription}>View detailed analytics and generate reports.</p>
            {/* Add analytics content */}
          </div>
        )
      case 'permissions':
        return (
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Role Management</h2>
            <p className={styles.sectionDescription}>Manage user roles and permissions.</p>
            {/* Add permissions content */}
          </div>
        )
      case 'settings':
        return (
          <SettingsContent />
        )
      case 'books':
        return (
          <div className={styles.sectionContent}>
            <BooksList />
          </div>
        )
    }
  }

  // Add effect to handle sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Initial check

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Filter courses based on search and filter criteria
  useEffect(() => {
    // Always execute the filtering logic regardless of courses length
    // This ensures hooks are always called in the same order
    let filteredResults: Course[] = [];

    if (courses && courses.length > 0) {
      filteredResults = courses.filter(course => {
        // Search filter
        const matchesSearch = course.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
                            course.description.toLowerCase().includes(courseSearch.toLowerCase()) ||
                            (course.category && course.category.toLowerCase().includes(courseSearch.toLowerCase()));

        // Status filter
        const matchesStatus = courseFilter === 'all' || course.status === courseFilter;

        return matchesSearch && matchesStatus;
      });

      // Apply sorting
      filteredResults.sort((a, b) => {
        if (courseSortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (courseSortBy === 'popular') {
          return (b.totalEnrollment || 0) - (a.totalEnrollment || 0);
        } else if (courseSortBy === 'rating') {
          return (b.averageRating || 0) - (a.averageRating || 0);
        }
        return 0;
      });
    }

    // Always set filtered courses regardless of condition
    setFilteredCourses(filteredResults);
  }, [courses, courseSearch, courseFilter, courseSortBy]);

  // Modify the useEffect that handles auth check to prevent unnecessary re-renders
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      // Log the issue but don't do anything else - we'll show the error state below
      console.log('User not authorized for admin page:', { user, loading })
    }
  // Remove the router dependency to prevent unnecessary re-renders
  }, [user, loading])

  // Keep the loading state simple
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    )
  }

  // Handle unauthorized state with a helpful message
  if (!user || user.role !== 'admin') {
    return (
      <div className={styles.unauthorizedContainer}>
        <div className={styles.unauthorizedCard}>
          <div className={styles.unauthorizedIcon}>
            <AlertCircle className="h-12 w-12" />
          </div>
          <h2 className={styles.unauthorizedTitle}>Session Expired</h2>
          <p className={styles.unauthorizedText}>
            Your session has expired or you don't have permission to access this page.
            Please log in again with an admin account.
          </p>
          <button 
            className={styles.unauthorizedButton}
            onClick={async () => {
              try {
                // Clear any existing auth state and wait for it to complete
                await logout();
                // After logout is complete, redirect to login
                window.location.href = '/login';
              } catch (error) {
                console.error('Error during logout:', error);
                // If logout fails, force navigation
                window.location.href = '/login';
              }
            }}
          >
            Log In Again
          </button>
        </div>
      </div>
    )
  }

  // Handle course actions
  const handleEditCourse = (courseId: string) => {
    const course = courses.find(c => c._id === courseId);
    if (course) {
      console.log('Selected course for editing:', course);
      setSelectedCourse(course);
      setShowCourseEditDialog(true);
    }
  };

  const handleViewCourse = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const handleAuditCourse = (courseId: string) => {
    const course = courses.find(c => c._id === courseId);
    if (course) {
      setCourseForAudit({ id: course._id, name: course.title });
      setShowCourseAudit(true);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await coursesApi.delete(courseId);
        // Remove course from state
        setCourses(courses.filter(course => course._id !== courseId));
        alert('Course successfully deleted');
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course');
      }
    }
  };

  // Handle adding a new course
  const handleAddCourse = () => {
    setSelectedCourse(null);
    setShowCourseForm(true);
  };

  // Render System Status section in dashboard
  const renderSystemStatus = () => {
    return (
      <div className={styles.gridCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            <BarChart className="h-5 w-5" /> System Status
          </h3>
          <button 
            className={styles.cardAction}
            onClick={() => window.location.hash = 'analytics'}
          >
            Details
          </button>
        </div>
        <div className={styles.statusContent}>
          <div className={styles.statusItem}>
            <div className={styles.statusLabel}>
              <span>Server Load</span>
              <span>{systemStatus.serverLoad}%</span>
            </div>
            <div className={styles.statusBar}>
              <div 
                className={`${styles.statusProgress} ${systemStatus.serverLoad > 70 ? styles.danger : systemStatus.serverLoad > 50 ? styles.warning : ''}`} 
                style={{ width: `${systemStatus.serverLoad}%` }}
              ></div>
            </div>
          </div>
          <div className={styles.statusItem}>
            <div className={styles.statusLabel}>
              <span>Storage Usage</span>
              <span>{systemStatus.storageUsage}%</span>
            </div>
            <div className={styles.statusBar}>
              <div 
                className={`${styles.statusProgress} ${systemStatus.storageUsage > 80 ? styles.danger : systemStatus.storageUsage > 60 ? styles.warning : ''}`} 
                style={{ width: `${systemStatus.storageUsage}%` }}
              ></div>
            </div>
          </div>
          <div className={styles.statusGrid}>
            <div className={styles.statusGridItem}>
              <span className={styles.statusTitle}>Students</span>
              <span className={`${styles.statusBadge} ${styles.success}`}>{dashboardStats.users.students || 0}</span>
            </div>
            <div className={styles.statusGridItem}>
              <span className={styles.statusTitle}>Instructors</span>
              <span className={styles.statusValue}>{dashboardStats.users.instructors || 0}</span>
            </div>
            <div className={styles.statusGridItem}>
              <span className={styles.statusTitle}>Active Courses</span>
              <span className={`${styles.statusBadge} ${styles.success}`}>{dashboardStats.courses.activeCourses}</span>
            </div>
            <div className={styles.statusGridItem}>
              <span className={styles.statusTitle}>Completed Courses</span>
              <span className={styles.statusValue}>{dashboardStats.courses.completedCourses || 0}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.root} ${styles.dashboardContainer}`} data-theme={theme}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.logo}>AIMA LMS</h1>
        </div>
        <nav className={styles.sidebarNav}>
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.id} className={styles.navItem}>
                <button
                  className={`${styles.navButton} ${activeSection === item.id ? styles.navButtonActive : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                >
                  <item.icon className={styles.navIcon} />
                  <span className={styles.navLabel}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Overlay to close sidebar on mobile */}
      {isSidebarOpen && (
        <div 
          className={styles.sidebarOverlay} 
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button 
              className={styles.menuButton}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className={styles.pageTitle}>
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h2>
          </div>

          <div className={styles.searchBar}>
            <Search className="h-5 w-5" />
            <input type="text" placeholder="Search..." />
          </div>

          <div className={styles.topBarRight}>
            <button className={styles.themeToggle} onClick={toggleTheme}>
              <ThemeIcon className="h-5 w-5" />
            </button>
            
            <div className={styles.notifications}>
              <button 
                className={styles.notificationButton}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <Bell className="h-5 w-5" />
                <span className={styles.notificationBadge}>2</span>
              </button>
              {isNotificationsOpen && (
                <div className={styles.notificationsDropdown}>
                  {notifications.map((notification, index) => (
                    <div key={index} className={styles.notificationItem}>
                      <div className={styles.notificationTitle}>{notification.title}</div>
                      <div className={styles.notificationDescription}>{notification.description}</div>
                      <div className={styles.notificationTime}>{notification.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.userMenu}>
              <button 
                className={`${styles.userMenuButton} ${isUserMenuOpen ? styles.userMenuOpen : ''}`}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.firstName}</span>
                  <span className={styles.userEmail}>{user.email}</span>
                </div>
                <ChevronDown className="h-5 w-5" />
              </button>

              {isUserMenuOpen && (
                <div className={styles.userMenuDropdown}>
                  <button 
                    className={styles.userMenuLink}
                    onClick={() => handleProfileAction('settings')}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button 
                    className={`${styles.userMenuLink} ${styles.logoutButton}`}
                    onClick={() => handleProfileAction('logout')}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className={styles.dashboardContent}>
          {renderSectionContent()}
        </div>
        
        {/* Modals */}
        {isAddStudentModalOpen && (
          <StudentForm 
            onClose={() => {
              setIsAddStudentModalOpen(false);
              setSelectedStudent(null);
            }}
            onSuccess={handleFormSuccess}
            student={selectedStudent || undefined}
            title={selectedStudent ? 'Edit Student' : 'Add New Student'}
          />
        )}
        
        {isStudentDetailModalOpen && selectedStudent && (
          <StudentDetail 
            studentId={selectedStudent.id}
            onClose={() => {
              setIsStudentDetailModalOpen(false);
              setSelectedStudent(null);
            }}
            onEdit={handleEditStudent}
            onEnroll={handleEnrollStudent}
          />
        )}
        
        {isEnrollmentModalOpen && selectedStudent && (
          <EnrollmentForm 
            student={selectedStudent}
            onClose={() => {
              setIsEnrollmentModalOpen(false);
              setSelectedStudent(null);
            }}
            onSuccess={handleFormSuccess}
          />
        )}
        
        {showCourseForm && (
          <CourseForm
            onClose={() => setShowCourseForm(false)}
            onSuccess={fetchCourses}
            title="Add New Course"
          />
        )}
        
        {showCourseEditDialog && selectedCourse && (
          <CourseEditDialog
            course={selectedCourse}
            onClose={() => setShowCourseEditDialog(false)}
            onSuccess={fetchCourses}
          />
        )}
        
        {showCourseAudit && courseForAudit && (
          <CourseAuditDialog
            courseId={courseForAudit.id}
            courseName={courseForAudit.name}
            onClose={() => {
              setShowCourseAudit(false);
              setCourseForAudit(null);
            }}
          />
        )}
      </main>
    </div>
  )
} 