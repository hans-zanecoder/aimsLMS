'use client'

import { useState, useEffect } from 'react'
import { Student, CourseBasic } from '@/types'
import { studentsApi, coursesApi } from '@/utils/api'
import styles from './StudentDetail.module.css'
import { X, Mail, Phone, MapPin, Calendar, BookOpen, BarChart, Plus, Users, Building } from 'lucide-react'

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
  const [availableCourses, setAvailableCourses] = useState<CourseBasic[]>([])
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch detailed student data
        const studentData = await studentsApi.getById(studentId)
        setStudent(studentData)
        
        // Fetch available courses for enrollment
        const coursesData = await coursesApi.getAll({ status: 'Published' })
        setAvailableCourses(coursesData)
      } catch (error) {
        console.error('Error fetching student details:', error)
        setError('Failed to load student details. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [studentId])
  
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
            
            <div className={styles.infoSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Enrolled Courses</h4>
                <button
                  className={styles.actionButton}
                  onClick={handleEnroll}
                >
                  <Plus className="h-4 w-4" />
                  Enroll in Course
                </button>
              </div>
              
              {student.coursesList && student.coursesList.length > 0 ? (
                <ul className={styles.coursesList}>
                  {student.coursesList.map(course => (
                    <li key={course.id} className={styles.courseItem}>
                      <div className={styles.courseIcon}>
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className={styles.courseInfo}>
                        <span className={styles.courseTitle}>{course.title}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.emptyState}>
                  <BookOpen className="h-12 w-12 text-gray-400" />
                  <p>Not enrolled in any courses</p>
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