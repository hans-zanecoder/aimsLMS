const express = require('express');
const Course = require('../models/Course');
const CourseAudit = require('../models/CourseAudit');
const User = require('../models/User');
const Student = require('../models/Student');
const { auth, authorize } = require('../middleware/auth');
const { error: logError, info: logInfo, warn: logWarn } = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Configure multer for course image uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = 'public/uploads/courses';
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
    // Only allow image files
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all courses
router.get('/', auth, async (req, res) => {
  try {
    const { status, category, instructor, level, search, featured, sortBy, populate } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (instructor) filter.instructorId = instructor;
    if (level) filter.level = level;
    if (featured === 'true') filter.isFeatured = true;
    
    // Text search if provided
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Only return published courses for non-admin users
    if (!req.user || req.user.role !== 'admin') {
      filter.status = 'Published';
    }

    // Build sort options
    let sortOptions = {};
    if (sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (sortBy === 'popular') {
      sortOptions = { totalEnrollment: -1 };
    } else if (sortBy === 'rating') {
      sortOptions = { averageRating: -1 };
    } else {
      // Default sort
      sortOptions = { createdAt: -1 };
    }

    // Start with a query
    let query = Course.find(filter).sort(sortOptions);
    
    // Always populate instructorId and programId
    query = query.populate('instructorId', 'firstName lastName email');
    query = query.populate('programId', 'name');
    
    // Execute the query
    const courses = await query.select('-modules'); // Exclude detailed content for list view
    
    logInfo('Successfully fetched all courses');
    res.json(courses);
  } catch (error) {
    logError(`Error fetching courses: ${error.message}`);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

// Get featured courses
router.get('/featured', async (req, res) => {
  try {
    const featuredCourses = await Course.find({ 
      isFeatured: true,
      status: 'Published'
    })
    .sort({ averageRating: -1 })
    .limit(6)
    .populate('instructorId', 'firstName lastName email')
    .select('-modules');
    
    logInfo('Successfully fetched featured courses');
    res.json(featuredCourses);
  } catch (error) {
    logError(`Error fetching featured courses: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id)
      .populate('instructorId', 'firstName lastName email')
      .populate('programId', 'name')
      .populate({
        path: 'enrolledStudents',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        }
      })
      .populate({
        path: 'reviews.studentId',
        select: 'firstName lastName email avatar'
      });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if unpublished course is being accessed by unauthorized user
    if (course.status !== 'Published' && (!req.user || (req.user.role !== 'admin' && req.user._id.toString() !== course.instructorId._id.toString()))) {
      return res.status(403).json({ message: 'Not authorized to view this course' });
    }

    logInfo(`Successfully fetched course: ${id}`);
    res.json(course);
  } catch (error) {
    logError(`Error fetching course: ${error.message}`);
    res.status(500).json({ message: 'Error fetching course' });
  }
});

// Create a new course (admin and instructor only)
router.post('/', auth, authorize('admin', 'instructor'), upload.single('courseImage'), async (req, res) => {
  try {
    const { 
      title, description, category, duration, 
      modules, status, level, prerequisites, 
      learningObjectives, tags, price, isFeatured,
      language, // New language field
      campus, // Including campus in the request body
      programId, // Including programId
      startDate, // Including startDate
      endDate, // Including endDate
      classDays, // Including classDays
      classStartTime, // Including classStartTime
      classEndTime, // Including classEndTime
      totalWeeks, // Including totalWeeks
      hoursPerWeek // Including hoursPerWeek
    } = req.body;
    
    // Use the logged-in user as instructor if not specified
    const instructorId = req.body.instructor || req.user._id;

    // If user specifies different instructor, verify admin permissions
    if (req.body.instructor && req.body.instructor !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can assign courses to other instructors' });
    }

    // Verify instructor user exists
    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // Process the uploaded image if it exists
    let imagePath = req.body.image || null;
    if (req.file) {
      imagePath = `/uploads/courses/${req.file.filename}`;
    }

    // Create course with enhanced fields
    const courseData = {
      title,
      description,
      instructorId,
      programId, // Include programId
      campus, // Include campus
      category,
      language: language || 'English', // Default to English if not specified
      image: imagePath,
      duration,
      startDate, // Include startDate
      endDate, // Include endDate
      classDays: Array.isArray(classDays) ? classDays : (classDays ? [classDays] : []),
      classStartTime,
      classEndTime,
      totalWeeks: totalWeeks ? parseInt(totalWeeks, 10) : undefined,
      hoursPerWeek: hoursPerWeek ? parseInt(hoursPerWeek, 10) : undefined,
      modules: modules ? (typeof modules === 'string' ? JSON.parse(modules) : modules) : [],
      status: status || 'Draft',
      level: level || 'All Levels',
      prerequisites: prerequisites ? (typeof prerequisites === 'string' ? JSON.parse(prerequisites) : prerequisites) : [],
      learningObjectives: learningObjectives ? (typeof learningObjectives === 'string' ? JSON.parse(learningObjectives) : learningObjectives) : [],
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      price: price ? parseFloat(price) : 0,
      isFeatured: isFeatured === 'true' || isFeatured === true
    };

    const course = await Course.create(courseData);

    // Create audit trail for course creation
    await CourseAudit.createAuditTrail(
      course._id,
      req.user._id,
      'create',
      null, // No previous data
      course.toObject(),
      `Course created by ${req.user.firstName} ${req.user.lastName}`
    );

    res.status(201).json(course);
  } catch (error) {
    logError(`Error creating course: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update course (admin and instructor only)
router.put('/:id', auth, authorize('admin', 'instructor'), upload.single('courseImage'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the course to update
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check permissions - only the instructor or admin can update
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }
    
    // Store the previous state for audit
    const previousData = course.toObject();
    
    // Update other fields if provided
    const fieldsToUpdate = [
      'title', 'description', 'category', 'duration', 
      'modules', 'status', 'level', 'prerequisites',
      'learningObjectives', 'tags', 'price', 'isFeatured',
      'classDays', 'startDate', 'endDate', 'classStartTime', 
      'classEndTime', 'totalWeeks', 'hoursPerWeek', 'campus',
      'language', 'edstackID' // Adding the new fields
    ];
    
    // Build update object
    const updates = {};
    
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        // Handle arrays that might come as JSON strings
        if (['modules', 'prerequisites', 'learningObjectives', 'tags', 'classDays'].includes(field) && typeof req.body[field] === 'string') {
          try {
            updates[field] = JSON.parse(req.body[field]);
          } catch (e) {
            // If not valid JSON and it's classDays, try to handle as comma-separated string
            if (field === 'classDays') {
              updates[field] = req.body[field].split(',').map(day => day.trim());
            } else {
              throw new Error(`Invalid JSON format for field: ${field}`);
            }
          }
        } else {
          updates[field] = req.body[field];
        }
      }
    });
    
    // Handle numeric fields
    if (updates.totalWeeks) updates.totalWeeks = parseInt(updates.totalWeeks, 10);
    if (updates.hoursPerWeek) updates.hoursPerWeek = parseInt(updates.hoursPerWeek, 10);
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.duration) updates.duration = parseInt(updates.duration, 10);
    
    // Handle boolean fields
    if (updates.isFeatured !== undefined) {
      updates.isFeatured = updates.isFeatured === true || updates.isFeatured === 'true';
    }
    
    // Handle instructor change if requested
    if (req.body.instructor) {
      // Only admin can change instructor
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can change course instructor' });
      }
      
      // Verify the new instructor exists
      const instructor = await User.findById(req.body.instructor);
      if (!instructor) {
        return res.status(404).json({ message: 'Instructor not found' });
      }
      
      updates.instructorId = req.body.instructor;
    }
    
    // Handle image update
    if (req.file) {
      updates.image = `/uploads/courses/${req.file.filename}`;
      
      // Delete old image if exists and is not a URL
      if (course.image && !course.image.startsWith('http')) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', course.image);
          await fs.unlink(oldImagePath);
        } catch (error) {
          // Log but don't fail if image deletion fails
          logWarn(`Failed to delete old course image: ${error.message}`);
        }
      }
    } else if (req.body.image === '') {
      // If image field is empty string, remove the image
      updates.image = null;
      
      // Delete old image if exists and is not a URL
      if (course.image && !course.image.startsWith('http')) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', course.image);
          await fs.unlink(oldImagePath);
        } catch (error) {
          // Log but don't fail if image deletion fails
          logWarn(`Failed to delete old course image: ${error.message}`);
        }
      }
    }
    
    // Update the course
    const updatedCourse = await Course.findByIdAndUpdate(
      id, 
      { $set: updates }, 
      { new: true, runValidators: true }
    ).populate('instructorId', 'firstName lastName email');
    
    // Create audit trail for the update
    await CourseAudit.createAuditTrail(
      updatedCourse._id,
      req.user._id,
      'update',
      previousData,
      updatedCourse.toObject(),
      req.body.auditNotes || `Course updated by ${req.user.firstName} ${req.user.lastName}`
    );
    
    res.json(updatedCourse);
  } catch (error) {
    logError(`Error updating course: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete course (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the course to delete
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Store the previous state for audit
    const previousData = course.toObject();
    
    // Delete the course
    await Course.findByIdAndDelete(id);
    
    // Delete the course image if it exists and is not a URL
    if (course.image && !course.image.startsWith('http')) {
      try {
        const imagePath = path.join(process.cwd(), 'public', course.image);
        await fs.unlink(imagePath);
      } catch (error) {
        // Log but don't fail if image deletion fails
        logWarn(`Failed to delete course image: ${error.message}`);
      }
    }
    
    // Create audit trail for the deletion
    await CourseAudit.createAuditTrail(
      course._id,
      req.user._id,
      'delete',
      previousData,
      null, // No new data
      req.body.auditNotes || `Course deleted by ${req.user.firstName} ${req.user.lastName}`
    );
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    logError(`Error deleting course: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a route to get course audit history
router.get('/:id/audit', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify the course exists
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get the audit trail for this course
    const auditTrail = await CourseAudit.find({ courseId: id })
      .sort({ timestamp: -1 })
      .populate('userId', 'firstName lastName email')
      .lean();
    
    res.json(auditTrail);
  } catch (error) {
    logError(`Error fetching course audit: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add module to course
router.post('/:id/modules', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, lessons } = req.body;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== course.instructorId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    // Add new module
    course.modules.push({
      title,
      description,
      lessons: lessons || []
    });

    await course.save();
    res.json(course);
  } catch (error) {
    logError(`Error adding module: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enroll in a course
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Only published courses can be enrolled
    if (course.status !== 'Published') {
      return res.status(400).json({ message: 'Cannot enroll in unpublished course' });
    }
    
    // Find student record or create one
    let student = await Student.findOne({ userId });
    
    if (!student) {
      student = await Student.create({
        userId,
        coursesEnrolled: [id]
      });
    } else {
      // Check if already enrolled
      if (student.coursesEnrolled.includes(id)) {
        return res.status(400).json({ message: 'Already enrolled in this course' });
      }
      
      // Add course to student's enrolled courses
      student.coursesEnrolled.push(id);
      await student.save();
    }
    
    // Add student to course's enrolled students
    if (!course.enrolledStudents.includes(student._id)) {
      course.enrolledStudents.push(student._id);
      course.totalEnrollment += 1;
      await course.save();
    }
    
    res.json({ message: 'Successfully enrolled in course', course });
  } catch (error) {
    logError(`Error enrolling in course: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a review to a course
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is enrolled in the course
    const student = await Student.findOne({ userId, coursesEnrolled: id });
    if (!student) {
      return res.status(403).json({ message: 'You must be enrolled in the course to leave a review' });
    }
    
    // Check if user has already left a review
    const existingReviewIndex = course.reviews.findIndex(
      review => review.studentId.toString() === userId.toString()
    );
    
    if (existingReviewIndex !== -1) {
      // Update existing review
      course.reviews[existingReviewIndex].rating = rating;
      course.reviews[existingReviewIndex].comment = comment;
    } else {
      // Add new review
      course.reviews.push({
        studentId: userId,
        rating,
        comment
      });
    }
    
    await course.save(); // This will also update the averageRating via pre-save hook
    
    res.json({ message: 'Review added successfully', course });
  } catch (error) {
    logError(`Error adding review: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

// Track lesson completion
router.post('/:courseId/modules/:moduleIndex/lessons/:lessonIndex/complete', auth, async (req, res) => {
  try {
    const { courseId, moduleIndex, lessonIndex } = req.params;
    const userId = req.user._id;
    
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is enrolled in the course
    const student = await Student.findOne({ userId, coursesEnrolled: courseId });
    if (!student) {
      return res.status(403).json({ message: 'You must be enrolled in the course to track progress' });
    }
    
    // Check if module and lesson exist
    if (!course.modules[moduleIndex] || !course.modules[moduleIndex].lessons[lessonIndex]) {
      return res.status(404).json({ message: 'Module or lesson not found' });
    }
    
    // Mark lesson as completed
    course.modules[moduleIndex].lessons[lessonIndex].isCompleted = true;
    
    await course.save();
    
    res.json({ message: 'Lesson marked as completed', course });
  } catch (error) {
    logError(`Error marking lesson as completed: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course categories
router.get('/categories/list', async (req, res) => {
  try {
    // Get all unique categories from courses
    const categories = await Course.distinct('category');
    res.json(categories);
  } catch (error) {
    logError(`Error fetching course categories: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get enrolled courses for current user
router.get('/enrolled', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find student record
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.json([]);
    }
    
    // Get enrolled courses with populated instructor info
    const courses = await Course.find({
      _id: { $in: student.coursesEnrolled }
    })
    .populate('instructorId', 'firstName lastName email')
    .populate('programId', 'name')
    .select('-modules'); // Exclude detailed content for list view
    
    logInfo(`Successfully fetched enrolled courses for student: ${userId}`);
    res.json(courses);
  } catch (error) {
    logError(`Error fetching enrolled courses: ${error.message}`);
    res.status(500).json({ message: 'Error fetching enrolled courses' });
  }
});

// Get courses taught by instructor
router.get('/teaching', auth, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Access denied. Not an instructor.' });
    }

    const courses = await Course.find({ 
      instructorId: req.user._id 
    }).populate('students', 'firstName lastName email');
    
    logInfo(`Successfully fetched courses for instructor: ${req.user._id}`);
    res.json(courses);
  } catch (error) {
    logError(`Error fetching instructor courses: ${error.message}`);
    res.status(500).json({ message: 'Error fetching instructor courses' });
  }
});

module.exports = router; 