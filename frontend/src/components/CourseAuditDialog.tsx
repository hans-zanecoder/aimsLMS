import React, { useState, useEffect } from 'react';
import { CourseAudit, Course } from '@/types';
import { X, FileText, Clock, User, RotateCcw, AlertTriangle, Info, Check } from 'lucide-react';
import styles from './CourseAuditDialog.module.css';

interface CourseAuditDialogProps {
  courseId: string;
  courseName: string;
  onClose: () => void;
}

const CourseAuditDialog: React.FC<CourseAuditDialogProps> = ({ 
  courseId, 
  courseName,
  onClose 
}) => {
  const [auditData, setAuditData] = useState<CourseAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  // Fetch audit data for the course
  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${courseId}/audit`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch audit data');
        }
        
        const data = await response.json();
        setAuditData(data);
      } catch (err) {
        console.error('Error fetching audit data:', err);
        setError('Could not load audit history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuditData();
  }, [courseId]);

  // Get action type icon
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'update':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle expanded view for an audit entry
  const toggleExpandAudit = (auditId: string) => {
    if (expandedAuditId === auditId) {
      setExpandedAuditId(null);
    } else {
      setExpandedAuditId(auditId);
    }
  };

  // Get the field name in a more readable format
  const getReadableFieldName = (fieldName: string) => {
    // Convert camelCase to Title Case with spaces
    const result = fieldName.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  // Get a formatted string for the changed value
  const getFormattedValue = (value: any) => {
    if (value === null || value === undefined) {
      return 'None';
    }
    
    if (Array.isArray(value)) {
      return value.join(', ') || 'Empty array';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <FileText className="h-5 w-5 mr-2" />
            Audit History: {courseName}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading audit history...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <AlertTriangle className="h-6 w-6" />
              <p>{error}</p>
            </div>
          ) : auditData.length === 0 ? (
            <div className={styles.empty}>
              <FileText className="h-12 w-12 text-gray-400" />
              <p>No audit records found for this course.</p>
            </div>
          ) : (
            <div className={styles.auditList}>
              {auditData.map((audit) => (
                <div 
                  key={audit._id} 
                  className={`${styles.auditItem} ${expandedAuditId === audit._id ? styles.expanded : ''}`}
                  onClick={() => toggleExpandAudit(audit._id)}
                >
                  <div className={styles.auditHeader}>
                    <div className={styles.auditType}>
                      {getActionIcon(audit.actionType)}
                      <span className={styles.actionType}>{audit.actionType.charAt(0).toUpperCase() + audit.actionType.slice(1)}</span>
                    </div>
                    
                    <div className={styles.auditMeta}>
                      <div className={styles.auditUser}>
                        <User className="h-4 w-4" />
                        <span>
                          {typeof audit.userId === 'object' 
                            ? `${audit.userId.firstName} ${audit.userId.lastName}`
                            : 'Unknown User'}
                        </span>
                      </div>
                      
                      <div className={styles.auditTime}>
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(audit.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {expandedAuditId === audit._id && (
                    <div className={styles.auditDetails}>
                      {audit.notes && (
                        <div className={styles.auditNotes}>
                          <strong>Notes:</strong> {audit.notes}
                        </div>
                      )}
                      
                      {audit.changedFields && audit.changedFields.length > 0 && (
                        <div className={styles.changedFields}>
                          <strong>Changed Fields:</strong>
                          <ul className={styles.fieldsList}>
                            {audit.changedFields.map((field) => (
                              <li key={field} className={styles.fieldItem}>
                                <div className={styles.fieldName}>
                                  {getReadableFieldName(field)}:
                                </div>
                                <div className={styles.fieldValues}>
                                  <div className={styles.oldValue}>
                                    <strong>Before:</strong> {getFormattedValue(audit.previousData?.[field])}
                                  </div>
                                  <div className={styles.newValue}>
                                    <strong>After:</strong> {getFormattedValue(audit.newData?.[field])}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* EdStack ID display for tracking */}
                      {audit.edstackID && (
                        <div className={styles.edstackId}>
                          <strong>EdStack ID:</strong> {audit.edstackID}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseAuditDialog; 