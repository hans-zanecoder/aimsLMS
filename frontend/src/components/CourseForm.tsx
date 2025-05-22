'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Course, Program, Instructor, Student } from '@/types';
import { coursesApi, programsApi, instructorsApi, studentsApi } from '@/utils/api';
import { X, Save, XCircle, Plus, Trash2, User, Calendar, Clock, Hash, Users, Upload, Image } from 'lucide-react';
import styles from './CourseForm.module.css';

interface CourseFormProps {
  onClose: () => void;
  onSuccess: () => void;
  course?: Course;
  title?: string;
}

// Days of the week for class days selection
const WEEKDAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Allowed file types
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const CourseForm: React.FC<CourseFormProps> = ({ 
  onClose, 
  onSuccess, 
  course, 
  title = 'Add New Course' 
}) => {
  const isEditMode = !!course;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    program: '',
    instructor: '',
    title: '',
    description: '',
    image: '',
    courseId: '',
    startDate: '',
    endDate: '',
    classDays: [] as string[],
    classStartTime: '',
    classEndTime: '',
    totalWeeks: '',
    hoursPerWeek: '',
    campus: '',
    language: 'English',
    edstackID: '',
    students: [] as string[],
  });
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  
  // Fetch programs, instructors, and students on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [programsData, instructorsData, studentsData] = await Promise.all([
          programsApi.getAll(),
          instructorsApi.getAll(),
          studentsApi.getAll()
        ]);
        setPrograms(programsData);
        setInstructors(instructorsData);
        setAvailableStudents(studentsData);
      } catch (err) {
        setError('Failed to load form data. Please try again.');
        console.error('Error fetching form data:', err);
      }
    };
    
    fetchData();
  }, []);
  
  // Load course data if editing
  useEffect(() => {
    if (isEditMode && course) {
      console.log('Editing course:', course);
      
      // Type guard for program
      let programId = '';
      if (course.programId) {
        programId = typeof course.programId === 'string' ? course.programId : course.programId._id;
        console.log('Using programId:', programId);
      } else if (course.program && typeof course.program === 'object' && '_id' in course.program) {
        programId = (course.program as { _id: string })._id;
        console.log('Program is an object with ID:', programId);
      } else if (typeof course.program === 'string') {
        programId = course.program;
        console.log('Program is a string ID:', programId);
      }
      
      // Type guard for instructor
      let instructorId = '';
      if (course.instructor && typeof course.instructor === 'object' && '_id' in course.instructor) {
        instructorId = (course.instructor as { _id: string })._id;
        console.log('Instructor is an object with ID:', instructorId);
      } else if (typeof course.instructor === 'string') {
        instructorId = course.instructor;
        console.log('Instructor is a string ID:', instructorId);
      } else if (course.instructorId) {
        instructorId = typeof course.instructorId === 'string' ? course.instructorId : course.instructorId._id;
        console.log('Using instructorId:', instructorId);
      }
      
      // Load course students if any
      if (course.students && Array.isArray(course.students)) {
        const studentIds = course.students.map(student => 
          typeof student === 'string' ? student : student._id
        );
        setFormData(prev => ({ ...prev, students: studentIds }));
        
        // Set selected students for display
        const selectedStudentObjects = availableStudents.filter(s => 
          studentIds.includes(s.id)
        );
        setSelectedStudents(selectedStudentObjects);
      }
      
      // Set image preview if there's an existing image
      if (course.image) {
        setImagePreview(course.image);
      }
      
      // Convert class days to lowercase for form compatibility if needed
      const formattedClassDays = course.classDays 
        ? course.classDays.map(day => day.toLowerCase())
        : [];
      
      setFormData({
        program: programId,
        instructor: instructorId,
        title: course.title || '',
        description: course.description || '',
        image: course.image || '',
        courseId: course.courseId || '',
        startDate: course.startDate || '',
        endDate: course.endDate || '',
        classDays: formattedClassDays,
        classStartTime: course.classStartTime || '',
        classEndTime: course.classEndTime || '',
        totalWeeks: course.totalWeeks?.toString() || '',
        hoursPerWeek: course.hoursPerWeek?.toString() || '',
        campus: course.campus || '',
        language: course.language || 'English',
        edstackID: course.edstackID || '',
        students: course.students?.map(s => typeof s === 'string' ? s : s._id) || [],
      });
    }
  }, [course, isEditMode, availableStudents]);
  
  // Debug outputs for form values and dropdowns
  useEffect(() => {
    if (isEditMode) {
      console.log('Current form data:', formData);
      console.log('Available programs:', programs);
      console.log('Available instructors:', instructors);
    }
  }, [formData, programs, instructors, isEditMode]);
  
  // Auto-generate course details when program is selected
  useEffect(() => {
    if (formData.program && !isEditMode) {
      const selectedProgram = programs.find(p => p._id === formData.program);
      if (selectedProgram) {
        setFormData(prev => ({
          ...prev,
          title: `${selectedProgram.name} Course`,
          description: `This course is part of the ${selectedProgram.name} program. ${selectedProgram.description || ''}`
        }));
      }
    }
  }, [formData.program, programs, isEditMode]);
  
  // Input change handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Direct state update for cleaner re-rendering
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    
    if (!file) return;
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setImageError(`File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }
    
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setImageError('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.');
      return;
    }
    
    // Set file and create preview
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle image removal
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({
      ...formData,
      image: ''
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Handle checkbox changes (for class days)
  const handleCheckboxChange = (day: string) => {
    const updatedDays = [...formData.classDays];
    if (updatedDays.includes(day)) {
      // Remove day if already selected
      const index = updatedDays.indexOf(day);
      updatedDays.splice(index, 1);
    } else {
      // Add day if not selected
      updatedDays.push(day);
    }
    setFormData({
      ...formData,
      classDays: updatedDays
    });
  };
  
  // Handle student selection
  const handleAddStudent = (student: Student) => {
    // Check if student is already selected
    if (!formData.students.includes(student.id)) {
      setFormData({
        ...formData,
        students: [...formData.students, student.id]
      });
      setSelectedStudents([...selectedStudents, student]);
    }
    setStudentSearch(''); // Clear search after adding
  };
  
  // Handle student removal
  const handleRemoveStudent = (studentId: string) => {
    setFormData({
      ...formData,
      students: formData.students.filter(id => id !== studentId)
    });
    setSelectedStudents(selectedStudents.filter(s => s.id !== studentId));
  };
  
  // Filter students based on search
  const filteredStudents = availableStudents.filter(student => 
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) &&
    !formData.students.includes(student.id)
  ).slice(0, 5); // Limit results for better UI
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.program || !formData.instructor || !formData.title || !formData.description ||
        !formData.startDate || !formData.endDate) {
      setError('Please fill out all required fields');
      return;
    }
    
    // Check for image errors
    if (imageError) {
      setError(`Image error: ${imageError}`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create FormData for multipart/form-data submission
      const submitData = new FormData();
      
      // Format dates and times to match required formats
      const processedFormData = {
        ...formData,
        // Format dates to YYYY-MM-DD format without time component
        startDate: formData.startDate ? formData.startDate.split('T')[0] : '',
        endDate: formData.endDate ? formData.endDate.split('T')[0] : '',
        // Format times to 24-hour format (HH:MM)
        classStartTime: formData.classStartTime ? convertTo24HourFormat(formData.classStartTime) : '',
        classEndTime: formData.classEndTime ? convertTo24HourFormat(formData.classEndTime) : ''
      };
      
      // Add all form fields to FormData
      Object.entries(processedFormData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Handle arrays (like students and classDays)
          value.forEach(item => submitData.append(`${key}[]`, item));
        } else {
          submitData.append(key, value.toString());
        }
      });
      
      // Add image file if present
      if (imageFile) {
        submitData.append('courseImage', imageFile);
      }
      
      if (isEditMode && course) {
        // Pass FormData directly to the API
        await coursesApi.update(course._id, submitData);
      } else {
        // Pass FormData directly to the API
        await coursesApi.create(submitData);
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving course:', err);
      setError('Failed to save course. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to convert time from 12-hour to 24-hour format
  const convertTo24HourFormat = (timeStr: string): string => {
    // If already in 24-hour format, return as is
    if (timeStr.match(/^\d{2}:\d{2}$/)) {
      return timeStr;
    }
    
    // Convert from AM/PM format to 24-hour format
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = modifier === 'AM' ? '00' : '12';
    } else if (modifier === 'PM') {
      hours = String(parseInt(hours, 10) + 12);
    }
    
    // Ensure hours is two digits
    if (hours.length === 1) {
      hours = `0${hours}`;
    }
    
    return `${hours}:${minutes}`;
  };
  
  // Error dismissal
  const dismissError = () => {
    setError(null);
  };
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isEditMode ? `Edit Course: ${course?.title}` : title}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className={styles.errorContainer}>
            <div className={styles.errorMessage}>
              <span>⚠️</span>
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
        
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.formGrid}>
            {/* Basic Course Information */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>
                <Hash className="h-4 w-4" /> Course Information
              </h3>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Course ID
                </label>
                <input 
                  type="text"
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleChange}
                  className={styles.formInput}
                  disabled={loading}
                  placeholder="E.g., COURSE-001"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Program <span className={styles.required}>*</span>
                </label>
                <select 
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  className={styles.formSelect}
                  disabled={loading}
                  required
                >
                  <option value="">Select a program to auto-generate course details</option>
                  {programs.map((program) => (
                    <option key={program._id} value={program._id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Instructor <span className={styles.required}>*</span>
                </label>
                <select 
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleChange}
                  className={styles.formSelect}
                  disabled={loading}
                  required
                >
                  <option value="">Select an instructor</option>
                  {instructors.map((instructor) => (
                    <option key={instructor._id} value={instructor._id}>
                      {instructor.firstName} {instructor.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Course Title <span className={styles.required}>*</span>
                </label>
                <input 
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={styles.formInput}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Language <span className={styles.required}>*</span>
                </label>
                <select 
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className={styles.formSelect}
                  disabled={loading}
                  required
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>
              
              {isEditMode && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    EdStack ID
                  </label>
                  <input 
                    type="text"
                    name="edstackID"
                    value={formData.edstackID}
                    onChange={handleChange}
                    className={styles.formInput}
                    disabled={loading}
                    placeholder="Auto-generated if empty"
                  />
                  <div className={styles.inputHint}>
                    Will be auto-generated if left empty
                  </div>
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Description <span className={styles.required}>*</span>
                </label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={styles.formTextarea}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Course Image
                </label>
                <div className={styles.imageUploadContainer}>
                  {/* Hidden file input */}
                  <input 
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                    className={styles.hiddenFileInput}
                  />
                  
                  {/* Image preview or placeholder */}
                  <div className={styles.imagePreviewArea}>
                    {imagePreview ? (
                      <div className={styles.imagePreview}>
                        <img 
                          src={imagePreview} 
                          alt="Course preview" 
                          className={styles.previewImage}
                        />
                        <button 
                          type="button"
                          className={styles.removeImageButton}
                          onClick={handleRemoveImage}
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className={styles.imagePlaceholder}
                        onClick={triggerFileInput}
                      >
                        <Image className="h-12 w-12" />
                        <span>Click to upload image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload button */}
                  {!imagePreview && (
                    <button 
                      type="button"
                      className={styles.uploadButton}
                      onClick={triggerFileInput}
                      disabled={loading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </button>
                  )}
                  
                  {/* Image error message */}
                  {imageError && (
                    <div className={styles.imageErrorMessage}>
                      {imageError}
                    </div>
                  )}
                  
                  <div className={styles.imageHelpText}>
                    JPG, PNG, GIF or WebP. Max 5MB.
                  </div>
                </div>
              </div>
            </div>
            
            {/* Course Schedule */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>
                <Calendar className="h-4 w-4" /> Course Schedule
              </h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Start Date <span className={styles.required}>*</span>
                  </label>
                  <input 
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={styles.formInput}
                    disabled={loading}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    End Date <span className={styles.required}>*</span>
                  </label>
                  <input 
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className={styles.formInput}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Class Days</label>
                <div className={styles.checkboxGroup}>
                  {WEEKDAYS.map(day => (
                    <label key={day.value} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.classDays.includes(day.value)}
                        onChange={() => handleCheckboxChange(day.value)}
                        className={styles.checkbox}
                        disabled={loading}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <Clock className="h-4 w-4 mr-1" /> Class Start Time
                  </label>
                  <input 
                    type="time"
                    name="classStartTime"
                    value={formData.classStartTime}
                    onChange={handleChange}
                    className={styles.formInput}
                    disabled={loading}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <Clock className="h-4 w-4 mr-1" /> Class End Time
                  </label>
                  <input 
                    type="time"
                    name="classEndTime"
                    value={formData.classEndTime}
                    onChange={handleChange}
                    className={styles.formInput}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
            
            {/* Student Enrollment */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>
                <Users className="h-4 w-4" /> Student Enrollment
              </h3>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Add Students</label>
                <div className={styles.studentSearch}>
                  <input
                    type="text"
                    placeholder="Search students by name..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className={styles.formInput}
                    disabled={loading}
                  />
                  
                  {studentSearch && filteredStudents.length > 0 && (
                    <div className={styles.studentDropdown}>
                      {filteredStudents.map(student => (
                        <div 
                          key={student.id} 
                          className={styles.studentOption}
                          onClick={() => handleAddStudent(student)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          {student.name} ({student.email})
                          <Plus className="h-4 w-4 ml-auto" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.selectedStudents}>
                {selectedStudents.length > 0 ? (
                  selectedStudents.map(student => (
                    <div key={student.id} className={styles.selectedStudent}>
                      <div className={styles.studentAvatar}>
                        {student.name.charAt(0)}
                      </div>
                      <div className={styles.studentInfo}>
                        <div className={styles.studentName}>{student.name}</div>
                        <div className={styles.studentEmail}>{student.email}</div>
                      </div>
                      <button
                        type="button"
                        className={styles.removeStudentButton}
                        onClick={() => handleRemoveStudent(student.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className={styles.noStudents}>
                    No students enrolled yet. Search and add students above.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className={styles.buttonContainer}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : isEditMode ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm; 