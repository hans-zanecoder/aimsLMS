const express = require('express');
const router = express.Router();
const Program = require('../models/Program');
const Book = require('../models/Book');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { auth, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');

/**
 * @route   GET /api/programs
 * @desc    Get all programs with book counts
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Get all programs
    const programs = await Program.find().sort({ createdAt: -1 });
    
    // Get resource counts for each program
    const programsWithCounts = await Promise.all(programs.map(async (program) => {
      const books = await Book.find({ programId: program._id });
      
      // Count books and their resources
      const bookCount = books.length;
      let videoCount = 0;
      let assignmentCount = 0;

      books.forEach(book => {
        // Count embedded videos (if book has embedCode and it's a video)
        if (book.bookType === 'embed' && book.embedCode && 
            book.embedCode.toLowerCase().includes('video')) {
          videoCount++;
        }
        // Count additional resources as assignments
        if (book.additionalResources && Array.isArray(book.additionalResources)) {
          assignmentCount += book.additionalResources.length;
        }
      });

      return {
        ...program.toObject(),
        bookCount,
        videoCount,
        assignmentCount
      };
    }));
    
    res.json(programsWithCounts);
  } catch (error) {
    logger.error('Error fetching programs:', error);
    res.status(500).json({ message: 'Failed to fetch programs' });
  }
});

/**
 * @route   GET /api/programs/:id
 * @desc    Get a program by ID with book counts
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    // Get books and count resources
    const books = await Book.find({ programId: program._id });
      
    // Count books and their resources
    const bookCount = books.length;
    let videoCount = 0;
    let assignmentCount = 0;

    books.forEach(book => {
      // Count embedded videos (if book has embedCode and it's a video)
      if (book.bookType === 'embed' && book.embedCode && 
          book.embedCode.toLowerCase().includes('video')) {
        videoCount++;
      }
      // Count additional resources as assignments
      if (book.additionalResources && Array.isArray(book.additionalResources)) {
        assignmentCount += book.additionalResources.length;
      }
    });
    
    res.json({
      ...program.toObject(),
      bookCount,
      videoCount,
      assignmentCount
    });
  } catch (error) {
    logger.error(`Error fetching program ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch program' });
  }
});

/**
 * @route   POST /api/programs
 * @desc    Create a new program
 * @access  Admin only
 */
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const program = new Program(req.body);
    await program.save();
    
    res.status(201).json(program);
  } catch (error) {
    logger.error('Error creating program:', error);
    res.status(400).json({ message: 'Failed to create program', error: error.message });
  }
});

/**
 * @route   PUT /api/programs/:id
 * @desc    Update a program
 * @access  Admin only
 */
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      program[key] = req.body[key];
    });
    
    await program.save();
    
    res.json(program);
  } catch (error) {
    logger.error(`Error updating program ${req.params.id}:`, error);
    res.status(400).json({ message: 'Failed to update program', error: error.message });
  }
});

/**
 * @route   DELETE /api/programs/:id
 * @desc    Delete a program
 * @access  Admin only
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const program = await Program.findByIdAndDelete(req.params.id);
    
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    res.json({ message: 'Program removed successfully' });
  } catch (error) {
    logger.error(`Error deleting program ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete program' });
  }
});

/**
 * @route   GET /api/programs/:id/books
 * @desc    Get all books for a program
 * @access  Public
 */
router.get('/:id/books', async (req, res) => {
  try {
    const books = await Book.find({ programId: req.params.id })
      .sort({ createdAt: -1 });
    
    res.json(books);
  } catch (error) {
    logger.error(`Error fetching books for program ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch books' });
  }
});

/**
 * @route   GET /api/programs/:id/videos
 * @desc    Get all videos for a program
 * @access  Public
 */
router.get('/:id/videos', async (req, res) => {
  try {
    const books = await Book.find({ 
      programId: req.params.id,
      bookType: 'embed',
      embedCode: { $regex: 'video', $options: 'i' }
    }).sort({ createdAt: -1 });

    // Transform book data into video format
    const videos = books.map(book => ({
      _id: book._id,
      title: book.title,
      description: book.description,
      embedCode: book.embedCode,
      thumbnail: book.coverImage,
      duration: book.duration || 0,
      programId: book.programId,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt
    }));
    
    res.json(videos);
  } catch (error) {
    logger.error(`Error fetching videos for program ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
});

/**
 * @route   GET /api/programs/:id/assignments
 * @desc    Get all assignments for a program
 * @access  Public
 */
router.get('/:id/assignments', async (req, res) => {
  try {
    const books = await Book.find({ 
      programId: req.params.id,
      'additionalResources.type': 'assignment'
    }).sort({ createdAt: -1 });

    // Extract and flatten assignments from books
    const assignments = books.reduce((acc, book) => {
      const bookAssignments = book.additionalResources
        .filter(resource => resource.type === 'assignment')
        .map(assignment => ({
          _id: assignment._id || book._id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate || book.createdAt,
          points: assignment.points || 0,
          programId: book.programId,
          bookId: book._id,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt
        }));
      return [...acc, ...bookAssignments];
    }, []);
    
    res.json(assignments);
  } catch (error) {
    logger.error(`Error fetching assignments for program ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
});

/**
 * @route   GET /api/programs/enrollment-stats
 * @desc    Get enrollment statistics for the logged-in user
 * @access  Private
 */
router.get('/enrollment-stats', auth, async (req, res) => {
  try {
    // Get all enrollments for the user
    const enrollments = await Enrollment.find({ userId: req.user._id });
    
    // Calculate statistics
    const stats = {
      enrolledCount: enrollments.length,
      completedCount: enrollments.filter(e => e.status === 'completed').length,
      hoursStudied: enrollments.reduce((total, e) => total + (e.hoursStudied || 0), 0),
      assignmentsDue: enrollments.reduce((total, e) => total + (e.pendingAssignments || 0), 0)
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching enrollment stats:', error);
    res.status(500).json({ message: 'Failed to fetch enrollment statistics' });
  }
});

/**
 * @route   GET /api/programs/enrolled
 * @desc    Get all programs the user is enrolled in
 * @access  Private
 */
router.get('/enrolled', auth, async (req, res) => {
  try {
    // Get user's enrollments
    const enrollments = await Enrollment.find({ userId: req.user._id });
    const programIds = enrollments.map(e => e.programId);
    
    // Get enrolled programs with resource counts
    const programs = await Program.find({ _id: { $in: programIds } });
    
    // Get resource counts for each program
    const programsWithCounts = await Promise.all(programs.map(async (program) => {
      const books = await Book.find({ programId: program._id });
      
      // Count books and their resources
      const bookCount = books.length;
      let videoCount = 0;
      let assignmentCount = 0;

      books.forEach(book => {
        if (book.bookType === 'embed' && book.embedCode && 
            book.embedCode.toLowerCase().includes('video')) {
          videoCount++;
        }
        if (book.additionalResources && Array.isArray(book.additionalResources)) {
          assignmentCount += book.additionalResources.length;
        }
      });

      // Get enrollment status for this program
      const enrollment = enrollments.find(e => e.programId.toString() === program._id.toString());

      return {
        ...program.toObject(),
        bookCount,
        videoCount,
        assignmentCount,
        enrollmentStatus: enrollment?.status || 'enrolled',
        progress: enrollment?.progress || 0,
        hoursStudied: enrollment?.hoursStudied || 0
      };
    }));
    
    res.json(programsWithCounts);
  } catch (error) {
    logger.error('Error fetching enrolled programs:', error);
    res.status(500).json({ message: 'Failed to fetch enrolled programs' });
  }
});

module.exports = router; 