'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, Upload, BookOpen, Calendar, FileText, Image as ImageIcon, Code } from 'lucide-react';
import { booksApi } from '@/services/booksApi';
import { programsApi, type Program as ApiProgram } from '@/services/programsApi';
import { type Book } from '@/types';
import styles from '@/app/admin/admin.module.css';

interface BookFormProps {
  book?: Book;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookForm({ book, onClose, onSuccess }: BookFormProps) {
  const isEditMode = Boolean(book);
  
  const [formData, setFormData] = useState({
    title: book?.title || '',
    description: book?.description || '',
    author: book?.author || '',
    programId: typeof book?.programId === 'string' ? book.programId : (book?.programId as any)?._id || '',
    publishedDate: book?.publishedDate ? new Date(book.publishedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    isPublished: book?.isPublished !== undefined ? book.isPublished : true,
    bookType: book?.bookType || 'pdf',
    embedCode: book?.embedCode || '',
    embedHeight: book?.embedHeight || 600
  });
  
  const [programs, setPrograms] = useState<ApiProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>(book?.pdfUrl?.split('/').pop() || '');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>(book?.coverImage || '');
  const [additionalResources, setAdditionalResources] = useState<{ title: string; url: string }[]>(
    book?.additionalResources || [{ title: '', url: '' }]
  );
  const [showEmbedPreview, setShowEmbedPreview] = useState(false);

  const [errors, setErrors] = useState<{
    title?: string;
    programId?: string;
    pdf?: string;
    embedCode?: string;
  }>({});
  
  const [isSaving, setIsSaving] = useState(false);

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

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.programId) {
      newErrors.programId = 'Program is required';
    }

    if (formData.bookType === 'pdf' && !pdfFile && !book?.pdfUrl) {
      newErrors.pdf = 'PDF file is required for PDF book type';
    }

    if (formData.bookType === 'embed' && !formData.embedCode.trim()) {
      newErrors.embedCode = 'Embed code is required for embedded book type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = (type === 'checkbox') 
      ? (e.target as HTMLInputElement).checked 
      : value;
      
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setPdfFileName(file.name);
      
      // Clear error
      if (errors.pdf) {
        setErrors(prev => ({
          ...prev,
          pdf: undefined
        }));
      }
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      
      // Create a preview URL for the selected file
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResourceChange = (index: number, field: 'title' | 'url', value: string) => {
    const updatedResources = [...additionalResources];
    updatedResources[index] = {
      ...updatedResources[index],
      [field]: value
    };
    setAdditionalResources(updatedResources);
  };

  const addResource = () => {
    setAdditionalResources([...additionalResources, { title: '', url: '' }]);
  };

  const removeResource = (index: number) => {
    const updatedResources = [...additionalResources];
    updatedResources.splice(index, 1);
    setAdditionalResources(updatedResources);
  };

  const handleBookTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as 'pdf' | 'embed';
    setFormData(prev => ({
      ...prev,
      bookType: value
    }));
  };

  const toggleEmbedPreview = () => {
    setShowEmbedPreview(!showEmbedPreview);
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
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('author', formData.author || '');
      formDataToSend.append('programId', formData.programId);
      formDataToSend.append('publishedDate', formData.publishedDate);
      formDataToSend.append('isPublished', String(formData.isPublished));
      formDataToSend.append('bookType', formData.bookType);
      
      if (formData.bookType === 'embed') {
        formDataToSend.append('embedCode', formData.embedCode);
        formDataToSend.append('embedHeight', String(formData.embedHeight));
      }
      
      // Filter out empty resources and add valid ones
      const validResources = additionalResources.filter(r => r.title && r.url);
      if (validResources.length > 0) {
        formDataToSend.append('additionalResources', JSON.stringify(validResources));
      }
      
      // Add files if provided and if book type is PDF
      if (formData.bookType === 'pdf' && pdfFile) {
        formDataToSend.append('pdf', pdfFile);
      }
      
      if (coverFile) {
        formDataToSend.append('coverImage', coverFile);
      }

      if (isEditMode && book) {
        await booksApi.update(book._id, formDataToSend);
      } else {
        await booksApi.create(formDataToSend);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving book:', error);
      alert('Failed to save book. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const sanitizeEmbedCode = (code: string): string => {
    // Safe sanitization to allow only iframe tags with whitelisted attributes
    if (!code || typeof code !== 'string') return '';
    
    try {
      // Check if code contains an iframe
      if (!code.includes('<iframe')) return '';
      
      // Attempt to extract the iframe's src
      const srcMatch = code.match(/src=["'](.*?)["']/i);
      const src = srcMatch ? srcMatch[1] : '';
      
      if (!src) return '';
      
      // Create a sanitized iframe with controlled attributes
      return `<iframe 
        src="${src}" 
        height="${formData.embedHeight}" 
        width="100%" 
        frameborder="0" 
        allowfullscreen="true"
      ></iframe>`;
    } catch (error) {
      console.error('Error sanitizing embed code:', error);
      return '';
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditMode ? 'Edit Book' : 'Add New Book'}
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
            {/* Book Information */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>
                <BookOpen className="h-4 w-4 mr-2" />
                Book Information
              </h4>
              
              <div className={`${styles.formGroup} ${errors.title ? styles.formGroupError : ''}`}>
                <label className={styles.formLabel}>
                  Title<span className={styles.requiredField}>*</span>
                </label>
                <input 
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Enter book title"
                />
                {errors.title && (
                  <div className={styles.errorMessage}>
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.title}</span>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Author
                </label>
                <input 
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Enter author name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Description
                </label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  rows={3}
                  placeholder="Enter book description"
                />
              </div>

              <div className={`${styles.formGroup} ${errors.programId ? styles.formGroupError : ''}`}>
                <label className={styles.formLabel}>
                  Program<span className={styles.requiredField}>*</span>
                </label>
                <select
                  name="programId"
                  value={formData.programId}
                  onChange={handleInputChange}
                  className={styles.formInput}
                >
                  <option value="">Select a program</option>
                  {programs.map(program => (
                    <option key={program._id} value={program._id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                {errors.programId && (
                  <div className={styles.errorMessage}>
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.programId}</span>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Published Date
                </label>
                <div className={styles.inputWithIcon}>
                  <Calendar className={styles.inputIcon} size={18} />
                  <input 
                    type="date"
                    name="publishedDate"
                    value={formData.publishedDate}
                    onChange={handleInputChange}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <input 
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isPublished: e.target.checked
                    }))}
                    className={styles.checkboxInput}
                    style={{ marginRight: '8px' }}
                  />
                  Published
                </label>
                <div className={styles.formHelp}>
                  If checked, this book will be visible to students.
                </div>
              </div>
            </div>

            {/* Book Type Selection */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>
                Book Type
              </h4>
              
              <div className={styles.formGroup}>
                <div className={styles.radioGroup}>
                  <div className={styles.radioItem}>
                    <input 
                      type="radio"
                      id="type-pdf"
                      name="bookType"
                      value="pdf"
                      checked={formData.bookType === 'pdf'}
                      onChange={handleBookTypeChange}
                      className={styles.radioInput}
                    />
                    <label htmlFor="type-pdf" className={styles.radioLabel}>
                      <FileText className="h-4 w-4 mr-2" />
                      PDF Document
                    </label>
                  </div>
                  
                  <div className={styles.radioItem}>
                    <input 
                      type="radio"
                      id="type-embed"
                      name="bookType"
                      value="embed"
                      checked={formData.bookType === 'embed'}
                      onChange={handleBookTypeChange}
                      className={styles.radioInput}
                    />
                    <label htmlFor="type-embed" className={styles.radioLabel}>
                      <Code className="h-4 w-4 mr-2" />
                      Embedded Book
                    </label>
                  </div>
                </div>
                <div className={styles.formHelp}>
                  Choose PDF to upload a document or Embedded to use an iframe embed code.
                </div>
              </div>
            </div>
            
            {/* PDF Upload Section - Only show if book type is PDF */}
            {formData.bookType === 'pdf' && (
              <div className={styles.formSection}>
                <h4 className={styles.formSectionTitle}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF Document
                </h4>
                
                <div className={`${styles.formGroup} ${errors.pdf ? styles.formGroupError : ''}`}>
                  <label className={styles.formLabel}>
                    PDF File<span className={styles.requiredField}>*</span>
                  </label>
                  <div className={styles.fileUploadContainer}>
                    <label className={styles.fileUploadButton}>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfChange}
                        className={styles.fileInput}
                      />
                      <Upload className="h-4 w-4 mr-2" />
                      <span>Choose PDF</span>
                    </label>
                    
                    {(pdfFileName || book?.pdfUrl) && (
                      <div className={styles.filePreview}>
                        <FileText className="h-4 w-4 mr-2" />
                        <span>{pdfFileName || book?.pdfUrl?.split('/').pop()}</span>
                      </div>
                    )}
                  </div>
                  {errors.pdf && (
                    <div className={styles.errorMessage}>
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.pdf}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Embed Code Section - Only show if book type is Embed */}
            {formData.bookType === 'embed' && (
              <div className={styles.formSection}>
                <h4 className={styles.formSectionTitle}>
                  <Code className="h-4 w-4 mr-2" />
                  Embed Code
                </h4>
                
                <div className={`${styles.formGroup} ${errors.embedCode ? styles.formGroupError : ''}`}>
                  <label className={styles.formLabel}>
                    Iframe Embed Code<span className={styles.requiredField}>*</span>
                  </label>
                  <textarea 
                    name="embedCode"
                    value={formData.embedCode}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    rows={5}
                    placeholder='<iframe allowfullscreen="true" src="https://example.com/book" height="600" width="100%" frameborder="0"></iframe>'
                  />
                  {errors.embedCode && (
                    <div className={styles.errorMessage}>
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.embedCode}</span>
                    </div>
                  )}
                  <div className={styles.formHelp}>
                    Paste the iframe embed code for your book. Only iframe tags are supported.
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Embed Height (px)
                  </label>
                  <input 
                    type="number"
                    name="embedHeight"
                    value={formData.embedHeight}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    min="300"
                    max="1200"
                  />
                  <div className={styles.formHelp}>
                    Set the height of the embedded book viewer in pixels.
                  </div>
                </div>
                
                {formData.embedCode && (
                  <div className={styles.formGroup}>
                    <button 
                      type="button"
                      onClick={toggleEmbedPreview}
                      className={styles.secondaryButton}
                    >
                      {showEmbedPreview ? 'Hide Preview' : 'Show Preview'}
                    </button>
                    
                    {showEmbedPreview && formData.embedCode && (
                      <div 
                        className={styles.embedPreview}
                        style={{ 
                          marginTop: '1rem', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '0.5rem', 
                          overflow: 'hidden', 
                          height: `${formData.embedHeight}px` 
                        }}
                      >
                        <div dangerouslySetInnerHTML={{ 
                          __html: sanitizeEmbedCode(formData.embedCode) || '<div style="padding: 1rem; color: #ef4444;">Invalid embed code</div>' 
                        }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Cover Image */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Cover Image
              </h4>
              
              <div className={styles.formGroup}>
                <div className={styles.profilePicSection}>
                  <div className={styles.profilePicPreview}>
                    {coverPreviewUrl ? (
                      <img 
                        src={coverPreviewUrl} 
                        alt="Cover preview" 
                        className={styles.profilePic}
                      />
                    ) : (
                      <div className={styles.profilePicPlaceholder}>
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className={styles.profilePicUpload}>
                    <label className={styles.uploadButton}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className={styles.fileInput}
                      />
                      <Upload className="h-4 w-4 mr-2" />
                      <span>Upload Cover</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Resources */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>
                Additional Resources
              </h4>
              
              {additionalResources.map((resource, index) => (
                <div key={index} className={styles.resourceItem}>
                  <div className={styles.resourceFields}>
                    <div className={styles.formGroup}>
                      <input 
                        type="text"
                        value={resource.title}
                        onChange={(e) => handleResourceChange(index, 'title', e.target.value)}
                        className={styles.formInput}
                        placeholder="Resource Title"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <input 
                        type="text"
                        value={resource.url}
                        onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                        className={styles.formInput}
                        placeholder="URL"
                      />
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeResource(index)}
                    className={styles.removeResourceButton}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              <button 
                type="button"
                onClick={addResource}
                className={styles.addResourceButton}
              >
                + Add Resource
              </button>
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
                  <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>{isEditMode ? 'Update Book' : 'Create Book'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 