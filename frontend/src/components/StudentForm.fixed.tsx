'use client'

import { useState, useEffect, useRef } from 'react'
import { Student, User, CourseBasic } from '@/types'
import { studentsApi, coursesApi } from '@/utils/api'
import styles from './StudentForm.module.css'
import { X, User as UserIcon, Mail, Phone, MapPin, Calendar, BookOpen, Check, ChevronRight, Search, Save, Plus, Home, Building, GraduationCap, XCircle } from 'lucide-react'

interface StudentFormProps {
  onClose: () => void
  onSuccess: () => void
  student?: Student // If provided, we're in edit mode
  title?: string
}

// Campus options
const CAMPUS_OPTIONS = [
  { value: 'santa_ana', label: 'Santa Ana' },
  { value: 'south_gate', label: 'South Gate' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'online', label: 'Online' }
];

// Practical location options (for Hybrid campus)
const PRACTICAL_LOCATION_OPTIONS = [
  { value: 'santa_ana', label: 'Santa Ana' },
  { value: 'south_gate', label: 'South Gate' }
];

// US States for dropdown
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' }
];

export default function StudentForm({ onClose, onSuccess, student, title = 'Add New Student' }: StudentFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('basic') // 'basic', 'enrollment'
  const [availableCourses, setAvailableCourses] = useState<CourseBasic[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    streetAddress: '',
    unit: '',
    city: '',
    state: 'CA',
    zipCode: '',
    phone: '',
    campus: 'santa_ana',
    practicalLocation: 'santa_ana',
    status: 'Active' as 'Active' | 'Inactive' | 'Pending'
  })

  // Add state to control edit mode for identity fields
  const [identityFieldsEditable, setIdentityFieldsEditable] = useState(false)
  // Add state to show confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  // Track original identity values to detect changes
  const [originalIdentity, setOriginalIdentity] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })

  const formRef = useRef<HTMLFormElement>(null);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle error dismissal
  const dismissError = () => {
    setError(null);
  };

  // Rest of your component code...
  // (Include all the functions and logic from the original file)

  // Filter courses based on search query
  const filteredCourses = availableCourses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div className={`${styles.modalOverlay} ${styles.root}`}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
              {student ? `Edit Student: ${student.name}` : title}
            </h2>
            <button className={styles.closeButton} onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className={styles.errorContainer}>
              <div className={styles.errorMessage}>
                {error}
                <button 
                  type="button" 
                  className={styles.dismissErrorButton}
                  onClick={dismissError}
                  aria-label="Dismiss error"
                >
                  <XCircle size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Show identity edit warning for existing students */}
          {student && !identityFieldsEditable && (
            <div className={styles.identityEditControl}>
              <p>To edit student identity information (name or email), click the button below:</p>
              <button 
                type="button" 
                className={styles.editIdentityButton}
                onClick={() => setShowConfirmDialog(true)}
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Enable Identity Editing
              </button>
              <p className={styles.identityEditNote}>
                Note: Changing a student's identity information may affect their access to courses and records. Only use for correcting typos or mistakes.
              </p>
            </div>
          )}

          <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>
            {/* Your form content here */}
            {/* (Include all the form content from the original file) */}
          </form>
        </div>
      </div>

      {/* Confirmation Dialog for Identity Editing */}
      {showConfirmDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Confirm Identity Editing</h3>
              <button 
                type="button" 
                className={styles.closeButton}
                onClick={() => setShowConfirmDialog(false)}
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Are you sure you want to enable editing of student identity information?</p>
              <p className={styles.warningText}>
                Changing identity information (name or email) may affect the student's access to courses and records.
                Only use this feature to correct typos or mistakes.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </button>
              <button 
                type="button"
                className={styles.confirmButton}
                onClick={() => {
                  setIdentityFieldsEditable(true);
                  setShowConfirmDialog(false);
                }}
              >
                Enable Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
