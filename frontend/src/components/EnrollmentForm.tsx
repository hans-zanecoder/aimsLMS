'use client'

import { useState, useEffect } from 'react'
import { Student, CourseBasic } from '@/types'
import { studentsApi, coursesApi } from '@/utils/api'
import styles from './EnrollmentForm.module.css'
import { X, Search, Check } from 'lucide-react'

interface EnrollmentFormProps {
  student: Student
  onClose: () => void
  onSuccess: () => void
}

export default function EnrollmentForm({ student, onClose, onSuccess }: EnrollmentFormProps) {
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courses, setCourses] = useState<CourseBasic[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Get student's enrolled course IDs
  const enrolledCourseIds = student.coursesList 
    ? student.coursesList.map(course => course.id) 
    : []
  
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch available published courses
        const coursesData = await coursesApi.getAll({ status: 'Published' })
        setCourses(coursesData)
      } catch (error) {
        console.error('Error fetching courses:', error)
        setError('Failed to load available courses. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourses()
  }, [])
  
  const handleEnroll = async () => {
    if (!selectedCourseId) return
    
    setEnrolling(true)
    setError(null)
    
    try {
      await studentsApi.enroll(student.id, selectedCourseId)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error enrolling student:', error)
      setError('Failed to enroll student in the selected course. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }
  
  // Filter courses based on search query and exclude already enrolled courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase())
    const notAlreadyEnrolled = !enrolledCourseIds.includes(course.id)
    return matchesSearch && notAlreadyEnrolled
  })

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Enroll in Course</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <div className={styles.studentInfo}>
            <span className={styles.label}>Student:</span>
            <span className={styles.value}>{student.name}</span>
          </div>
          
          <div className={styles.searchContainer}>
            <div className={styles.searchInputWrapper}>
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <span>Loading courses...</span>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className={styles.emptyState}>
              {searchQuery ? (
                <>
                  <p>No matching courses found</p>
                  <p className={styles.emptyStateSubText}>Try a different search term</p>
                </>
              ) : (
                <>
                  <p>No available courses</p>
                  <p className={styles.emptyStateSubText}>Student is already enrolled in all available courses</p>
                </>
              )}
            </div>
          ) : (
            <div className={styles.courseList}>
              {filteredCourses.map(course => (
                <div
                  key={course.id}
                  className={`${styles.courseItem} ${selectedCourseId === course.id ? styles.selected : ''}`}
                  onClick={() => setSelectedCourseId(course.id)}
                >
                  <div className={styles.courseInfo}>
                    <h3 className={styles.courseTitle}>{course.title}</h3>
                  </div>
                  {selectedCourseId === course.id && (
                    <div className={styles.selectedIcon}>
                      <Check className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={enrolling}
          >
            Cancel
          </button>
          <button
            className={styles.enrollButton}
            onClick={handleEnroll}
            disabled={!selectedCourseId || enrolling}
          >
            {enrolling ? 'Enrolling...' : 'Enroll in Course'}
          </button>
        </div>
      </div>
    </div>
  )
} 