'use client'

import { useState, useEffect } from 'react'
import { Student, Course } from '@/types'
import { studentsApi, coursesApi } from '@/utils/api'
import styles from './StudentDetail.module.css'
import { X, Mail, Phone, MapPin, Calendar, BookOpen, BarChart, Plus, Users, Building, AlertCircle, CheckCircle, XCircle, ChevronRight, Clock, Badge, Loader2 } from 'lucide-react'

interface StudentDetailProps {
  studentId: string
  onClose: () => void
  onEdit: (student: Student) => void
  onEnroll: (student: Student) => void
}

export default function StudentDetail({ studentId, onClose, onEdit, onEnroll }: StudentDetailProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false)
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAssignCourses, setShowAssignCourses] = useState(false)
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch detailed student data
        const studentData = await studentsApi.getById(studentId)
        setStudent(studentData)
        
        // If student has courses, fetch their details
        if (studentData.coursesList && studentData.coursesList.length > 0) {
          setLoadingCourses(true)
          try {
            const enrolledCoursesData = await Promise.all(
              studentData.coursesList.map(course => 
                coursesApi.getById(course.id)
              )
            )
            setEnrolledCourses(enrolledCoursesData)
          } catch (courseError) {
            console.error('Error fetching enrolled courses:', courseError)
          } finally {
            setLoadingCourses(false)
          }
        }
        
        // Fetch available courses for enrollment
        const allCoursesData = await coursesApi.getAll({ status: 'Published' })
        setAvailableCourses(allCoursesData)
      } catch (error) {
        console.error('Error fetching student details:', error)
        setError('Failed to load student details. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [studentId])
  
  const handleDirectEnroll = async () => {
    if (!selectedCourseId || !student) return
    
    setEnrolling(true)
    setEnrollmentError(null)
    setEnrollmentSuccess(false)
    
    try {
      await studentsApi.enroll(student.id, selectedCourseId)
      
      // Update the local student data
      const enrolledCourse = availableCourses.find(c => c._id === selectedCourseId)
      if (enrolledCourse) {
        // Add to enrolled courses
        setEnrolledCourses([...enrolledCourses, enrolledCourse])
        
        // Update student object
        const courseInfo = {
          id: enrolledCourse._id,
          title: enrolledCourse.title
        }
        
        setStudent({
          ...student,
          coursesEnrolled: (student.coursesEnrolled || 0) + 1,
          coursesList: [...(student.coursesList || []), courseInfo]
        })
      }
      
      setEnrollmentSuccess(true)
      setSelectedCourseId(null)
      setTimeout(() => {
        setEnrollmentSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Error enrolling student:', error)
      setEnrollmentError('Failed to enroll student in the selected course. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }
  
  const handleUnenroll = async (courseId: string) => {
    if (!student) return
    
    if (window.confirm('Are you sure you want to unenroll this student from the course?')) {
      try {
        // Call API to unenroll student
        await studentsApi.unenroll(student.id, courseId)
        
        // Update local state
        setEnrolledCourses(enrolledCourses.filter(c => c._id !== courseId))
        
        // Update student object
        setStudent({
          ...student,
          coursesEnrolled: Math.max(0, (student.coursesEnrolled || 0) - 1),
          coursesList: (student.coursesList || []).filter(c => c.id !== courseId)
        })
        
        setEnrollmentSuccess(true)
        setTimeout(() => {
          setEnrollmentSuccess(false)
        }, 3000)
      } catch (error) {
        console.error('Error unenrolling student:', error)
        setEnrollmentError('Failed to unenroll student from the course. Please try again.')
      }
    }
  }
  
  if (loading) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <span>Loading student information...</span>
          </div>
        </div>
      </div>
    )
  }
  
  if (error || !student) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Error</h2>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className={styles.errorContainer}>
            <p>{error || 'Student not found'}</p>
            <button onClick={onClose} className={styles.button}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  const handleEdit = () => {
    onEdit(student)
  }
  
  const handleEnroll = () => {
    onEnroll(student)
  }
  
  // Filter available courses that student isn't already enrolled in
  const enrolledCourseIds = student.coursesList?.map(course => course.id) || []
  
  const filteredAvailableCourses = availableCourses.filter(course => 
    !enrolledCourseIds.includes(course._id) &&
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Student Profile</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className={styles.studentProfile}>
          <div className={styles.profileHeader}>
            <div className={styles.studentAvatar}>
              {student.name.charAt(0)}
            </div>
            <div className={styles.studentInfo}>
              <h3 className={styles.studentName}>{student.name}</h3>
              <div className={styles.studentMeta}>
                <span className={`${styles.statusBadge} ${styles[student.status.toLowerCase()]}`}>
                  {student.status}
                </span>
                <span className={styles.emailLabel}>
                  <Mail className="h-4 w-4" />
                  {student.email}
                </span>
                {student.phone && (
                  <span className={styles.contactLabel}>
                    <Phone className="h-4 w-4" />
                    {student.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className={styles.profileContent}>
            <div className={styles.infoSection}>
              <h4 className={styles.sectionTitle}>Personal Information</h4>
              <div className={styles.infoGrid}>
                {student.location && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <MapPin className="h-4 w-4" />
                      Location
                    </div>
                    <div className={styles.infoValue}>
                      {student.location}
                    </div>
                  </div>
                )}
                
                {student.department && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <Building className="h-4 w-4" />
                      Department
                    </div>
                    <div className={styles.infoValue}>
                      {student.department}
                    </div>
                  </div>
                )}

                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <Users className="h-4 w-4" />
                    Account Status
                  </div>
                  <div className={styles.infoValue}>
                    <span className={`${styles.statusIndicator} ${styles[student.status.toLowerCase()]}`}>
                      {student.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.infoSection}>
              <h4 className={styles.sectionTitle}>Enrollment Information</h4>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <Calendar className="h-4 w-4" />
                    Enrollment Date
                  </div>
                  <div className={styles.infoValue}>
                    {new Date(student.enrollmentDate).toLocaleDateString()}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <BookOpen className="h-4 w-4" />
                    Courses Enrolled
                  </div>
                  <div className={styles.infoValue}>
                    {student.coursesEnrolled} course(s)
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <BarChart className="h-4 w-4" />
                    Overall Progress
                  </div>
                  <div className={styles.infoValue}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${student.progress}%` }}
                      ></div>
                      <span className={styles.progressText}>{student.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enrolled Courses Section */}
            <div className={styles.infoSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Enrolled Courses</h4>
                <div className={styles.actionButtons}>
                  <button
                    className={styles.actionButton}
                    onClick={() => setShowAssignCourses(!showAssignCourses)}
                  >
                    <Plus className="h-4 w-4" />
                    {showAssignCourses ? 'Cancel' : 'Assign Course'}
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={handleEnroll}
                  >
                    <BookOpen className="h-4 w-4" />
                    Full Enrollment
                  </button>
                </div>
              </div>
              
              {/* Success/Error Messages */}
              {enrollmentSuccess && (
                <div className={styles.successMessage}>
                  <CheckCircle className="h-5 w-5" />
                  Course enrollment updated successfully!
                </div>
              )}
              
              {enrollmentError && (
                <div className={styles.errorMessage}>
                  <AlertCircle className="h-5 w-5" />
                  {enrollmentError}
                </div>
              )}
              
              {/* Quick Course Assignment Interface */}
              {showAssignCourses && (
                <div className={styles.assignCoursesContainer}>
                  <div className={styles.searchInputWrapper}>
                    <input
                      type="text"
                      placeholder="Search available courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>
                  
                  {filteredAvailableCourses.length === 0 ? (
                    <div className={styles.emptySearchState}>
                      {searchQuery ? 'No matching courses found' : 'No available courses for enrollment'}
                    </div>
                  ) : (
                    <div className={styles.courseSelection}>
                      {filteredAvailableCourses.map(course => (
                        <div
                          key={course._id}
                          className={`${styles.courseOption} ${selectedCourseId === course._id ? styles.selectedCourse : ''}`}
                          onClick={() => setSelectedCourseId(course._id)}
                        >
                          <div className={styles.courseOptionInfo}>
                            <div className={styles.courseOptionTitle}>{course.title}</div>
                            <div className={styles.courseOptionMeta}>
                              {course.level} • {course.category}
                              {course.startDate && ` • Starts: ${new Date(course.startDate).toLocaleDateString()}`}
                            </div>
                          </div>
                          <div className={styles.courseOptionCheck}>
                            {selectedCourseId === course._id && <CheckCircle className="h-4 w-4" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className={styles.assignButtonContainer}>
                    <button
                      className={styles.cancelAssignButton}
                      onClick={() => {
                        setShowAssignCourses(false)
                        setSelectedCourseId(null)
                        setSearchQuery('')
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.assignButton}
                      disabled={!selectedCourseId || enrolling}
                      onClick={handleDirectEnroll}
                    >
                      {enrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      {enrolling ? 'Enrolling...' : 'Assign Selected Course'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Enrolled Courses List */}
              {loadingCourses ? (
                <div className={styles.loadingContainer}>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading enrolled courses...</span>
                </div>
              ) : student.coursesList && student.coursesList.length > 0 ? (
                <div className={styles.enrolledCoursesContainer}>
                  {enrolledCourses.length > 0 ? (
                    enrolledCourses.map(course => (
                      <div key={course._id} className={styles.enrolledCourseCard}>
                        <div className={styles.enrolledCourseImage}>
                          {course.image ? (
                            <img src={course.image} alt={course.title} />
                          ) : (
                            <div className={styles.courseImagePlaceholder}>
                              <BookOpen className="h-6 w-6" />
                            </div>
                          )}
                          <div className={`${styles.courseStatus} ${styles[course.status.toLowerCase()]}`}>
                            {course.status}
                          </div>
                        </div>
                        <div className={styles.enrolledCourseInfo}>
                          <h5 className={styles.enrolledCourseTitle}>{course.title}</h5>
                          <div className={styles.enrolledCourseMeta}>
                            <span className={styles.courseCategory}>{course.category}</span>
                            <span className={styles.courseLevel}>{course.level}</span>
                          </div>
                          {course.startDate && course.endDate && (
                            <div className={styles.courseDates}>
                              <Clock className="h-4 w-4" />
                              <span>
                                {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          <div className={styles.courseProgress}>
                            <span className={styles.progressLabel}>Progress:</span>
                            <div className={styles.progressBar}>
                              <div
                                className={styles.progressFill}
                                style={{ width: `${0}%` }}
                              ></div>
                              <span className={styles.progressText}>0%</span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.enrolledCourseActions}>
                          <button
                            className={styles.viewCourseButton}
                            onClick={() => window.open(`/courses/${course._id}`, '_blank')}
                          >
                            <ChevronRight className="h-4 w-4" />
                            View Course
                          </button>
                          <button
                            className={styles.unenrollButton}
                            onClick={() => handleUnenroll(course._id)}
                          >
                            <XCircle className="h-4 w-4" />
                            Unenroll
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    student.coursesList.map(course => (
                      <div key={course.id} className={styles.simpleEnrolledCourse}>
                        <div className={styles.simpleEnrolledCourseInfo}>
                          <BookOpen className="h-5 w-5" />
                          <span>{course.title}</span>
                        </div>
                        <button
                          className={styles.unenrollButton}
                          onClick={() => handleUnenroll(course.id)}
                        >
                          <XCircle className="h-4 w-4" />
                          Unenroll
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <BookOpen className="h-12 w-12 text-gray-400" />
                  <p>Not enrolled in any courses</p>
                  <button
                    className={styles.emptyStateButton}
                    onClick={() => setShowAssignCourses(true)}
                  >
                    Assign to a Course
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.profileActions}>
            <button
              className={styles.secondaryButton}
              onClick={onClose}
            >
              Close
            </button>
            <button
              className={styles.primaryButton}
              onClick={handleEdit}
            >
              Edit Student
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 