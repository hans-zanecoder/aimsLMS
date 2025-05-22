'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Upload, X, Edit2, Trash2, AlertCircle, Image, PlayCircle } from 'lucide-react'
import styles from '../../admin.module.css'
import programsApi, { Program, CreateProgramData } from '@/services/programsApi'
import InstructorList from '@/components/InstructorList'
import PersonalSettings from '@/components/PersonalSettings'
import { useRouter } from 'next/navigation'

// Types for settings tabs
type SettingsSection = 'personal' | 'college'
type CollegeTab = 'basic' | 'programs' | 'instructors'

export default function SettingsContent() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('personal')
  const [activeCollegeTab, setActiveCollegeTab] = useState<CollegeTab>('basic')
  const [showProgramModal, setShowProgramModal] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [editProgramId, setEditProgramId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formErrors, setFormErrors] = useState<{
    name?: string;
  }>({})
  
  const [newProgram, setNewProgram] = useState<Omit<CreateProgramData, '_id'>>({
    name: '',
    description: '',
    durationValue: '',
    durationUnit: 'weeks',
    icon: null,
    instructionModes: []
  })

  const router = useRouter()

  // Load programs from API
  useEffect(() => {
    const fetchPrograms = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await programsApi.getAll();
        setPrograms(data);
      } catch (err) {
        console.error('Failed to fetch programs:', err);
        setError('Failed to load programs. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  // Function to handle adding a new program
  const handleAddProgram = () => {
    setIsEditMode(false)
    setEditProgramId(null)
    setNewProgram({
      name: '',
      description: '',
      durationValue: '',
      durationUnit: 'weeks',
      icon: null,
      instructionModes: []
    })
    setFormErrors({})
    setImageError(null)
    setShowProgramModal(true)
  }

  // Function to handle editing a program
  const handleEditProgram = (program: Program) => {
    setIsEditMode(true)
    setEditProgramId(program._id)
    setNewProgram({
      name: program.name,
      description: program.description,
      durationValue: program.durationValue || '',
      durationUnit: program.durationUnit || 'weeks',
      icon: program.icon,
      instructionModes: program.instructionModes || []
    })
    setFormErrors({})
    setImageError(null)
    setShowProgramModal(true)
  }

  // Function to handle deleting a program
  const handleDeleteProgram = async (id: string) => {
    if (confirm('Are you sure you want to delete this program?')) {
      try {
        await programsApi.delete(id);
        setPrograms(programs.filter(program => program._id !== id));
      } catch (err) {
        console.error('Failed to delete program:', err);
        alert('Failed to delete program. Please try again.');
      }
    }
  }

  // Function to handle modal close
  const handleCloseModal = () => {
    setShowProgramModal(false)
    setIsEditMode(false)
    setEditProgramId(null)
    setImageError(null)
    // Reset form
    setNewProgram({
      name: '',
      description: '',
      durationValue: '',
      durationUnit: 'weeks',
      icon: null,
      instructionModes: []
    })
  }

  // Function to validate form fields
  const validateForm = () => {
    const errors: {
      name?: string;
    } = {}
    
    if (!newProgram.name.trim()) {
      errors.name = 'Program name is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Function to handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewProgram(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  // Function to handle icon file selection
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageError(null)
    
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setImageError('Image size exceeds 2MB limit')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const result = event.target?.result as string
          // Ensure it's a data URL
          if (typeof result === 'string' && result.startsWith('data:image/')) {
            setNewProgram(prev => ({
              ...prev,
              icon: result
            }))
          } else {
            throw new Error('Invalid image format')
          }
        } catch (error) {
          console.error('Error processing image:', error)
          setImageError('Invalid image format')
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      }
      
      reader.onerror = () => {
        setImageError('Failed to read image file')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
      
      reader.readAsDataURL(file)
    }
  }

  // Function to trigger file input click
  const handleIconClick = () => {
    fileInputRef.current?.click()
  }

  // Function to remove selected icon
  const handleRemoveIcon = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNewProgram(prev => ({
      ...prev,
      icon: null
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setImageError(null)
  }

  // Function to handle checkbox change for instruction modes
  const handleInstructionModeChange = (mode: string) => {
    setNewProgram(prev => {
      // Check if the mode is already selected
      if (prev.instructionModes?.includes(mode)) {
        // If selected, remove it
        return {
          ...prev,
          instructionModes: prev.instructionModes.filter(m => m !== mode)
        };
      } else {
        // If not selected, add it
        return {
          ...prev,
          instructionModes: [...(prev.instructionModes || []), mode]
        };
      }
    });
  };

  // Function to save the new program
  const handleSaveProgram = async () => {
    // Validate fields
    if (!validateForm()) {
      return
    }

    if (imageError) {
      alert('Please fix the image error before saving')
      return
    }

    setIsSaving(true)
    
    try {
      if (isEditMode && editProgramId) {
        // Update existing program
        const updatedProgram = await programsApi.update(editProgramId, newProgram);
        setPrograms(prevPrograms => 
          prevPrograms.map(program => 
            program._id === editProgramId ? updatedProgram : program
          )
        );
      } else {
        // Create a new program
        const createdProgram = await programsApi.create(newProgram);
        setPrograms(prevPrograms => [...prevPrograms, createdProgram]);
      }
      
      // Close modal
      handleCloseModal()
    } catch (error: any) {
      console.error('Error saving program:', error);
      alert(`Failed to save program: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false)
    }
  }

  const handleResumeProgram = (programId: string) => {
    router.push(`/admin/programs/${programId}`);
  };

  const renderPersonalSettings = () => {
    return (
      <div className={styles.settingsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>Personal Settings</h2>
            <p className={styles.sectionDescription}>
              Manage your personal information and preferences
            </p>
          </div>
        </div>
        <PersonalSettings />
      </div>
    );
  };

  const renderCollegeSettings = () => {
    return (
      <div className={styles.settingsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>College Settings</h2>
            <p className={styles.sectionDescription}>
              Configure your college information, programs, and instructors
            </p>
          </div>
        </div>
        <div className={styles.settingsTabs}>
          <button 
            className={`${styles.settingsTab} ${activeCollegeTab === 'basic' ? styles.activeSettingsTab : ''}`}
            onClick={() => setActiveCollegeTab('basic')}
          >
            Basic Info
          </button>
          <button 
            className={`${styles.settingsTab} ${activeCollegeTab === 'programs' ? styles.activeSettingsTab : ''}`}
            onClick={() => setActiveCollegeTab('programs')}
          >
            Programs
          </button>
          <button 
            className={`${styles.settingsTab} ${activeCollegeTab === 'instructors' ? styles.activeSettingsTab : ''}`}
            onClick={() => setActiveCollegeTab('instructors')}
          >
            Instructors
          </button>
        </div>

        <div className={styles.settingsTabContent}>
          {activeCollegeTab === 'basic' && (
            <div className={styles.settingsCard}>
              <h3 className={styles.settingsCardTitle}>Basic Information</h3>
              <p className={styles.settingsCardDescription}>
                Configure your college's basic information and settings
              </p>
              <div className={styles.formGroup}>
                <p>College basic information settings will go here</p>
              </div>
            </div>
          )}

          {activeCollegeTab === 'programs' && (
            <div className={styles.settingsCard}>
              <div className={styles.settingsCardHeader}>
                <div>
                  <h3 className={styles.settingsCardTitle}>Programs</h3>
                  <p className={styles.settingsCardDescription}>
                    Manage your college's academic programs
                  </p>
                </div>
                <button
                  className={styles.addButton}
                  onClick={handleAddProgram}
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Program</span>
                </button>
              </div>

              {error && (
                <div className={styles.error}>
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              )}

              {isLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <p>Loading programs...</p>
                </div>
              ) : programs.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <Plus className="h-8 w-8" />
                  </div>
                  <h3>No Programs Yet</h3>
                  <p>Get started by adding your first academic program</p>
                  <button 
                    className={styles.emptyStateButton}
                    onClick={handleAddProgram}
                  >
                    <Plus className="h-5 w-5" />
                    Add Program
                  </button>
                </div>
              ) : (
                <div className={styles.programGrid}>
                  {programs.map((program) => (
                    <div key={program._id} className={styles.programCard}>
                      <div className={styles.programCardHeader}>
                        {program.icon && (
                          <div className={styles.programCardIcon}>
                            <img src={program.icon} alt={program.name} />
                          </div>
                        )}
                        <div className={styles.programCardInfo}>
                          <h4 className={styles.programCardTitle}>{program.name}</h4>
                          {program.instructionModes && program.instructionModes.length > 0 && (
                            <div className={styles.programCardModes}>
                              {program.instructionModes.map(mode => (
                                <span key={mode} className={styles.programCardMode}>
                                  {mode}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className={styles.programCardActions}>
                          <button 
                            className={styles.iconButton}
                            onClick={() => handleEditProgram(program)}
                            title="Edit program"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            className={styles.iconButton}
                            onClick={() => handleDeleteProgram(program._id)}
                            title="Delete program"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className={styles.programCardDescription}>{program.description}</p>
                      {(program.durationValue && program.durationUnit) && (
                        <div className={styles.programCardDetails}>
                          <div className={styles.programCardDetail}>
                            <span className={styles.detailLabel}>Duration:</span>
                            <span className={styles.detailValue}>
                              {program.durationValue} {program.durationUnit}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeCollegeTab === 'instructors' && (
            <div className={styles.settingsCard}>
              <InstructorList />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.mainSettingsTabs}>
        <button 
          className={`${styles.mainSettingsTab} ${activeSection === 'personal' ? styles.activeMainSettingsTab : ''}`}
          onClick={() => setActiveSection('personal')}
        >
          Personal Settings
        </button>
        <button 
          className={`${styles.mainSettingsTab} ${activeSection === 'college' ? styles.activeMainSettingsTab : ''}`}
          onClick={() => setActiveSection('college')}
        >
          College Settings
        </button>
      </div>

      <div className={styles.settingsContent}>
        {activeSection === 'personal' ? renderPersonalSettings() : renderCollegeSettings()}
      </div>

      {/* Add/Edit Program Modal */}
      {showProgramModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {isEditMode ? 'Edit Program' : 'Add New Program'}
              </h3>
              <button 
                className={styles.modalCloseButton}
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.modalForm}>
                {/* Program Icon */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Program Icon</label>
                  <div 
                    className={styles.iconUploader}
                    onClick={handleIconClick}
                  >
                    {newProgram.icon ? (
                      <div className={styles.iconPreview}>
                        <img src={newProgram.icon} alt="Program Icon" />
                        <button 
                          className={styles.removeIconButton}
                          onClick={handleRemoveIcon}
                          aria-label="Remove icon"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className={styles.iconPlaceholder}>
                        <Image className="h-6 w-6 text-gray-400" />
                        <span>Upload icon</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className={styles.fileInput} 
                      accept="image/*"
                      onChange={handleIconChange}
                      ref={fileInputRef}
                    />
                  </div>
                  {imageError && (
                    <div className={styles.errorMessage}>
                      <AlertCircle className="h-4 w-4" />
                      <span>{imageError}</span>
                    </div>
                  )}
                  <div className={styles.formHelp}>
                    Maximum file size: 2MB. Recommended dimensions: 200x200px.
                  </div>
                </div>
                
                {/* Program Name */}
                <div className={`${styles.formGroup} ${formErrors.name ? styles.formGroupError : ''}`}>
                  <label className={styles.formLabel}>
                    Program Name<span className={styles.requiredField}>*</span>
                  </label>
                  <input 
                    type="text" 
                    name="name"
                    value={newProgram.name}
                    onChange={handleInputChange}
                    className={`${styles.formInput} ${formErrors.name ? styles.inputError : ''}`}
                    placeholder="E.g., Bachelor of Science in Computer Science"
                    required
                  />
                  {formErrors.name && (
                    <div className={styles.errorMessage}>
                      <AlertCircle className="h-4 w-4" />
                      <span>{formErrors.name}</span>
                    </div>
                  )}
                </div>
                
                {/* Description */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea 
                    name="description"
                    value={newProgram.description}
                    onChange={handleInputChange}
                    className={styles.formTextarea}
                    placeholder="Enter program description..."
                    rows={4}
                  ></textarea>
                </div>
                
                {/* Mode of Instruction - Changed to checkboxes */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mode of Instruction</label>
                  <div className={styles.checkboxGroup}>
                    {['In-Person', 'Online', 'Hybrid', 'Self-Paced', 'Accelerated'].map(mode => (
                      <div key={mode} className={styles.checkboxItem}>
                        <input 
                          type="checkbox"
                          id={`mode-${mode}`}
                          checked={newProgram.instructionModes?.includes(mode) || false}
                          onChange={() => handleInstructionModeChange(mode)}
                          className={styles.checkbox}
                        />
                        <label htmlFor={`mode-${mode}`} className={styles.checkboxLabel}>
                          {mode}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Duration - Split into value and unit */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Duration</label>
                  <div className={styles.durationInputGroup}>
                    <input 
                      type="number" 
                      name="durationValue"
                      value={newProgram.durationValue}
                      onChange={handleInputChange}
                      className={styles.durationInput}
                      placeholder="Length"
                      min="1"
                    />
                    <select
                      name="durationUnit"
                      value={newProgram.durationUnit}
                      onChange={handleInputChange}
                      className={styles.durationUnit}
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.secondaryButton}
                onClick={handleCloseModal}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                className={`${styles.primaryButton} ${isSaving ? styles.buttonLoading : ''}`}
                onClick={handleSaveProgram}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className={styles.spinnerSmall}></span>
                    <span>{isEditMode ? 'Updating...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>{isEditMode ? 'Update Program' : 'Save Program'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 