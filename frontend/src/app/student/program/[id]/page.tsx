'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Book, Video, FileText, Clock, Award, ArrowLeft, AlertCircle } from 'lucide-react';
import programsApi, { Program, Book as BookType, Video as VideoType, Assignment } from '@/services/programsApi';
import styles from './program.module.css';
import Image from 'next/image';

export default function ProgramDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('books');
  const [program, setProgram] = useState<Program | null>(null);
  const [books, setBooks] = useState<BookType[]>([]);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgramDetails = async () => {
      try {
        const data = await programsApi.getById(id as string);
        setProgram(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch program details');
        setLoading(false);
        console.error('Error fetching program:', err);
      }
    };

    fetchProgramDetails();
  }, [id]);

  useEffect(() => {
    const fetchContent = async () => {
      if (!program?._id) return;

      try {
        switch (activeTab) {
          case 'books':
            const books = await programsApi.getProgramBooks(program._id);
            setBooks(books);
            break;
          case 'videos':
            const videos = await programsApi.getProgramVideos(program._id);
            setVideos(videos);
            break;
          case 'assignments':
            const assignments = await programsApi.getProgramAssignments(program._id);
            setAssignments(assignments);
            break;
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
      }
    };

    fetchContent();
  }, [program?._id, activeTab]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Loading program details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!program) {
    return <div>Program not found</div>;
  }

  const renderBooks = () => (
    <div className={styles.grid}>
      {books.length > 0 ? (
        books.map((book) => (
          <div key={book._id} className={styles.card}>
            <div className={styles.cardImageContainer}>
              <Image
                src={book.coverImage}
                alt={book.title}
                width={200}
                height={300}
                className={styles.cardImage}
              />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{book.title}</h3>
              <p className={styles.cardAuthor}>by {book.author}</p>
              <p className={styles.cardDescription}>{book.description}</p>
            </div>
          </div>
        ))
      ) : (
        <div className={styles.emptyState}>
          <Book className={styles.emptyIcon} />
          <h3>No Books Available</h3>
          <p>There are no books available for this program yet.</p>
        </div>
      )}
    </div>
  );

  const renderVideos = () => (
    <div className={styles.grid}>
      {videos.length > 0 ? (
        videos.map((video) => (
          <div key={video._id} className={styles.card}>
            <div className={styles.cardImageContainer}>
              <Image
                src={video.thumbnail}
                alt={video.title}
                width={300}
                height={169}
                className={styles.cardImage}
              />
              <div className={styles.videoDuration}>
                <Clock className={styles.durationIcon} />
                <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{video.title}</h3>
              <p className={styles.cardDescription}>{video.description}</p>
            </div>
          </div>
        ))
      ) : (
        <div className={styles.emptyState}>
          <Video className={styles.emptyIcon} />
          <h3>No Videos Available</h3>
          <p>There are no videos available for this program yet.</p>
        </div>
      )}
    </div>
  );

  const renderAssignments = () => (
    <div className={styles.grid}>
      {assignments.length > 0 ? (
        assignments.map((assignment) => (
          <div key={assignment._id} className={styles.assignmentCard}>
            <div className={styles.assignmentHeader}>
              <div className={styles.assignmentStatus}>
                <span className={styles.statusIndicator} />
                <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
              </div>
              <div className={styles.points}>
                <Award className={styles.pointsIcon} />
                <span>{assignment.points} points</span>
              </div>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{assignment.title}</h3>
              <p className={styles.cardDescription}>{assignment.description}</p>
              <div className={styles.assignmentFooter}>
                <button className={styles.submitButton}>
                  Submit Assignment
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className={styles.emptyState}>
          <FileText className={styles.emptyIcon} />
          <h3>No Assignments Available</h3>
          <p>There are no assignments available for this program yet.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/student/dashboard')}
        >
          <ArrowLeft className={styles.backIcon} />
          <span>Back to Dashboard</span>
        </button>
        <h1 className={styles.title}>{program.name}</h1>
      </div>
      <p className={styles.description}>{program.description}</p>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'books' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('books')}
        >
          <Book className={styles.tabIcon} />
          <span>Books</span>
          <span className={styles.count}>{program.bookCount}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'videos' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <Video className={styles.tabIcon} />
          <span>Videos</span>
          <span className={styles.count}>{program.videoCount}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'assignments' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <FileText className={styles.tabIcon} />
          <span>Assignments</span>
          <span className={styles.count}>{program.assignmentCount}</span>
        </button>
      </div>

      {/* Content Grid */}
      <div className={styles.contentGrid}>
        {activeTab === 'books' && renderBooks()}
        {activeTab === 'videos' && renderVideos()}
        {activeTab === 'assignments' && renderAssignments()}
      </div>
    </div>
  );
} 