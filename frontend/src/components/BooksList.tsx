'use client';

import { useState, useEffect } from 'react';
import { Book, BookOpen, Edit, Search, Trash2, FileText, Plus, Eye } from 'lucide-react';
import { booksApi } from '@/services/booksApi';
import { programsApi } from '@/services/programsApi';
import BookForm from './BookForm';
import { Book as BookType } from '@/types';
import styles from '@/app/admin/admin.module.css';

export default function BooksList() {
  const [books, setBooks] = useState<BookType[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBook, setEditingBook] = useState<BookType | null>(null);
  const [programs, setPrograms] = useState<{_id: string; name: string}[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await booksApi.getAll();
      setBooks(data);
      setFilteredBooks(data);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const data = await programsApi.getAll();
      setPrograms(data);
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchPrograms();
  }, [refreshKey]);

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

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await booksApi.delete(id);
        handleRefresh();
      } catch (error) {
        console.error('Failed to delete book:', error);
        alert('Failed to delete book. Please try again.');
      }
    }
  };

  const handleEdit = (book: BookType) => {
    setEditingBook(book);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingBook(null);
  };

  const getProgramName = (programId: any): string => {
    if (typeof programId === 'object' && programId && programId.name) {
      return programId.name;
    }
    
    const program = programs.find(p => p._id === programId);
    return program ? program.name : 'Unknown Program';
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <h2 className={styles.sectionTitle}>Book Management</h2>
          <p className={styles.sectionDescription}>
            Manage educational books and resources for your programs
          </p>
        </div>
        <button 
          className={styles.primaryButton}
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4" />
          Add New Book
        </button>
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
            {programs.map((program) => (
              <option key={program._id} value={program._id}>
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
          <h3>No books found</h3>
          <p>
            {searchTerm || programFilter 
              ? 'Try adjusting your search or filter' 
              : 'Add your first book to get started'}
          </p>
          {!searchTerm && !programFilter && (
            <button 
              className={styles.emptyStateButton}
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4" />
              Add Book
            </button>
          )}
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
              </div>
              <div className={styles.bookActions}>
                <div className={`${styles.bookStatusBadge} ${book.isPublished ? styles.published : styles.unpublished}`}>
                  {book.isPublished ? 'Published' : 'Draft'}
                </div>
                <div className={styles.actionButtons}>
                  <button 
                    className={styles.iconButton}
                    onClick={() => handleEdit(book)}
                    title="Edit book"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {book.bookType === 'pdf' ? (
                    <a 
                      href={book.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.iconButton}
                      title="View PDF"
                    >
                      <FileText className="h-4 w-4" />
                    </a>
                  ) : (
                    <button
                      className={styles.iconButton}
                      onClick={() => {
                        const srcMatch = book.embedCode?.match(/src=["'](.*?)["']/i);
                        const src = srcMatch?.[1];
                        if (src) {
                          window.open(src, '_blank');
                        } else {
                          alert('Cannot extract URL from embed code');
                        }
                      }}
                      title="View Embedded Book"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button 
                    className={`${styles.iconButton} ${styles.deleteButton}`}
                    onClick={() => handleDelete(book._id)}
                    title="Delete book"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showAddForm || editingBook) && (
        <BookForm
          book={editingBook || undefined}
          onClose={closeForm}
          onSuccess={() => {
            closeForm();
            handleRefresh();
          }}
        />
      )}
    </div>
  );
} 