'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Course, Program, Instructor, Student } from '@/types';
import { coursesApi, programsApi, instructorsApi, studentsApi } from '@/utils/api';
import { 
  X, Save, XCircle, AlertCircle, User, Calendar, Clock, Hash, 
  Upload, Image, Globe, Tag, School, BookOpen, FileText 
} from 'lucide-react';
import styles from './CourseEditDialog.module.css';

interface CourseEditDialogProps {
  course: Course;
  onClose: () => void;
  onSuccess: () => void;
}

const CourseEditDialog: React.FC<CourseEditDialogProps> = ({ 
  course, 
  onClose, 
  onSuccess 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: course.title || '',
    description: course.description || '',
    program: typeof course.programId === 'object' ? course.programId._id : 
             typeof course.program === 'object' ? course.program._id : 
             course.programId || course.program || '',
    instructor: typeof course.instructorId === 'object' ? course.instructorId._id :
                typeof course.instructor === 'object' ? course.instructor._id :
                course.instructorId || course.instructor || '',
    category: course.category || '',
    language: course.language || 'English',
    edstackID: course.edstackID || '',
    campus: course.campus || '',
    image: course.image || '',
    price: course.price?.toString() || '0',
    level: course.level || 'All Levels',
    status: course.status || 'Draft',
    startDate: course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : '',
    endDate: course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : '',
    classDays: course.classDays || [],
    classStartTime: course.classStartTime || '',
    classEndTime: course.classEndTime || '',
    totalWeeks: course.totalWeeks?.toString() || '',
    hoursPerWeek: course.hoursPerWeek?.toString() || '',
    prerequisites: course.prerequisites || [],
    learningObjectives: course.learningObjectives || [],
    tags: course.tags || [],
    auditNotes: ''
  });
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(course.image || null);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Other state
  const [programs, setPrograms] = useState<Program[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuditInfo, setShowAuditInfo] = useState(false);
  
  // Fetch reference data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [programsData, instructorsData] = await Promise.all([
          programsApi.getAll(),
          instructorsApi.getAll()
        ]);
        setPrograms(programsData);
        setInstructors(instructorsData);
      } catch (err) {
        setError('Failed to load reference data. Please try again.');
        console.error('Error fetching reference data:', err);
      }
    };
    
    fetchData();
  }, []);
  
  // Input change handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Checkbox change handler for class days
  const handleCheckboxChange = (day: string) => {
    const updatedDays = [...formData.classDays];
    if (updatedDays.includes(day)) {
      const index = updatedDays.indexOf(day);
      updatedDays.splice(index, 1);
    } else {
      updatedDays.push(day);
    }
    setFormData(prev => ({
      ...prev,
      classDays: updatedDays
    }));
  };
  
  // Array field handlers (prerequisites, learning objectives, tags)
  const handleArrayFieldChange = (field: 'prerequisites' | 'learningObjectives' | 'tags', value: string) => {
    // Add item to array if not empty
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };
  
  const handleRemoveArrayItem = (field: 'prerequisites' | 'learningObjectives' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };
  
  // Image handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    
    if (!file) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('File size too large. Maximum size is 5MB.');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
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
  
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Create FormData for multipart/form-data submission (for image upload)
      const submitData = new FormData();
      
      // Add all form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'instructor') {
          // Use instructorId field name as expected by the backend
          submitData.append('instructorId', value.toString());
        } else if (key === 'program') {
          // Use programId field name as expected by the backend
          submitData.append('programId', value.toString());
        } else if (Array.isArray(value)) {
          // For arrays, we need to stringify them
          submitData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          submitData.append(key, value.toString());
        }
      });
      
      // Add image file if present
      if (imageFile) {
        submitData.append('courseImage', imageFile);
      }
      
      // Update the course
      await coursesApi.update(course._id, submitData);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving course:', err);
      setError('Failed to save course. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Error dismissal
  const dismissError = () => {
    setError(null);
  };
  
  // Helper for time format
  const formatTimeForDisplay = (time: string): string => {
    if (!time) return '';
    
    // If time is already in 12-hour format with AM/PM, return as is
    if (time.includes('AM') || time.includes('PM')) {
      return time;
    }
    
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12; // Convert to 12-hour format
    
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 className={styles.title}>Edit Course: {course.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className={styles.errorContainer}>
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <button className={styles.dismissButton} onClick={dismissError}>
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.scrollContainer}>
            <div className={styles.formGrid}>
              {/* Basic information section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Hash className="h-4 w-4" /> Basic Information
                </h3>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Title <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={styles.input}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Status <span className={styles.required}>*</span>
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className={styles.select}
                      required
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Language <span className={styles.required}>*</span>
                    </label>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className={styles.select}
                      required
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      EdStack ID
                    </label>
                    <div className={styles.idContainer}>
                      <input
                        type="text"
                        name="edstackID"
                        value={formData.edstackID}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="Auto-generated if empty"
                      />
                      <div className={styles.hint}>
                        Auto-generated if left empty
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Description <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={styles.textarea}
                    rows={4}
                    required
                  />
                </div>
              </div>
              
              {/* Classification section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Tag className="h-4 w-4" /> Classification
                </h3>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Program <span className={styles.required}>*</span>
                    </label>
                    <select
                      name="program"
                      value={formData.program}
                      onChange={handleChange}
                      className={styles.select}
                      required
                    >
                      <option value="">Select a program</option>
                      {programs.map(program => (
                        <option key={program._id} value={program._id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Category <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={styles.input}
                      required
                    />
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Level <span className={styles.required}>*</span>
                    </label>
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className={styles.select}
                      required
                    >
                      <option value="All Levels">All Levels</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Price
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={styles.input}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Instructor <span className={styles.required}>*</span>
                  </label>
                  <select
                    name="instructor"
                    value={formData.instructor}
                    onChange={handleChange}
                    className={styles.select}
                    required
                  >
                    <option value="">Select an instructor</option>
                    {instructors.map(instructor => (
                      <option key={instructor._id} value={instructor._id}>
                        {instructor.firstName} {instructor.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Schedule section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Calendar className="h-4 w-4" /> Schedule
                </h3>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Start Date <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className={styles.input}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      End Date <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className={styles.input}
                      required
                    />
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Campus
                    </label>
                    <input
                      type="text"
                      name="campus"
                      value={formData.campus}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="e.g., Santa Ana, South Gate"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Total Weeks
                    </label>
                    <input
                      type="number"
                      name="totalWeeks"
                      value={formData.totalWeeks}
                      onChange={handleChange}
                      className={styles.input}
                      min="1"
                    />
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Class Start Time
                    </label>
                    <input
                      type="time"
                      name="classStartTime"
                      value={formData.classStartTime}
                      onChange={handleChange}
                      className={styles.input}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Class End Time
                    </label>
                    <input
                      type="time"
                      name="classEndTime"
                      value={formData.classEndTime}
                      onChange={handleChange}
                      className={styles.input}
                    />
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Class Days
                  </label>
                  <div className={styles.checkboxGroup}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <label key={day} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.classDays.includes(day)}
                          onChange={() => handleCheckboxChange(day)}
                          className={styles.checkbox}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Hours Per Week
                  </label>
                  <input
                    type="number"
                    name="hoursPerWeek"
                    value={formData.hoursPerWeek}
                    onChange={handleChange}
                    className={styles.input}
                    min="1"
                    step="0.5"
                  />
                </div>
              </div>
              
              {/* Image section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Image className="h-4 w-4" /> Course Image
                </h3>
                
                <div className={styles.imageUpload}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className={styles.fileInput}
                  />
                  
                  {imagePreview ? (
                    <div className={styles.imagePreviewContainer}>
                      <img 
                        src={imagePreview} 
                        alt="Course preview" 
                        className={styles.imagePreview} 
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className={styles.removeImageButton}
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className={styles.uploadPlaceholder}
                      onClick={triggerFileInput}
                    >
                      <Upload className="h-8 w-8" />
                      <span>Click to upload image</span>
                    </div>
                  )}
                  
                  {imageError && (
                    <div className={styles.imageError}>
                      {imageError}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Additional information section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <BookOpen className="h-4 w-4" /> Additional Information
                </h3>
                
                <div className={styles.tagsSection}>
                  <label className={styles.label}>
                    Prerequisites
                  </label>
                  <div className={styles.tagInput}>
                    <input
                      type="text"
                      placeholder="Add prerequisite and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleArrayFieldChange('prerequisites', (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.tagList}>
                    {formData.prerequisites.map((item, index) => (
                      <div key={index} className={styles.tag}>
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveArrayItem('prerequisites', index)}
                          className={styles.removeTag}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={styles.tagsSection}>
                  <label className={styles.label}>
                    Learning Objectives
                  </label>
                  <div className={styles.tagInput}>
                    <input
                      type="text"
                      placeholder="Add learning objective and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleArrayFieldChange('learningObjectives', (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.tagList}>
                    {formData.learningObjectives.map((item, index) => (
                      <div key={index} className={styles.tag}>
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveArrayItem('learningObjectives', index)}
                          className={styles.removeTag}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={styles.tagsSection}>
                  <label className={styles.label}>
                    Tags
                  </label>
                  <div className={styles.tagInput}>
                    <input
                      type="text"
                      placeholder="Add tag and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleArrayFieldChange('tags', (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.tagList}>
                    {formData.tags.map((item, index) => (
                      <div key={index} className={styles.tag}>
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveArrayItem('tags', index)}
                          className={styles.removeTag}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Audit section */}
              <div className={styles.section}>
                <div className={styles.auditHeader}>
                  <h3 className={styles.sectionTitle}>
                    <FileText className="h-4 w-4" /> Audit Information
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setShowAuditInfo(!showAuditInfo)}
                    className={styles.auditToggle}
                  >
                    {showAuditInfo ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                {showAuditInfo && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Audit Notes
                    </label>
                    <textarea
                      name="auditNotes"
                      value={formData.auditNotes}
                      onChange={handleChange}
                      placeholder="Describe the changes you're making (optional)"
                      className={styles.textarea}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseEditDialog; 