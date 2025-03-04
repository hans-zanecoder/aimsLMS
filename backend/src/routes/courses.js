const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const Student = require('../models/Student');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const { status, category, instructor } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (instructor) filter.instructorId = instructor;
    
    // Only return published courses for non-admin users
    if (!req.user || req.user.role !== 'admin') {
      filter.status = 'Published';
    }

    const courses = await Course.find(filter)
      .populate('instructorId', 'firstName lastName email')
      .select('-modules'); // Exclude detailed content for list view
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id)
      .populate('instructorId', 'firstName lastName email')
      .populate({
        path: 'enrolledStudents',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        }
      });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if unpublished course is being accessed by unauthorized user
    if (course.status !== 'Published' && (!req.user || (req.user.role !== 'admin' && req.user._id.toString() !== course.instructorId._id.toString()))) {
      return res.status(403).json({ message: 'Not authorized to view this course' });
    }

    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new course (admin and instructor only)
router.post('/', auth, authorize('admin', 'instructor'), async (req, res) => {
  try {
    const { title, description, category, image, duration, modules, status } = req.body;
    
    // Use the logged-in user as instructor if not specified
    const instructorId = req.body.instructorId || req.user._id;

    // If user specifies different instructor, verify admin permissions
    if (req.body.instructorId && req.body.instructorId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can assign courses to other instructors' });
    }

    // Verify instructor user exists
    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // Create course
    const course = await Course.create({
      title,
      description,
      instructorId,
      category,
      image,
      duration,
      modules: modules || [],
      status: status || 'Draft'
    });

    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a course
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, image, duration, modules, status } = req.body;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions: must be admin or the course's instructor
    if (req.user.role !== 'admin' && req.user._id.toString() !== course.instructorId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    // Update fields if provided
    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;
    if (image) course.image = image;
    if (duration) course.duration = duration;
    if (modules) course.modules = modules;
    if (status) course.status = status;

    // Save updated course
    await course.save();
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a course (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Remove course from all enrolled students
    await Student.updateMany(
      { coursesEnrolled: id },
      { $pull: { coursesEnrolled: id } }
    );

    // Delete the course
    await Course.findByIdAndDelete(id);
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Server error' });
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
    console.error('Error adding module:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 