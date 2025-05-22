const express = require('express');
const router = express.Router();
const Program = require('../models/Program');
const Book = require('../models/Book');
const Course = require('../models/Course');
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

module.exports = router; 