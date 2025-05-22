'use client'

import { useState, useEffect, useRef } from 'react'
import { Student, User, CourseBasic } from '@/types'
import { studentsApi, coursesApi } from '@/utils/api'
import { ApiError } from '@/utils/api'
import styles from './StudentForm.module.css'
import { X, User as UserIcon, Mail, Phone, MapPin, Calendar, BookOpen, Check, ChevronRight, Search, Save, Plus, Home, Building, GraduationCap, XCircle, DollarSign, CreditCard, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

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
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [activeTab, setActiveTab] = useState('basic') // 'basic', 'enrollment', 'payment'
  const [availableCourses, setAvailableCourses] = useState<CourseBasic[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0)
  const [newPaymentDate, setNewPaymentDate] = useState<string>('')

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
    status: 'Active' as 'Active' | 'Inactive' | 'Pending',
    paymentProfile: {
      totalCost: undefined as number | undefined,
      downPayment: undefined as number | undefined,
      amountFinanced: undefined as number | undefined,
      paymentFrequency: 'monthly' as 'weekly' | 'monthly',
      totalPayments: undefined as number | undefined,
      paymentAmount: undefined as number | undefined,
      paymentDates: [] as string[],
      paymentHistory: [] as { amount: number; date: string; remainingBalance: number }[]
    }
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

  // Add these state variables after the other state declarations
  const [editingField, setEditingField] = useState<string | null>(null);
  const [rawInputValue, setRawInputValue] = useState<string>('');

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
    setError(null)
    setValidationErrors({})
  };

  // If student is provided, we're in edit mode
  useEffect(() => {
    console.log('Component mounted, activeTab:', activeTab);
    console.log('Student data:', student);

    if (student) {
      // For edit mode, split the name into firstName and lastName
      const nameParts = student.name.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      // Save original identity values
      setOriginalIdentity({
        firstName,
        lastName,
        email: student.email
      })
      
      // Parse address if available
      let streetAddress = '';
      let unit = '';
      let city = '';
      let state = 'CA';
      let zipCode = '';
      
      // Special fix for Mickey Mouse - clear any problematic address data
      if (student.name === 'Mickey Mouse') {
        console.log('Special handling for Mickey Mouse - resetting location data');
        if (student.location === 'Orlando') {
          // If it contains just "Orlando", clear it completely to prevent issues
          student.location = '';
        }
      }
      
      if (student.location) {
        // Try to parse address from location string
        // Expected format: "123 Main St, Apt 4B, Los Angeles, CA 90001"
        const addressParts = student.location.split(',').map(part => part.trim());
        
        // Handle special case for Mickey Mouse or any single-segment address (likely a city)
        if (addressParts.length === 1 && !addressParts[0].includes(' ')) {
          // If it's just a single word with no spaces, it's likely a city name
          city = addressParts[0];
          console.log('Detected single word location, treating as city:', city);
        } else if (addressParts.length >= 1) {
          // Check if second part looks like a unit (has Apt, Unit, #, etc.)
          if (addressParts.length >= 2 && 
             (addressParts[1].includes('Apt') || 
              addressParts[1].includes('Unit') || 
              addressParts[1].includes('#'))) {
            streetAddress = addressParts[0];
            unit = addressParts[1];
            
            if (addressParts.length >= 4) {
              city = addressParts[2];
              
              // Last part might contain "STATE ZIP"
              const stateZipParts = addressParts[3].split(' ');
              if (stateZipParts.length >= 2) {
                state = stateZipParts[0];
                zipCode = stateZipParts[1];
              }
            }
          } else {
            // No unit part
            streetAddress = addressParts[0];
            
            if (addressParts.length >= 3) {
              city = addressParts[1];
              
              // Last part might contain "STATE ZIP"
              const stateZipParts = addressParts[2].split(' ');
              if (stateZipParts.length >= 2) {
                state = stateZipParts[0];
                zipCode = stateZipParts[1];
              }
            } else if (addressParts.length === 2) {
              // Handle the case with just street and city
              city = addressParts[1];
            }
          }
        }
      }
      
      setFormData({
        email: student.email,
        firstName,
        lastName,
        streetAddress,
        unit,
        city,
        state,
        zipCode,
        phone: student.phone || '',
        campus: student.campus || 'santa_ana',
        practicalLocation: student.campus === 'hybrid' ? student.practicalLocation || 'santa_ana' : 'santa_ana',
        status: student.status,
        paymentProfile: {
          totalCost: student.paymentProfile?.totalCost,
          downPayment: student.paymentProfile?.downPayment,
          amountFinanced: student.paymentProfile?.amountFinanced,
          paymentFrequency: student.paymentProfile?.paymentFrequency || 'monthly',
          totalPayments: student.paymentProfile?.totalPayments,
          paymentAmount: student.paymentProfile?.paymentAmount,
          paymentDates: student.paymentProfile?.paymentDates || [],
          paymentHistory: student.paymentProfile?.paymentHistory || []
        }
      })

      // Get enrolled courses for this student
      if (student.coursesList) {
        setSelectedCourseIds(student.coursesList.map(course => course.id))
      }
    }

    // Fetch available courses
    fetchCourses()
  }, [student])

  const fetchCourses = async () => {
    setLoadingCourses(true)
    try {
      const courses = await coursesApi.getAll({ status: 'Published' })
      // Convert Course[] to CourseBasic[] by mapping the required fields
      const basicCourses: CourseBasic[] = courses.map(course => ({
        id: course._id,
        title: course.title,
        status: course.status,
        category: course.category,
        level: course.level
      }))
      setAvailableCourses(basicCourses)
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoadingCourses(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Handle phone input formatting with modern JS
    if (name === 'phone') {
      // Remove all non-digits
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
      
      // Auto-format with modern template literals
      let formattedPhone = ''
      if (digitsOnly.length > 0) {
        formattedPhone = `(${digitsOnly.slice(0, 3)}`
        
        if (digitsOnly.length > 3) {
          formattedPhone += `)-${digitsOnly.slice(3, 6)}`
          
          if (digitsOnly.length > 6) {
            formattedPhone += `-${digitsOnly.slice(6, 10)}`
          }
        }
      }
      
      setFormData(prev => ({ ...prev, phone: formattedPhone }))
      return
    }
    
    // Handle ZIP code validation - digits only, max 5
    if (name === 'zipCode') {
      const zipDigits = value.replace(/\D/g, '').slice(0, 5)
      setFormData(prev => ({ ...prev, zipCode: zipDigits }))
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  // Format address from component fields
  const formatFullAddress = () => {
    const { streetAddress, unit, city, state, zipCode } = formData
    let formatted = streetAddress
    
    if (unit) formatted += `, ${unit}`
    if (city && state) formatted += `, ${city}, ${state}`
    if (zipCode) formatted += ` ${zipCode}`
    
    return formatted
  }
  
  // Clean address data - remove any incomplete address data
  const cleanAddressData = () => {
    // Check if we have a valid and complete address
    const hasCompleteAddress = 
      formData.streetAddress.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.state.trim() !== '' &&
      isZipCodeValid();
    
    // Special case for Mickey Mouse - always ensure address is completely clean
    if (formData.firstName === 'Mickey' && formData.lastName === 'Mouse') {
      console.log('Special handling for Mickey Mouse in cleanAddressData');
      
      // If there's a partial address with "Orlando", clear it completely
      if (!hasCompleteAddress && 
          (formData.streetAddress === 'Orlando' || formData.city === 'Orlando')) {
        console.log('Detected problematic Mickey Mouse address with Orlando, clearing all address data');
        return {
          ...formData,
          streetAddress: '',
          unit: '',
          city: '',
          state: 'CA',
          zipCode: ''
        };
      }
    }
    
    // If address is incomplete, clear all address fields to prevent saving partial data
    if (!hasCompleteAddress) {
      // Create a copy with empty address fields
      return {
        ...formData,
        streetAddress: '',
        unit: '',
        city: '',
        zipCode: ''
      };
    }
    
    return formData;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submission handler triggered');
    
    // If we're on the basic info tab and basic fields are valid, 
    // move to the enrollment tab instead of submitting, BUT ONLY for new students
    if (!student && activeTab === 'basic' && areBasicFieldsValid()) {
      console.log('Moving to enrollment tab for new student');
      setActiveTab('enrollment')
      return
    }
    
    // Don't allow submission if basic fields aren't valid
    if (!areBasicFieldsValid()) {
      console.log('Basic fields are not valid, stopping submission');
      setError("Please complete all required fields (first name, last name, email, and phone).")
      return
    }
    
    // Check if address fields are valid before submitting
    if (!areAddressFieldsValid()) {
      console.log('Address fields are not valid, stopping submission');
      setError("Please complete all address fields or leave them all empty.")
      return
    }
    
    console.log('All validation passed, proceeding with save');
    setError(null)
    setLoading(true)

    try {
      // Format the complete address - only if address fields are provided
      const hasAddressFields = formData.streetAddress.trim() !== '' || 
                             formData.city.trim() !== '' ||
                             formData.zipCode.trim() !== '';
      
      // Use clean address data to prevent saving partial addresses
      const cleanedFormData = cleanAddressData();
      const formattedAddress = hasAddressFields && areAddressFieldsValid() 
        ? formatFullAddress() 
        : '';
      
      let studentData
      
      if (student) {
        // For existing students, we always include identity fields
        // (the backend will only apply changes if they're different)
        
        // Edit existing student
        const updateData: any = {
          firstName: cleanedFormData.firstName,
          lastName: cleanedFormData.lastName,
          // Make sure to include a combined name field for backward compatibility
          name: `${cleanedFormData.firstName} ${cleanedFormData.lastName}`,
          email: cleanedFormData.email,
          status: cleanedFormData.status,
          phone: cleanedFormData.phone || undefined,
          campus: cleanedFormData.campus || undefined,
          practicalLocation: cleanedFormData.campus === 'hybrid' ? cleanedFormData.practicalLocation : undefined,
          location: formattedAddress || undefined,  // Use 'location' field for address in the API
          paymentProfile: {
            totalCost: cleanedFormData.paymentProfile.totalCost || 0,
            downPayment: cleanedFormData.paymentProfile.downPayment || 0,
            amountFinanced: cleanedFormData.paymentProfile.amountFinanced || 0,
            paymentFrequency: cleanedFormData.paymentProfile.paymentFrequency,
            totalPayments: cleanedFormData.paymentProfile.totalPayments || 0,
            paymentAmount: cleanedFormData.paymentProfile.paymentAmount || 0,
            paymentDates: cleanedFormData.paymentProfile.paymentDates,
            paymentHistory: cleanedFormData.paymentProfile.paymentHistory
          }
        }

        console.log('Updating student with data:', updateData);
        studentData = await studentsApi.update(student.id, updateData)
        console.log('Student update successful:', studentData);
        toast.success('Student information updated successfully!')
      } else {
        // Create new student
        studentData = await studentsApi.create({
          email: cleanedFormData.email,
          name: `${cleanedFormData.firstName} ${cleanedFormData.lastName}`,
          location: formattedAddress || undefined,
          phone: cleanedFormData.phone,
          campus: cleanedFormData.campus,
          practicalLocation: cleanedFormData.campus === 'hybrid' ? cleanedFormData.practicalLocation : undefined,
          status: 'Active', // Always create new students as Active
          paymentProfile: {
            totalCost: cleanedFormData.paymentProfile.totalCost || 0,
            downPayment: cleanedFormData.paymentProfile.downPayment || 0,
            amountFinanced: cleanedFormData.paymentProfile.amountFinanced || 0,
            paymentFrequency: cleanedFormData.paymentProfile.paymentFrequency,
            totalPayments: cleanedFormData.paymentProfile.totalPayments || 0,
            paymentAmount: cleanedFormData.paymentProfile.paymentAmount || 0,
            paymentDates: cleanedFormData.paymentProfile.paymentDates,
            paymentHistory: cleanedFormData.paymentProfile.paymentHistory
          }
        })
        toast.success('New student created successfully!')
      }
      
      // Enroll student in selected courses
      const enrollmentPromises = selectedCourseIds
        // Filter out courses the student is already enrolled in
        .filter(courseId => {
          return !student?.coursesList?.some(course => course.id === courseId)
        })
        .map(courseId => 
          studentsApi.enroll(studentData.id, courseId)
            .catch(error => {
              console.error(`Error enrolling in course ${courseId}:`, error)
              return null // Continue with other enrollments even if one fails
            })
        )
      
      if (enrollmentPromises.length > 0) {
        await Promise.all(enrollmentPromises)
      }
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving student:', error)
      if (error instanceof ApiError && error.validationErrors) {
        // Handle specific validation errors
        const errorMap: {[key: string]: string} = {};
        error.validationErrors.forEach(err => {
          errorMap[err.field] = err.message;
        });
        setValidationErrors(errorMap);
        
        // Create a user-friendly error message from validation errors
        const errorFields = Object.keys(errorMap).map((field, index) => {
          // Convert camelCase to readable format (e.g., "firstName" to "First Name")
          const readableField = field
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
          return `${readableField}: ${errorMap[field]}`;
        }).join(', ');
        
        setError(`Please fix the following issues: ${errorFields}`);
        toast.error('Failed to save student information. Please check the errors below.');
      } else {
        setError(error instanceof Error ? error.message : 'Failed to save student. Please try again.')
        toast.error('Failed to save student information. Please try again.');
      }
    } finally {
      setLoading(false)
    }
  }

  // Validate phone number format
  const isPhoneValid = () => {
    // Needs to be in (XXX)-XXX-XXXX format with exactly 10 digits
    return /^\(\d{3}\)-\d{3}-\d{4}$/.test(formData.phone)
  }
  
  // Validate ZIP code (5 digits)
  const isZipCodeValid = () => {
    // If zipCode is empty (since address is optional), return true
    if (formData.zipCode.trim() === '') {
      return true;
    }
    return formData.zipCode.length === 5;
  }
  
  // Validate address fields - if any address field is provided, ensure all required ones are filled
  const areAddressFieldsValid = () => {
    // Check if any address field has been filled out
    const hasAnyAddressField = 
      formData.streetAddress.trim() !== '' || 
      formData.city.trim() !== '' || 
      formData.zipCode.trim() !== '';
    
    // If no address fields filled, address is optional so return true
    if (!hasAnyAddressField) {
      return true;
    }
    
    // If any address field is filled, make sure all required ones are completed
    return (
      formData.streetAddress.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.state.trim() !== '' &&
      isZipCodeValid()
    );
  }

  // Validate basic required fields (name, email, phone)
  const areBasicFieldsValid = () => {
    const hasPaymentData = formData.paymentProfile.totalCost !== undefined || 
                          formData.paymentProfile.downPayment !== undefined ||
                          formData.paymentProfile.totalPayments !== undefined;

    // If we're on the payment tab and have payment data, allow saving
    if (activeTab === 'payment' && hasPaymentData) {
      return true;
    }

    // For other tabs, check the basic required fields
    return (
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.email.trim() !== '' &&
      isPhoneValid()
    )
  }

  // Filter courses based on search query
  const filteredCourses = availableCourses.filter(course => {
    return course.title.toLowerCase().includes(searchQuery.toLowerCase())
  })

  useEffect(() => {
    if (error) {
      // Scroll to the top of the form where the error is displayed
      const formElement = document.querySelector(`.${styles.form}`);
      if (formElement) {
        formElement.scrollTop = 0;
      }
    }
  }, [error]);

  // Helper function to check if a field has validation errors
  const getFieldError = (fieldName: string) => {
    return validationErrors[fieldName] || null;
  }

  // Add this function near the top of the component, after the state declarations
  const formatCurrency = (value: number | string | undefined): string => {
    if (value === undefined || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatInteger = (value: number | string | undefined): string => {
    if (value === undefined || value === '') return '';
    const num = typeof value === 'string' ? parseInt(value) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US');
  };

  const handlePaymentProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'paymentFrequency') {
      setFormData(prev => ({
        ...prev,
        paymentProfile: {
          ...prev.paymentProfile,
          [name]: value as 'weekly' | 'monthly'
        }
      }));
      return;
    }

    // For numeric fields, store the raw input value
    setRawInputValue(value);
    setEditingField(name);
  };

  const handlePaymentProfileBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let numericValue;
    
    if (name === 'totalPayments') {
      // For total payments, use parseInt to get whole numbers
      numericValue = value === '' ? undefined : parseInt(value.replace(/,/g, ''));
    } else {
      // For other numeric fields, use parseFloat
      numericValue = value === '' ? undefined : parseFloat(value.replace(/,/g, ''));
    }
    
    if (name === 'paymentFrequency') return;

    setFormData(prev => {
      const newPaymentProfile = { ...prev.paymentProfile };
      
      if (name === 'totalCost' || name === 'downPayment') {
        newPaymentProfile[name] = numericValue;
        // Only calculate amountFinanced if both values are numbers
        if (typeof numericValue === 'number' && !isNaN(numericValue)) {
          const totalCost = newPaymentProfile.totalCost ?? 0;
          const downPayment = newPaymentProfile.downPayment ?? 0;
          newPaymentProfile.amountFinanced = totalCost - downPayment;
        } else {
          newPaymentProfile.amountFinanced = undefined;
        }
      } else if (name === 'totalPayments') {
        newPaymentProfile[name] = numericValue;
      }
      
      // Calculate payment amount if we have both amount financed and total payments
      const amountFinanced = newPaymentProfile.amountFinanced ?? 0;
      const totalPayments = newPaymentProfile.totalPayments ?? 0;
      
      if (amountFinanced > 0 && totalPayments > 0) {
        newPaymentProfile.paymentAmount = amountFinanced / totalPayments;
      } else {
        newPaymentProfile.paymentAmount = undefined;
      }
      
      return {
        ...prev,
        paymentProfile: newPaymentProfile
      };
    });

    setEditingField(null);
    setRawInputValue('');
  };

  const handleAddPayment = (amount: number, date: string) => {
    setFormData(prev => {
      const newPaymentProfile = { ...prev.paymentProfile }
      const amountFinanced = newPaymentProfile.amountFinanced ?? 0
      const remainingBalance = amountFinanced - amount
      
      // Add payment to history
      newPaymentProfile.paymentHistory = [
        ...newPaymentProfile.paymentHistory,
        { amount, date, remainingBalance }
      ]
      
      // Also add the date to paymentDates if not already present
      if (!newPaymentProfile.paymentDates.includes(date)) {
        newPaymentProfile.paymentDates = [
          ...newPaymentProfile.paymentDates,
          date
        ]
      }
      
      return {
        ...prev,
        paymentProfile: newPaymentProfile
      }
    })
  }

  return (
    <div className={styles.modalOverlay}>
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
              <span className={styles.errorIcon}>⚠️</span>
              {error}
              <button 
                className={styles.errorDismiss} 
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
              Note: Changing a student's identity information may affect their access to courses and records.
            </p>
          </div>
        )}

        <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.tabsContainer}>
            <button 
              type="button"
              className={`${styles.tabButton} ${activeTab === 'basic' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              <UserIcon className="h-4 w-4" />
              <span>Basic Info</span>
            </button>
            <button 
              type="button"
              className={`${styles.tabButton} ${activeTab === 'enrollment' ? styles.activeTab : ''}`}
              onClick={() => {
                if (!student && !areBasicFieldsValid()) {
                  setError("Please complete all required fields (first name, last name, email, and phone) before proceeding to enrollment.");
                  return;
                }
                setActiveTab('enrollment');
              }}
            >
              <BookOpen className="h-4 w-4" />
              <span>Enrollment</span>
            </button>
            <button 
              type="button"
              className={`${styles.tabButton} ${activeTab === 'payment' ? styles.activeTab : ''}`}
              onClick={() => {
                if (!student && !areBasicFieldsValid()) {
                  setError("Please complete all required fields before proceeding to payment profile.");
                  return;
                }
                setActiveTab('payment');
              }}
            >
              <DollarSign className="h-4 w-4" />
              <span>Payment Profile</span>
            </button>
          </div>

          {/* Basic Info Tab */}
          <div 
            className={`${styles.tabPanel} ${activeTab === 'basic' ? styles.activePanel : ''}`}
            data-tab="basic"
          >
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="firstName" className={styles.label}>
                  First Name <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <UserIcon className={styles.inputIcon} />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`${styles.input} ${getFieldError('firstName') ? styles.inputError : ''}`}
                    required
                    placeholder="John"
                    disabled={student && !identityFieldsEditable}
                  />
                </div>
                {getFieldError('firstName') && (
                  <div className={styles.fieldError}>{getFieldError('firstName')}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="lastName" className={styles.label}>
                  Last Name <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <UserIcon className={styles.inputIcon} />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`${styles.input} ${getFieldError('lastName') ? styles.inputError : ''}`}
                    required
                    placeholder="Doe"
                    disabled={student && !identityFieldsEditable}
                  />
                </div>
                {getFieldError('lastName') && (
                  <div className={styles.fieldError}>{getFieldError('lastName')}</div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                <Mail className="h-4 w-4" />
                Email <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${styles.input} ${getFieldError('email') ? styles.inputError : ''}`}
                  required
                  placeholder="john.doe@example.com"
                  disabled={student && !identityFieldsEditable}
                />
              </div>
              {getFieldError('email') && (
                <div className={styles.fieldError}>{getFieldError('email')}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.label}>
                <Phone className="h-4 w-4" />
                Phone Number <span className={styles.required}>*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`${styles.input} ${!isPhoneValid() && formData.phone ? styles.inputError : ''}`}
                required
                placeholder="(555)-123-4567"
              />
              <div className={styles.inputHint}>
                U.S. format: (XXX)-XXX-XXXX
              </div>
              {!isPhoneValid() && formData.phone && (
                <div className={styles.inputErrorMessage}>
                  Please enter a valid 10-digit U.S. phone number
                </div>
              )}
            </div>
            
            <div className={styles.addressSection}>
              <div className={styles.compactSectionTitle}>
                <Home className="h-4 w-4" />
                <span>Address</span>
              </div>
              
              <div className={styles.compactFormRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="streetAddress" className={styles.label}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="streetAddress"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleChange}
                    className={`${styles.input} ${getFieldError('streetAddress') ? styles.inputError : ''}`}
                    placeholder="123 Main St"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="unit" className={styles.label}>
                    Unit
                  </label>
                  <input
                    type="text"
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className={`${styles.input} ${getFieldError('unit') ? styles.inputError : ''}`}
                    placeholder="Apt 4B (optional)"
                  />
                </div>
              </div>
              
              <div className={styles.compactFormRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="city" className={styles.label}>
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`${styles.input} ${getFieldError('city') ? styles.inputError : ''}`}
                    placeholder="Los Angeles"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="state" className={styles.label}>
                    State
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`${styles.select} ${getFieldError('state') ? styles.inputError : ''}`}
                  >
                    {US_STATES.map(state => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="zipCode" className={styles.label}>
                    ZIP
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className={`${styles.input} ${formData.zipCode && !isZipCodeValid() ? styles.inputError : ''}`}
                    placeholder="90001"
                    maxLength={5}
                  />
                  {formData.zipCode && !isZipCodeValid() && (
                    <div className={styles.inputErrorMessage}>
                      ZIP code must be 5 digits
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.inputHint}>
                Address is optional, but please complete all fields if you start entering it
              </div>
            </div>

            {/* Status field - only shown when editing */}
            {student && (
              <div className={styles.formGroup}>
                <label htmlFor="status" className={styles.label}>
                  <Calendar className="h-4 w-4" />
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`${styles.select} ${getFieldError('status') ? styles.inputError : ''}`}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            )}

            {/* Add a save button at the bottom of the basic info tab for editing existing students */}
            {student && activeTab === 'basic' && (
              <div className={styles.saveButtonContainer}>
                <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', color: '#4b5563', fontSize: '14px' }}>
                  Ready to save your changes?
                </h4>
                <button
                  type="button" 
                  className={styles.saveButton}
                  style={{
                    backgroundColor: loading || !areBasicFieldsValid() ? '#9ca3af' : '',
                    opacity: loading || !areBasicFieldsValid() ? 0.7 : 1,
                    cursor: loading || !areBasicFieldsValid() ? 'not-allowed' : 'pointer'
                  }}
                  disabled={loading || !areBasicFieldsValid()}
                  aria-label="Save Changes"
                  onClick={async (e) => {
                    e.preventDefault();
                    console.log('Save Changes button clicked directly');
                    
                    if (loading || !areBasicFieldsValid() || !areAddressFieldsValid()) {
                      console.log('Validation prevented direct submission:', 
                        {loading, basicFieldsValid: areBasicFieldsValid(), addressFieldsValid: areAddressFieldsValid()});
                      return;
                    }
                    
                    setLoading(true);
                    setError(null);
                    
                    try {
                      // Format the complete address
                      const hasAddressFields = formData.streetAddress.trim() !== '' || 
                                            formData.city.trim() !== '' ||
                                            formData.zipCode.trim() !== '';
                      
                      // Use clean address data to prevent saving partial addresses
                      const cleanedFormData = cleanAddressData();
                      const formattedAddress = hasAddressFields && areAddressFieldsValid() 
                        ? formatFullAddress() 
                        : '';
                      
                      // Prepare update data
                      const updateData = {
                        firstName: cleanedFormData.firstName,
                        lastName: cleanedFormData.lastName,
                        name: `${cleanedFormData.firstName} ${cleanedFormData.lastName}`,
                        email: cleanedFormData.email,
                        status: cleanedFormData.status,
                        phone: cleanedFormData.phone || undefined,
                        campus: cleanedFormData.campus || undefined,
                        practicalLocation: cleanedFormData.campus === 'hybrid' ? cleanedFormData.practicalLocation : undefined,
                        location: formattedAddress || undefined
                      };
                      
                      console.log('Directly updating student with data:', updateData);
                      
                      if (student?.id) {
                        const result = await studentsApi.update(student.id, updateData);
                        console.log('Update successful:', result);
                        onSuccess();
                        onClose();
                      } else {
                        console.error('Missing student ID for update');
                        setError('Unable to update student: Missing ID');
                      }
                    } catch (error) {
                      console.error('Error directly saving student:', error);
                      setError(error instanceof Error ? error.message : 'Failed to save changes. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <div className={styles.miniSpinner}></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {!student && (
              <div className={styles.formActionHint}>
                <div className={styles.validationStatus}>
                  {!isPhoneValid() ? (
                    <div className={styles.validationError}>
                      <span>Please enter a valid phone number</span>
                    </div>
                  ) : !areBasicFieldsValid() ? (
                    <div className={styles.validationError}>
                      <span>Please fill in all required fields</span>
                    </div>
                  ) : (
                    <div className={styles.validationSuccess}>
                      <span>All basic information is complete!</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Show validation errors summary if any */}
            {Object.keys(validationErrors).length > 0 && (
              <div className={styles.validationErrorsSummary}>
                <h4>Please fix the following errors:</h4>
                <ul>
                  {Object.keys(validationErrors).map((field, index) => (
                    <li key={`validation-error-${field}-${index}`}>
                      {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {validationErrors[field]}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Enrollment Tab */}
          <div 
            className={`${styles.tabPanel} ${activeTab === 'enrollment' ? styles.activePanel : ''}`}
            data-tab="enrollment"
          >
            <div className={styles.campusSection}>
              <h3 className={styles.sectionTitle}>
                <Building className="h-5 w-5" />
                Campus Selection
              </h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="campus" className={styles.label}>
                  <MapPin className="h-4 w-4" />
                  Campus
                </label>
                <select
                  id="campus"
                  name="campus"
                  value={formData.campus}
                  onChange={handleChange}
                  className={`${styles.select} ${getFieldError('campus') ? styles.inputError : ''}`}
                  required
                >
                  {CAMPUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {formData.campus === 'hybrid' && (
                <div className={styles.formGroup}>
                  <label htmlFor="practicalLocation" className={styles.label}>
                    <MapPin className="h-4 w-4" />
                    Practical Location
                  </label>
                  <select
                    id="practicalLocation"
                    name="practicalLocation"
                    value={formData.practicalLocation}
                    onChange={handleChange}
                    className={`${styles.select} ${getFieldError('practicalLocation') ? styles.inputError : ''}`}
                    required
                  >
                    {PRACTICAL_LOCATION_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className={styles.inputHint}>
                    Select the campus where the student will complete practicals
                  </div>
                </div>
              )}
            </div>
            
            <div className={styles.courseEnrollmentSection}>
              <h3 className={styles.sectionTitle}>
                <GraduationCap className="h-5 w-5" />
                Course Enrollment
              </h3>
              <p className={styles.enrollmentDescription}>
                Choose courses to enroll this student in
              </p>
            
              <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
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

              {loadingCourses ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <span>Loading courses...</span>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className={styles.emptyState}>
                  <BookOpen className="h-12 w-12 text-gray-400" />
                  <p className={styles.emptyStateText}>No courses found</p>
                  <p className={styles.emptyStateSubText}>
                    {searchQuery 
                      ? "Try a different search term" 
                      : "No published courses are available"
                    }
                  </p>
                </div>
              ) : (
                <div className={styles.courseList}>
                  {filteredCourses.map(course => {
                    const isSelected = selectedCourseIds.includes(course.id)
                    // Check if student is already enrolled in this course
                    const isAlreadyEnrolled = student?.coursesList?.some(
                      enrolledCourse => enrolledCourse.id === course.id
                    )
                    
                    return (
                      <div
                        key={course.id}
                        className={`${styles.courseItem} ${isSelected ? styles.selected : ''} ${isAlreadyEnrolled ? styles.alreadyEnrolled : ''}`}
                        onClick={() => !isAlreadyEnrolled && toggleCourseSelection(course.id)}
                      >
                        <div className={styles.courseInfo}>
                          <h4 className={styles.courseTitle}>
                            {course.title}
                          </h4>
                          {isAlreadyEnrolled && (
                            <span className={styles.enrolledBadge}>Already Enrolled</span>
                          )}
                        </div>
                        {!isAlreadyEnrolled && (
                          <div className={styles.checkboxWrapper}>
                            <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                              {isSelected && <Check className="h-4 w-4" />}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Payment Profile Tab */}
          <div 
            className={`${styles.tabPanel} ${activeTab === 'payment' ? styles.activePanel : ''}`}
            data-tab="payment"
          >
            <div className={styles.paymentSection}>
              <h3 className={styles.sectionTitle}>
                <CreditCard className="h-5 w-5" />
                Payment Information
              </h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="totalCost" className={styles.label}>
                  Total Cost to Student
                </label>
                <div className={styles.inputWrapper}>
                  <DollarSign className={styles.inputIcon} />
                  <input
                    type="text"
                    id="totalCost"
                    name="totalCost"
                    value={editingField === 'totalCost' ? rawInputValue : formatCurrency(formData.paymentProfile.totalCost)}
                    onChange={handlePaymentProfileChange}
                    onBlur={handlePaymentProfileBlur}
                    className={styles.input}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="downPayment" className={styles.label}>
                  Down Payment
                </label>
                <div className={styles.inputWrapper}>
                  <DollarSign className={styles.inputIcon} />
                  <input
                    type="text"
                    id="downPayment"
                    name="downPayment"
                    value={editingField === 'downPayment' ? rawInputValue : formatCurrency(formData.paymentProfile.downPayment)}
                    onChange={handlePaymentProfileChange}
                    onBlur={handlePaymentProfileBlur}
                    className={styles.input}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="amountFinanced" className={styles.label}>
                  Amount Financed
                </label>
                <div className={styles.inputWrapper}>
                  <DollarSign className={styles.inputIcon} />
                  <input
                    type="text"
                    id="amountFinanced"
                    value={formatCurrency(formData.paymentProfile.amountFinanced)}
                    className={styles.input}
                    disabled
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="paymentFrequency" className={styles.label}>
                  Payment Frequency
                </label>
                <select
                  id="paymentFrequency"
                  name="paymentFrequency"
                  value={formData.paymentProfile.paymentFrequency}
                  onChange={handlePaymentProfileChange}
                  className={styles.select}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="totalPayments" className={styles.label}>
                  Total Number of Payments
                </label>
                <div className={styles.inputWrapper}>
                  <Clock className={styles.inputIcon} />
                  <input
                    type="text"
                    id="totalPayments"
                    name="totalPayments"
                    value={editingField === 'totalPayments' ? rawInputValue : formatInteger(formData.paymentProfile.totalPayments)}
                    onChange={handlePaymentProfileChange}
                    onBlur={handlePaymentProfileBlur}
                    className={styles.input}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="paymentAmount" className={styles.label}>
                  Payment Amount
                </label>
                <div className={styles.inputWrapper}>
                  <DollarSign className={styles.inputIcon} />
                  <input
                    type="text"
                    id="paymentAmount"
                    value={formatCurrency(formData.paymentProfile.paymentAmount)}
                    className={styles.input}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Payment History Section */}
            <div className={styles.paymentHistorySection}>
              <h3 className={styles.sectionTitle}>
                <Clock className="h-5 w-5" />
                Payment History
              </h3>

              {/* Add Payment Form */}
              <div className={styles.addPaymentForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="paymentAmount" className={styles.label}>
                    Payment Amount
                  </label>
                  <div className={styles.inputWrapper}>
                    <DollarSign className={styles.inputIcon} />
                    <input
                      type="number"
                      id="newPaymentAmount"
                      value={newPaymentAmount}
                      onChange={(e) => setNewPaymentAmount(parseFloat(e.target.value) || 0)}
                      className={styles.input}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="paymentDate" className={styles.label}>
                    Payment Date
                  </label>
                  <div className={styles.inputWrapper}>
                    <Calendar className={styles.inputIcon} />
                    <input
                      type="date"
                      id="paymentDate"
                      value={newPaymentDate}
                      onChange={(e) => setNewPaymentDate(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.addPaymentButton}
                  onClick={() => {
                    if (newPaymentAmount > 0 && newPaymentDate) {
                      handleAddPayment(newPaymentAmount, newPaymentDate)
                      setNewPaymentAmount(0)
                      setNewPaymentDate('')
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Payment
                </button>
              </div>

              {/* Payment History List */}
              <div className={styles.paymentHistoryList}>
                {formData.paymentProfile.paymentHistory.map((payment, index) => (
                  <div key={index} className={styles.paymentHistoryItem}>
                    <div className={styles.paymentInfo}>
                      <span className={styles.paymentDate}>
                        {new Date(payment.date).toLocaleDateString()}
                      </span>
                      <span className={styles.paymentAmount}>
                        ${formatCurrency(payment.amount)}
                      </span>
                    </div>
                    <div className={styles.remainingBalance}>
                      Remaining: ${formatCurrency(payment.remainingBalance)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Always visible save action button at the bottom */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            
            {/* Back to Basic Info button - only shown in enrollment tab */}
            {!student && activeTab === 'enrollment' && (
              <button 
                type="button" 
                onClick={() => setActiveTab('basic')}
                className={styles.backButton}
              >
                <ChevronRight className="h-4 w-4" style={{ transform: 'rotate(180deg)' }} />
                <span>Back to Basic Info</span>
              </button>
            )}
            
            <button
              type="button"
              className={styles.submitButton}
              disabled={loading || (!areBasicFieldsValid() && activeTab !== 'payment')}
              onClick={async (e) => {
                // When editing an existing student in the basic info tab, use the same direct update logic
                if (student && activeTab === 'basic') {
                  e.preventDefault();
                  console.log('Main submit button clicked for basic info tab');
                  
                  if (loading || !areBasicFieldsValid() || !areAddressFieldsValid()) {
                    if (!areBasicFieldsValid()) {
                      setError("Please complete all required fields (first name, last name, email, and phone).");
                    } else if (!areAddressFieldsValid()) {
                      setError("Please complete all address fields or leave them all empty.");
                    }
                    return;
                  }
                  
                  setLoading(true);
                  setError(null);
                  
                  try {
                    // Format the complete address
                    const hasAddressFields = formData.streetAddress.trim() !== '' || 
                                          formData.city.trim() !== '' ||
                                          formData.zipCode.trim() !== '';
                      
                    // Use clean address data to prevent saving partial addresses
                    const cleanedFormData = cleanAddressData();
                    const formattedAddress = hasAddressFields && areAddressFieldsValid() 
                      ? formatFullAddress() 
                      : '';
                    
                    // Prepare update data
                    const updateData = {
                      firstName: cleanedFormData.firstName,
                      lastName: cleanedFormData.lastName,
                      name: `${cleanedFormData.firstName} ${cleanedFormData.lastName}`,
                      email: cleanedFormData.email,
                      status: cleanedFormData.status,
                      phone: cleanedFormData.phone || undefined,
                      campus: cleanedFormData.campus || undefined,
                      practicalLocation: cleanedFormData.campus === 'hybrid' ? cleanedFormData.practicalLocation : undefined,
                      location: formattedAddress || undefined,
                      paymentProfile: {
                        totalCost: cleanedFormData.paymentProfile.totalCost || 0,
                        downPayment: cleanedFormData.paymentProfile.downPayment || 0,
                        amountFinanced: cleanedFormData.paymentProfile.amountFinanced || 0,
                        paymentFrequency: cleanedFormData.paymentProfile.paymentFrequency,
                        totalPayments: cleanedFormData.paymentProfile.totalPayments || 0,
                        paymentAmount: cleanedFormData.paymentProfile.paymentAmount || 0,
                        paymentDates: cleanedFormData.paymentProfile.paymentDates,
                        paymentHistory: cleanedFormData.paymentProfile.paymentHistory
                      }
                    };
                    
                    console.log('Directly updating student with data:', updateData);
                    
                    const result = await studentsApi.update(student.id, updateData);
                    console.log('Update successful:', result);
                    onSuccess();
                    onClose();
                  } catch (error) {
                    console.error('Error saving student:', error);
                    setError(error instanceof Error ? error.message : 'Failed to save changes. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                } else {
                  // For new students or other tabs, use the normal form submission
                  handleSubmit(e);
                }
              }}
            >
              {loading ? (
                <>
                  <div className={styles.miniSpinner}></div>
                  <span>Saving...</span>
                </>
              ) : student ? (
                <>
                  <Save className="h-5 w-5" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  {activeTab === 'basic' ? (
                    <>
                      <ChevronRight className="h-5 w-5" />
                      <span>Continue to Enrollment</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      <span>Add Student</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>

          {/* Floating save button that's always visible on mobile */}
          <div className={styles.floatingSaveContainer}>
            <button
              type="button"
              className={styles.floatingSaveButton}
              onClick={() => formRef.current?.requestSubmit()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.loadingSpinner}></span>
                  Saving...
                </>
              ) : student ? (
                <>
                  <Save className="h-4 w-4" />
                  Save Student
                </>
              ) : (
                <>
                  {activeTab === 'basic' ? (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      <span>Continue</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Add Student</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Confirmation Dialog for Identity Field Editing */}
      {showConfirmDialog && (
        <div className={styles.confirmDialogOverlay}>
          <div className={styles.confirmDialog}>
            <h3>Enable Identity Field Editing</h3>
            <p>
              This will allow editing of first name, last name, and email - only use for correcting typos or mistakes.
            </p>
            <p>
              <strong>Warning:</strong> Changing a student's identity information may affect their access to courses and records.
            </p>
            <div className={styles.confirmDialogButtons}>
              <button 
                className={styles.cancelButton} 
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </button>
              <button 
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
    </div>
  )
} 