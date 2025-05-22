'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, Mail, Phone, User, Building, BookOpen } from 'lucide-react';
import styles from '@/app/admin/admin.module.css';

export default function PersonalSettings() {
  const { user, loading: authLoading, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    bio: user?.bio || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setError(null);
      await updateProfile(formData);
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (authLoading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className={styles.loadingIcon} />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.settingsForm}>
      {error && (
        <div className={styles.formError}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      
      {success && (
        <div className={styles.formSuccess}>
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            <User size={16} />
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="Enter your first name"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            <User size={16} />
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="Enter your last name"
            required
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            <Mail size={16} />
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            className={`${styles.formInput} ${styles.formInputDisabled}`}
            placeholder="Enter your email"
            disabled
          />
          <p className={styles.formHelp}>Email cannot be changed. Contact support if needed.</p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            <Phone size={16} />
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="Enter your phone number"
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          <Building size={16} />
          Department
        </label>
        <input
          type="text"
          name="department"
          value={formData.department}
          onChange={handleChange}
          className={styles.formInput}
          placeholder="Enter your department"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          <BookOpen size={16} />
          Bio
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          className={styles.formTextarea}
          placeholder="Tell us about yourself"
          rows={4}
        />
      </div>

      <div className={styles.formActions}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isSaving}
        >
          {isSaving && <span className={styles.spinnerSmall} />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
} 