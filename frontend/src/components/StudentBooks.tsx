'use client';

import { useState, useEffect } from 'react';
import { Book, BookOpen, Search, FileText, Download, ExternalLink } from 'lucide-react';
import { booksApi } from '@/services/booksApi';
import { Book as BookType } from '@/types';
import styles from '@/app/admin/admin.module.css';

export default function StudentBooks() {
  const [books, setBooks] = useState<BookType[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [uniquePrograms, setUniquePrograms] = useState<{id: string; name: string}[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await booksApi.getStudentBooks();
      setBooks(data);
      setFilteredBooks(data);
      
      // Extract unique programs from the books
      const programs = data.reduce((acc: {id: string; name: string}[], book) => {
        const programId = typeof book.programId === 'string' 
          ? book.programId 
          : (book.programId as any)?._id;
          
        const programName = typeof book.programId === 'string'
          ? 'Unknown Program'
          : (book.programId as any)?.name || 'Unknown Program';
          
        if (!acc.some(p => p.id === programId)) {
          acc.push({ id: programId, name: programName });
        }
        
        return acc;
      }, []);
      
      setUniquePrograms(programs);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    let filtered = [...books];
    
    // Apply program filter
    if (programFilter) {
      filtered = filtered.filter(book => {
        const programId = typeof book.programId === 'string' 
          ? book.programId 
          : (book.programId as any)?._id;
          
        return programId === programFilter;
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(term) || 
        (book.author && book.author.toLowerCase().includes(term)) ||
        (book.description && book.description.toLowerCase().includes(term))
      );
    }
    
    setFilteredBooks(filtered);
  }, [books, searchTerm, programFilter]);

  const openPdfViewer = (book: BookType) => {
    setSelectedBook(book);
  };

  const closeViewer = () => {
    setSelectedBook(null);
  };

  const renderBookContent = (book: BookType) => {
    if (!book) return null;
    
    try {
      if (book.bookType === 'embed' && book.embedCode) {
        // For embedded books, render the iframe with sanitized embed code
        return (
          <div 
            className={styles.embedContainer}
            style={{ height: `${book.embedHeight || 600}px` }}
            dangerouslySetInnerHTML={{ 
              __html: sanitizeEmbedCode(book.embedCode)
            }}
          />
        );
      } else if (book.pdfUrl) {
        // For PDF books, render the iframe with the PDF URL
        return (
          <iframe
            src={book.pdfUrl}
            className={styles.pdfViewer}
            style={{ height: '100%', width: '100%' }}
            title={`PDF Viewer: ${book.title}`}
          />
        );
      } else {
        return <div>Content unavailable</div>;
      }
    } catch (error) {
      console.error('Error rendering book content:', error);
      return <div>Error loading content. Please try again.</div>;
    }
  };

  // Safe sanitization function to only allow iframe tags with safe attributes
  const sanitizeEmbedCode = (code: string): string => {
    if (!code || typeof code !== 'string') return '';
    
    try {
      // Extract the src attribute
      const srcMatch = code.match(/src=["'](.*?)["']/i);
      const src = srcMatch ? srcMatch[1] : '';
      
      if (!src) return '';
      
      // Create a sanitized iframe with only essential attributes
      return `<iframe 
        src="${src}" 
        height="100%" 
        width="100%" 
        frameborder="0" 
        allowfullscreen="true"
      ></iframe>`;
    } catch (error) {
      console.error('Error sanitizing embed code:', error);
      return '';
    }
  };

  const getProgramName = (programId: any): string => {
    if (typeof programId === 'object' && programId && programId.name) {
      return programId.name;
    }
    
    const program = uniquePrograms.find(p => p.id === programId);
    return program ? program.name : 'Unknown Program';
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <h2 className={styles.sectionTitle}>Your Books</h2>
          <p className={styles.sectionDescription}>
            Access books and resources for your enrolled programs
          </p>
        </div>
      </div>

      <div className={styles.actionBar}>
        <div className={styles.searchWrapper}>
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search books..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterWrapper}>
          <select
            className={styles.filterSelect}
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
          >
            <option value="">All Programs</option>
            {uniquePrograms.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Loading books...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen className="h-12 w-12 text-gray-400" />
          <h3>No books available</h3>
          <p>
            {searchTerm || programFilter 
              ? 'Try adjusting your search or filter' 
              : 'You don\'t have any books available yet'}
          </p>
        </div>
      ) : (
        <div className={styles.bookGrid}>
          {filteredBooks.map((book) => (
            <div key={book._id} className={styles.bookCard}>
              <div className={styles.bookCover}>
                {book.coverImage ? (
                  <img 
                    src={book.coverImage} 
                    alt={`Cover for ${book.title}`} 
                  />
                ) : (
                  <div className={styles.noCover}>
                    <Book className="h-12 w-12 text-gray-400" />
                    <span className="text-sm mt-2">No Cover</span>
                  </div>
                )}
              </div>
              <div className={styles.bookInfo}>
                <h3 className={styles.bookTitle}>{book.title}</h3>
                {book.author && (
                  <p className={styles.bookAuthor}>by {book.author}</p>
                )}
                <div className={styles.bookProgram}>
                  {getProgramName(book.programId)}
                </div>
                {book.description && (
                  <p className={styles.bookDescription}>{book.description}</p>
                )}
                
                {book.additionalResources && book.additionalResources.length > 0 && (
                  <div className={styles.resourcesList}>
                    <h4 className={styles.resourcesTitle}>Additional Resources</h4>
                    <ul>
                      {book.additionalResources.map((resource, index) => (
                        <li key={index} className={styles.resourceLink}>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {resource.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className={styles.bookActions}>
                <button 
                  className={styles.viewButton}
                  onClick={() => openPdfViewer(book)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {book.bookType === 'embed' ? 'View' : 'Read'}
                </button>
                {book.bookType === 'pdf' && (
                  <a 
                    href={book.pdfUrl}
                    download
                    className={styles.viewButton}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBook && (
        <div className={styles.modalOverlay} onClick={closeViewer}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '90%', width: '1000px', height: '90vh' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{selectedBook.title}</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={closeViewer}
              >
                <FileText className="h-5 w-5" />
                Close Viewer
              </button>
            </div>
            <div className={styles.pdfContainer} style={{ height: 'calc(90vh - 80px)' }}>
              {renderBookContent(selectedBook)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 