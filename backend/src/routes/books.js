const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { auth, authorize } = require('../middleware/auth');
const Book = require('../models/Book');
const Student = require('../models/Student');
const Program = require('../models/Program');
const logger = require('../utils/logger');

// Configure multer for PDF uploads
const pdfStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = 'public/uploads/books/pdfs';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Sanitize filename and keep extension
    const filename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueSuffix + '-' + filename);
  }
});

// Configure multer for cover image uploads
const coverStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = 'public/uploads/books/covers';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Set up PDF file upload middleware
const uploadPdf = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit for PDFs
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  }
});

// Set up cover image upload middleware
const uploadCover = multer({
  storage: coverStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for images
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for covers!'));
    }
  }
});

// Combined upload middleware
const upload = multer({
  storage: multer.memoryStorage(), // Temporarily store in memory
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
});

// Create a new book (admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    // Use multer's single file upload for both PDF and cover image
    upload.fields([
      { name: 'pdf', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 }
    ])(req, res, async function(err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      // Check book type
      const bookType = req.body.bookType || 'pdf';
      
      // Process PDF file if book type is PDF
      let pdfPath = null;
      if (bookType === 'pdf') {
        if (req.files.pdf && req.files.pdf[0]) {
          const pdfFile = req.files.pdf[0];
          const pdfUploadDir = 'public/uploads/books/pdfs';
          await fs.mkdir(pdfUploadDir, { recursive: true });
          
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const sanitizedFilename = pdfFile.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
          const pdfFilename = uniqueSuffix + '-' + sanitizedFilename;
          const pdfFullPath = path.join(pdfUploadDir, pdfFilename);
          
          await fs.writeFile(pdfFullPath, pdfFile.buffer);
          pdfPath = `/uploads/books/pdfs/${pdfFilename}`;
        } else {
          return res.status(400).json({ message: 'PDF file is required for PDF book type' });
        }
      }

      // Process embed code if book type is embed
      let embedCode = null;
      let embedHeight = 600;
      if (bookType === 'embed') {
        if (!req.body.embedCode) {
          return res.status(400).json({ message: 'Embed code is required for embedded book type' });
        }
        embedCode = req.body.embedCode;
        embedHeight = parseInt(req.body.embedHeight) || 600;
      }

      // Process cover image if provided
      let coverPath = null;
      if (req.files.coverImage && req.files.coverImage[0]) {
        const coverFile = req.files.coverImage[0];
        const coverUploadDir = 'public/uploads/books/covers';
        await fs.mkdir(coverUploadDir, { recursive: true });
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const coverFilename = uniqueSuffix + path.extname(coverFile.originalname);
        const coverFullPath = path.join(coverUploadDir, coverFilename);
        
        await fs.writeFile(coverFullPath, coverFile.buffer);
        coverPath = `/uploads/books/covers/${coverFilename}`;
      }

      // Parse the additional resources
      let additionalResources = [];
      if (req.body.additionalResources) {
        try {
          additionalResources = JSON.parse(req.body.additionalResources);
        } catch (e) {
          logger.error('Error parsing additional resources:', e);
        }
      }

      // Create book object with parsed data
      const bookData = {
        title: req.body.title,
        description: req.body.description,
        author: req.body.author,
        programId: req.body.programId,
        bookType: bookType,
        publishedDate: req.body.publishedDate ? new Date(req.body.publishedDate) : new Date(),
        isPublished: req.body.isPublished === 'true',
        additionalResources: additionalResources
      };

      // Add specific fields based on book type
      if (bookType === 'pdf') {
        bookData.pdfUrl = pdfPath;
      } else if (bookType === 'embed') {
        bookData.embedCode = embedCode;
        bookData.embedHeight = embedHeight;
      }
      
      // Add cover image if provided
      if (coverPath) {
        bookData.coverImage = coverPath;
      }

      // Validate the programId exists
      const program = await Program.findById(bookData.programId);
      if (!program) {
        return res.status(404).json({ message: 'Program not found' });
      }

      // Create and save the book
      const book = new Book(bookData);
      await book.save();

      // Populate the program information
      await book.populate('programId', 'name');

      res.status(201).json(book);
    });
  } catch (error) {
    logger.error('Error creating book:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all books
router.get('/', async (req, res) => {
  try {
    const { programId, isPublished, search } = req.query;
    
    // Build filter object
    const filter = {};
    if (programId) filter.programId = programId;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
    
    // Text search if provided
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(filter)
      .populate('programId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(books);
  } catch (error) {
    logger.error('Error fetching books:', error);
    res.status(500).json({ message: 'Failed to fetch books' });
  }
});

// Get books for a student based on their enrolled programs
router.get('/student', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the student's enrolled courses
    const student = await Student.findOne({ userId })
      .populate({
        path: 'coursesEnrolled',
        populate: {
          path: 'program',
          select: '_id name'
        }
      });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Extract unique program IDs from the student's courses
    const programIds = student.coursesEnrolled
      .filter(course => course.program) // Filter out courses with no program
      .map(course => course.program._id);
    
    // Remove duplicates
    const uniqueProgramIds = [...new Set(programIds.map(id => id.toString()))];
    
    // Find all published books for these programs
    const books = await Book.find({
      programId: { $in: uniqueProgramIds },
      isPublished: true
    }).populate('programId', 'name');
    
    res.json(books);
  } catch (error) {
    logger.error('Error fetching student books:', error);
    res.status(500).json({ message: 'Failed to fetch books' });
  }
});

// Get a specific book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('programId', 'name');
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    logger.error(`Error fetching book ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch book' });
  }
});

// Update a book (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    upload.fields([
      { name: 'pdf', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 }
    ])(req, res, async function(err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const book = await Book.findById(req.params.id);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      // Update book type if provided
      if (req.body.bookType) {
        book.bookType = req.body.bookType;
      }

      // Process PDF file if provided and book type is PDF
      if (book.bookType === 'pdf' && req.files.pdf && req.files.pdf[0]) {
        // Delete old PDF if it exists
        if (book.pdfUrl) {
          try {
            const oldPdfPath = path.join('public', book.pdfUrl);
            await fs.unlink(oldPdfPath);
          } catch (unlinkError) {
            logger.error('Error deleting old PDF:', unlinkError);
          }
        }

        // Save new PDF
        const pdfFile = req.files.pdf[0];
        const pdfUploadDir = 'public/uploads/books/pdfs';
        await fs.mkdir(pdfUploadDir, { recursive: true });
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedFilename = pdfFile.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const pdfFilename = uniqueSuffix + '-' + sanitizedFilename;
        const pdfFullPath = path.join(pdfUploadDir, pdfFilename);
        
        await fs.writeFile(pdfFullPath, pdfFile.buffer);
        book.pdfUrl = `/uploads/books/pdfs/${pdfFilename}`;
      }

      // Process embed code if book type is embed
      if (book.bookType === 'embed' && req.body.embedCode) {
        book.embedCode = req.body.embedCode;
        
        if (req.body.embedHeight) {
          book.embedHeight = parseInt(req.body.embedHeight) || 600;
        }
      }

      // Process cover image if provided
      if (req.files.coverImage && req.files.coverImage[0]) {
        // Delete old cover image if it exists
        if (book.coverImage) {
          try {
            const oldCoverPath = path.join('public', book.coverImage);
            await fs.unlink(oldCoverPath);
          } catch (unlinkError) {
            logger.error('Error deleting old cover image:', unlinkError);
          }
        }

        // Save new cover image
        const coverFile = req.files.coverImage[0];
        const coverUploadDir = 'public/uploads/books/covers';
        await fs.mkdir(coverUploadDir, { recursive: true });
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const coverFilename = uniqueSuffix + path.extname(coverFile.originalname);
        const coverFullPath = path.join(coverUploadDir, coverFilename);
        
        await fs.writeFile(coverFullPath, coverFile.buffer);
        book.coverImage = `/uploads/books/covers/${coverFilename}`;
      }

      // Update text fields
      if (req.body.title) book.title = req.body.title;
      if (req.body.description) book.description = req.body.description;
      if (req.body.author) book.author = req.body.author;
      
      if (req.body.programId) {
        // Validate the programId exists
        const program = await Program.findById(req.body.programId);
        if (!program) {
          return res.status(404).json({ message: 'Program not found' });
        }
        book.programId = req.body.programId;
      }
      
      if (req.body.publishedDate) book.publishedDate = new Date(req.body.publishedDate);
      if (req.body.isPublished !== undefined) book.isPublished = req.body.isPublished === 'true';

      // Parse and update additional resources
      if (req.body.additionalResources) {
        try {
          book.additionalResources = JSON.parse(req.body.additionalResources);
        } catch (e) {
          logger.error('Error parsing additional resources:', e);
        }
      }

      // Save updated book
      await book.save();
      await book.populate('programId', 'name');
      
      res.json(book);
    });
  } catch (error) {
    logger.error(`Error updating book ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to update book' });
  }
});

// Delete a book (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Delete PDF file if it exists
    if (book.pdfUrl) {
      try {
        const pdfPath = path.join('public', book.pdfUrl);
        await fs.unlink(pdfPath);
      } catch (unlinkError) {
        logger.error('Error deleting PDF file:', unlinkError);
      }
    }

    // Delete cover image if it exists
    if (book.coverImage) {
      try {
        const coverPath = path.join('public', book.coverImage);
        await fs.unlink(coverPath);
      } catch (unlinkError) {
        logger.error('Error deleting cover image:', unlinkError);
      }
    }

    // Delete the book from the database
    await book.deleteOne();
    
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting book ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete book' });
  }
});

module.exports = router; 