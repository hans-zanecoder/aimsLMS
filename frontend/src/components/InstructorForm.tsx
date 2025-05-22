'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, Upload, Book, Calendar } from 'lucide-react';
import { instructorsApi } from '@/services/instructorsApi';
import { programsApi, type Program as ApiProgram } from '@/services/programsApi';
import { type Instructor } from '@/types';
import styles from '@/app/admin/admin.module.css';

interface InstructorFormProps {
  instructor?: Instructor;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InstructorForm({ instructor, onClose, onSuccess }: InstructorFormProps) {
  const [formData, setFormData] = useState({
    firstName: instructor?.firstName || '',
    lastName: instructor?.lastName || '',
    email: instructor?.email || '',
    phone: instructor?.phone || '',
    startDate: instructor?.startDate || '',
    profilePic: instructor?.profilePic || ''
  });
  
  const [programs, setPrograms] = useState<ApiProgram[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>(
    instructor?.programs 
      ? Array.isArray(instructor.programs) 
        ? instructor.programs.map(p => typeof p === 'string' ? p : p._id) 
        : []
      : []
  );
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(instructor?.profilePic || '');

  // Fetch programs for the dropdown
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      try {
        const programsData = await programsApi.getAll();
        setPrograms(programsData);
      } catch (error) {
        console.error('Failed to fetch programs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL for the selected file
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProgramSelect = (programId: string) => {
    setSelectedPrograms(prev => {
      // If already selected, remove it
      if (prev.includes(programId)) {
        return prev.filter(id => id !== programId);
      }
      // Otherwise add it
      return [...prev, programId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Create FormData object to handle file upload
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone || '');
      
      // Only add startDate if it has a value
      if (formData.startDate) {
        formDataToSend.append('startDate', formData.startDate);
      }
      
      // Add selected programs
      if (selectedPrograms.length > 0) {
        formDataToSend.append('programs', JSON.stringify(selectedPrograms));
      }
      
      // Only append file if a new one is selected
      if (selectedFile) {
        formDataToSend.append('profilePic', selectedFile);
      } else if (formData.profilePic) {
        // Keep existing profile pic if no new file is selected
        formDataToSend.append('profilePic', formData.profilePic);
      }

      if (instructor) {
        await instructorsApi.update(instructor._id, formDataToSend);
      } else {
        await instructorsApi.create(formDataToSend);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving instructor:', error);
      alert('Failed to save instructor. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {instructor ? 'Edit Instructor' : 'Create Instructor'}
          </h3>
          <button 
            className={styles.modalCloseButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalContent} encType="multipart/form-data">
          <div className={styles.modalForm}>
            {/* Profile Picture */}
            <div className={styles.formSection}>
              <div className={styles.profilePicSection}>
                <div className={styles.profilePicPreview}>
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Profile preview" 
                      className={styles.profilePic}
                    />
                  ) : (
                    <div className={styles.profilePicPlaceholder}>
                      <Upload className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className={styles.profilePicUpload}>
                  <label className={styles.uploadButton}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className={styles.fileInput}
                    />
                    <Upload className="h-4 w-4" />
                    <span>Upload Photo</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>Basic Information</h4>
              
              <div className={`${styles.formGroup} ${errors.firstName ? styles.formGroupError : ''}`}>
                <label className={styles.formLabel}>
                  First Name<span className={styles.requiredField}>*</span>
                </label>
                <input 
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <div className={styles.errorMessage}>
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.firstName}</span>
                  </div>
                )}
              </div>

              <div className={`${styles.formGroup} ${errors.lastName ? styles.formGroupError : ''}`}>
                <label className={styles.formLabel}>
                  Last Name<span className={styles.requiredField}>*</span>
                </label>
                <input 
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <div className={styles.errorMessage}>
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.lastName}</span>
                  </div>
                )}
              </div>

              <div className={`${styles.formGroup} ${errors.email ? styles.formGroupError : ''}`}>
                <label className={styles.formLabel}>
                  Email<span className={styles.requiredField}>*</span>
                </label>
                <input 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <div className={styles.errorMessage}>
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone</label>
                <input 
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Enter phone number"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Start Date <span className={styles.optionalField}>(optional)</span>
                </label>
                <div className={styles.inputWithIcon}>
                  <Calendar className={styles.inputIcon} size={18} />
                  <input 
                    type="month"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    placeholder="MM/YYYY"
                  />
                </div>
              </div>
            </div>
            
            {/* Programs Section */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>
                <Book className="h-4 w-4 mr-2" />
                Program Assignment
              </h4>
              
              {loading ? (
                <div className={styles.loadingPrograms}>Loading programs...</div>
              ) : programs.length === 0 ? (
                <div className={styles.noPrograms}>No programs available</div>
              ) : (
                <div className={styles.programsContainer}>
                  <label className={styles.formLabel}>
                    Assign to Programs <span className={styles.optionalField}>(optional)</span>
                  </label>
                  <div className={styles.programsGrid}>
                    {programs.map(program => (
                      <div 
                        key={program._id}
                        className={`${styles.programCheckbox} ${
                          selectedPrograms.includes(program._id) ? styles.programSelected : ''
                        }`}
                        onClick={() => handleProgramSelect(program._id)}
                      >
                        <input
                          type="checkbox"
                          id={`program-${program._id}`}
                          checked={selectedPrograms.includes(program._id)}
                          onChange={() => {}}
                          className={styles.checkboxInput}
                        />
                        <label htmlFor={`program-${program._id}`}>
                          {program.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.modalActions}>
            <button 
              type="button"
              onClick={onClose}
              className={styles.secondaryButton}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={`${styles.primaryButton} ${isSaving ? styles.loading : ''}`}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className={styles.spinner} />
                  <span>{instructor ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>{instructor ? 'Update Instructor' : 'Create Instructor'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 