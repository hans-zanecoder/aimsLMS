const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { auth, authorize } = require('../middleware/auth');
const Instructor = require('../models/Instructor');
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = 'public/uploads/instructors';
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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

/**
 * @route   GET /api/instructors
 * @desc    Get all instructors
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const instructors = await Instructor.find()
      .sort({ createdAt: -1 })
      .populate('programs', 'name');
    res.json(instructors);
  } catch (error) {
    logger.error('Error fetching instructors:', error);
    res.status(500).json({ message: 'Failed to fetch instructors' });
  }
});

/**
 * @route   GET /api/instructors/:id
 * @desc    Get an instructor by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id)
      .populate('programs', 'name');
    
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }
    
    res.json(instructor);
  } catch (error) {
    logger.error(`Error fetching instructor ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch instructor' });
  }
});

/**
 * @route   POST /api/instructors
 * @desc    Create a new instructor
 * @access  Admin only
 */
router.post('/', auth, authorize('admin'), upload.single('profilePic'), async (req, res) => {
  try {
    const instructorData = {
      ...req.body,
      profilePic: req.file ? `/uploads/instructors/${req.file.filename}` : undefined
    };

    // Handle programs array from form data
    if (req.body.programs) {
      try {
        instructorData.programs = JSON.parse(req.body.programs);
      } catch (e) {
        // If it's already a string array, split by comma
        if (typeof req.body.programs === 'string') {
          instructorData.programs = req.body.programs.split(',');
        }
      }
    }

    const instructor = new Instructor(instructorData);
    await instructor.save();
    
    // Populate programs before returning
    await instructor.populate('programs', 'name');
    res.status(201).json(instructor);
  } catch (error) {
    // If there was an error and a file was uploaded, delete it
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error('Error deleting uploaded file:', unlinkError);
      }
    }

    logger.error('Error creating instructor:', error);
    res.status(400).json({ message: 'Failed to create instructor', error: error.message });
  }
});

/**
 * @route   PUT /api/instructors/:id
 * @desc    Update an instructor
 * @access  Admin only
 */
router.put('/:id', auth, authorize('admin'), upload.single('profilePic'), async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // If a new file is uploaded, delete the old one
    if (req.file && instructor.profilePic) {
      const oldFilePath = path.join('public', instructor.profilePic);
      try {
        await fs.unlink(oldFilePath);
      } catch (unlinkError) {
        logger.error('Error deleting old profile picture:', unlinkError);
      }
    }
    
    // Update instructor data
    const updateData = {
      ...req.body
    };

    if (req.file) {
      updateData.profilePic = `/uploads/instructors/${req.file.filename}`;
    }

    // Handle programs array from form data
    if (req.body.programs) {
      try {
        updateData.programs = JSON.parse(req.body.programs);
      } catch (e) {
        // If it's already a string array, split by comma
        if (typeof req.body.programs === 'string') {
          updateData.programs = req.body.programs.split(',');
        }
      }
    }

    Object.assign(instructor, updateData);
    await instructor.save();
    
    // Populate programs before returning
    await instructor.populate('programs', 'name');
    res.json(instructor);
  } catch (error) {
    // If there was an error and a file was uploaded, delete it
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error('Error deleting uploaded file:', unlinkError);
      }
    }

    logger.error(`Error updating instructor ${req.params.id}:`, error);
    res.status(400).json({ message: 'Failed to update instructor', error: error.message });
  }
});

/**
 * @route   DELETE /api/instructors/:id
 * @desc    Delete an instructor
 * @access  Admin only
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // Delete profile picture if it exists
    if (instructor.profilePic) {
      const filePath = path.join('public', instructor.profilePic);
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        logger.error('Error deleting profile picture:', unlinkError);
      }
    }

    await instructor.deleteOne();
    res.json({ message: 'Instructor deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting instructor ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete instructor' });
  }
});

module.exports = router; 