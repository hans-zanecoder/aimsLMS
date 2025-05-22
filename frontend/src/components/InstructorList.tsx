import React, { useState, useEffect } from 'react';
import { UserPlus, Pencil, Trash2, AlertCircle, User, Mail, Phone, Building2, BookOpen, GraduationCap } from 'lucide-react';
import { instructorsApi, type Instructor } from '@/services/instructorsApi';
import InstructorForm from './InstructorForm';
import styles from '@/app/admin/admin.module.css';

export default function InstructorList() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | undefined>();

  const fetchInstructors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await instructorsApi.getAll();
      setInstructors(data);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      setError('Failed to load instructors. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleAddClick = () => {
    setSelectedInstructor(undefined);
    setShowModal(true);
  };

  const handleEditClick = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setShowModal(true);
  };

  const handleDeleteClick = async (instructor: Instructor) => {
    if (!window.confirm(`Are you sure you want to delete ${instructor.firstName} ${instructor.lastName}?`)) {
      return;
    }

    try {
      await instructorsApi.delete(instructor._id);
      await fetchInstructors();
    } catch (error) {
      console.error('Error deleting instructor:', error);
      alert('Failed to delete instructor. Please try again.');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedInstructor(undefined);
  };

  const handleModalSuccess = () => {
    fetchInstructors();
    handleModalClose();
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading instructors...</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
        <h2 className={styles.sectionTitle}>Instructors</h2>
          <p className={styles.sectionDescription}>
            Manage your institution's teaching staff and their course assignments
          </p>
        </div>
        <button
          className={styles.primaryButton}
          onClick={handleAddClick}
        >
          <UserPlus className="h-5 w-5" />
          <span>Add Instructor</span>
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {instructors.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <GraduationCap className="h-16 w-16" />
          </div>
          <h3>No Instructors Found</h3>
          <p>Start building your teaching team by adding your first instructor.</p>
          <button className={styles.emptyStateButton} onClick={handleAddClick}>
            <UserPlus className="h-5 w-5" />
            Add Instructor
          </button>
        </div>
      ) : (
        <div className={styles.programCards}>
              {instructors.map((instructor) => (
            <div key={instructor._id} className={styles.programCard}>
              <div className={styles.programCardHeader}>
                <div className={styles.instructorCardMain}>
                  <div className={styles.instructorAvatar}>
                    {instructor.firstName[0]}{instructor.lastName[0]}
                  </div>
                  <div className={styles.programCardInfo}>
                    <h3 className={styles.programCardTitle}>
                      {instructor.firstName} {instructor.lastName}
                    </h3>
                    <div className={styles.cardInfoItem}>
                      <Mail className="h-4 w-4" />
                      <span>{instructor.email}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.programCardActions}>
                      <button
                        onClick={() => handleEditClick(instructor)}
                    className={`${styles.iconButton} ${styles.editButton}`}
                        title="Edit instructor"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(instructor)}
                    className={`${styles.iconButton} ${styles.deleteButton}`}
                        title="Delete instructor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
              </div>

              <div className={styles.programCardContent}>
                <div className={styles.cardInfo}>
                  {instructor.phone && (
                    <div className={styles.cardInfoItem}>
                      <Phone className="h-4 w-4" />
                      <span>{instructor.phone}</span>
                    </div>
                  )}

                  {instructor.department && (
                    <div className={styles.cardInfoItem}>
                      <Building2 className="h-4 w-4" />
                      <span>{instructor.department}</span>
                    </div>
                  )}

                  {instructor.courses && (
                    <div className={styles.cardInfoItem}>
                      <BookOpen className="h-4 w-4" />
                      <span>{instructor.courses.length} {instructor.courses.length === 1 ? 'Course' : 'Courses'}</span>
                    </div>
                  )}
                </div>

                {instructor.expertise && instructor.expertise.length > 0 && (
                  <div className={styles.programCardModes}>
                    {instructor.expertise.map((exp, index) => (
                      <span key={index} className={styles.programCardMode}>
                        {exp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <InstructorForm
          instructor={selectedInstructor}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
} 