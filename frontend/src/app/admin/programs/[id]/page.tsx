'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { programsApi } from '@/services/programsApi';
import styles from '@/app/admin/admin.module.css';

export default function ProgramDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const data = await programsApi.getById(params.id);
        setProgram(data);
      } catch (err) {
        console.error('Error fetching program:', err);
        setError('Failed to load program details');
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, [params.id]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading program details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button 
          className={styles.primaryButton}
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!program) {
    return (
      <div className={styles.error}>
        <p>Program not found</p>
        <button 
          className={styles.primaryButton}
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <button 
          className={styles.backButton}
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Programs
        </button>
      </div>

      <div className={styles.programDetails}>
        <h1 className={styles.programTitle}>{program.name}</h1>
        
        {program.description && (
          <p className={styles.programDescription}>{program.description}</p>
        )}

        {program.instructionModes && program.instructionModes.length > 0 && (
          <div className={styles.programModes}>
            {program.instructionModes.map((mode: string) => (
              <span key={mode} className={styles.programMode}>
                {mode}
              </span>
            ))}
          </div>
        )}

        {program.durationValue && program.durationUnit && (
          <div className={styles.programDuration}>
            <strong>Duration:</strong> {program.durationValue} {program.durationUnit}
          </div>
        )}
      </div>
    </div>
  );
} 