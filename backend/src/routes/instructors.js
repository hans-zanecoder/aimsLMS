const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { auth, authorize } = require('../middleware/auth');
const Instructor = require('../models/Instructor');
const logger = require('../utils/logger');
const User = require('../models/User');
const Course = require('../models/Course');
const Student = require('../models/Student');

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

// Get all students for an instructor's courses
router.get('/my-students', auth, authorize('instructor'), async (req, res) => {
  try {
    // Find all courses taught by the instructor
    const courses = await Course.find({ instructorId: req.user._id });
    const courseIds = courses.map(course => course._id);

    // Find all students enrolled in these courses
    const students = await Student.find({
      coursesEnrolled: { $in: courseIds }
    }).populate('userId', 'firstName lastName email');

    logger.info(`Successfully fetched students for instructor: ${req.user._id}`);
    res.json(students);
  } catch (error) {
    logger.error(`Error fetching instructor's students: ${error.message}`);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// Add students to a course
router.post('/courses/:courseId/students', auth, authorize('instructor'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { students } = req.body; // Array of student emails

    // Verify the course exists and belongs to the instructor
    const course = await Course.findOne({
      _id: courseId,
      instructorId: req.user._id
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' });
    }

    const results = {
      success: [],
      failed: []
    };

    // Process each student email
    for (const email of students) {
      try {
        // Find or create user
        let user = await User.findOne({ email });
        
        if (!user) {
          // Create new user with temporary password
          const tempPassword = Math.random().toString(36).slice(-8);
          user = await User.create({
            email,
            password: tempPassword,
            role: 'student',
            firstName: email.split('@')[0], // Temporary name from email
            lastName: '',
            needsPasswordChange: true // Flag to force password change on first login
          });
        }

        // Find or create student record
        let student = await Student.findOne({ userId: user._id });
        if (!student) {
          student = await Student.create({
            userId: user._id,
            coursesEnrolled: [courseId]
          });
        } else if (!student.coursesEnrolled.includes(courseId)) {
          student.coursesEnrolled.push(courseId);
          await student.save();
        }

        // Add student to course if not already added
        if (!course.enrolledStudents.includes(student._id)) {
          course.enrolledStudents.push(student._id);
          course.totalEnrollment = course.enrolledStudents.length;
          await course.save();
        }

        results.success.push({
          email,
          message: 'Successfully enrolled'
        });

        // TODO: Send email to student with login credentials if newly created

      } catch (error) {
        results.failed.push({
          email,
          error: error.message
        });
      }
    }

    logger.info(`Added students to course ${courseId}`);
    res.json({
      message: 'Student enrollment process completed',
      results
    });

  } catch (error) {
    logger.error(`Error adding students to course: ${error.message}`);
    res.status(500).json({ message: 'Error adding students to course' });
  }
});

// Remove student from course
router.delete('/courses/:courseId/students/:studentId', auth, authorize('instructor'), async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // Verify the course exists and belongs to the instructor
    const course = await Course.findOne({
      _id: courseId,
      instructorId: req.user._id
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' });
    }

    // Remove student from course
    course.enrolledStudents = course.enrolledStudents.filter(
      id => id.toString() !== studentId
    );
    course.totalEnrollment = course.enrolledStudents.length;
    await course.save();

    // Remove course from student's enrolled courses
    await Student.findByIdAndUpdate(studentId, {
      $pull: { coursesEnrolled: courseId }
    });

    logger.info(`Removed student ${studentId} from course ${courseId}`);
    res.json({ message: 'Student removed from course successfully' });

  } catch (error) {
    logger.error(`Error removing student from course: ${error.message}`);
    res.status(500).json({ message: 'Error removing student from course' });
  }
});

// Get student progress in a course
router.get('/courses/:courseId/students/:studentId/progress', auth, authorize('instructor'), async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // Verify the course exists and belongs to the instructor
    const course = await Course.findOne({
      _id: courseId,
      instructorId: req.user._id
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' });
    }

    // Get student's progress
    const student = await Student.findById(studentId)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'coursesEnrolled',
        match: { _id: courseId },
        select: 'title modules'
      });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Calculate progress statistics
    const progress = {
      student: {
        id: student._id,
        name: `${student.userId.firstName} ${student.userId.lastName}`,
        email: student.userId.email
      },
      course: course.title,
      completedModules: 0,
      totalModules: course.modules.length,
      completedAssignments: 0,
      totalAssignments: 0,
      lastActivity: student.lastActivityDate
    };

    logger.info(`Fetched progress for student ${studentId} in course ${courseId}`);
    res.json(progress);

  } catch (error) {
    logger.error(`Error fetching student progress: ${error.message}`);
    res.status(500).json({ message: 'Error fetching student progress' });
  }
});

// Get all available students (for course assignment)
router.get('/available-students', auth, authorize('instructor'), async (req, res) => {
  try {
    // Get all users with student role
    const students = await User.find({ 
      role: 'student',
      // Optionally add more filters here
    })
    .select('firstName lastName email status createdAt')
    .sort({ createdAt: -1 })
    .lean();

    // Get the instructor's courses
    const courses = await Course.find({ instructorId: req.user._id })
      .select('_id title enrolledStudents')
      .lean();

    // For each student, check their enrollment status
    const studentsWithEnrollment = await Promise.all(students.map(async (student) => {
      // Find student record to get course enrollments
      const studentRecord = await Student.findOne({ userId: student._id })
        .select('coursesEnrolled')
        .lean();

      return {
        ...student,
        coursesEnrolled: studentRecord ? studentRecord.coursesEnrolled : [],
        // Check if student is enrolled in any of the instructor's courses
        isEnrolled: courses.some(course => 
          course.enrolledStudents?.some(id => id.toString() === student._id.toString())
        )
      };
    }));

    logger.info(`Successfully fetched ${students.length} students for instructor ${req.user._id}`);
    res.json({
      students: studentsWithEnrollment,
      courses
    });
  } catch (error) {
    logger.error('Error fetching available students:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// Batch assign students to course
router.post('/courses/:courseId/batch-assign', auth, authorize('instructor'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentIds } = req.body;

    // Verify the course exists and belongs to the instructor
    const course = await Course.findOne({
      _id: courseId,
      instructorId: req.user._id
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' });
    }

    const results = {
      success: [],
      failed: []
    };

    // Process each student
    for (const studentId of studentIds) {
      try {
        // Find student user
        const user = await User.findById(studentId);
        if (!user) {
          results.failed.push({
            id: studentId,
            error: 'Student not found'
          });
          continue;
        }

        // Find or create student record
        let student = await Student.findOne({ userId: studentId });
        if (!student) {
          student = await Student.create({
            userId: studentId,
            coursesEnrolled: [courseId],
            status: 'Active'
          });
        } else if (!student.coursesEnrolled.includes(courseId)) {
          student.coursesEnrolled.push(courseId);
          await student.save();
        }

        // Add student to course if not already added
        if (!course.enrolledStudents.includes(student._id)) {
          course.enrolledStudents.push(student._id);
          course.totalEnrollment = course.enrolledStudents.length;
          await course.save();
        }

        results.success.push({
          id: studentId,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        });

      } catch (error) {
        results.failed.push({
          id: studentId,
          error: error.message
        });
      }
    }

    logger.info(`Batch assigned students to course ${courseId}`);
    res.json({
      message: 'Batch enrollment completed',
      results
    });

  } catch (error) {
    logger.error('Error in batch course assignment:', error);
    res.status(500).json({ message: 'Error assigning students to course' });
  }
});

module.exports = router; 