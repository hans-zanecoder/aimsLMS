'use strict';

const express = require('express');
const User = require('../models/User');
const Student = require('../models/Student');
const { auth, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

const router = express.Router();

// Get all students (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    // Get students with populated user information
    const students = await Student.find()
      .populate('userId', 'firstName lastName email phone location department') 
      .populate('coursesEnrolled', 'title');
    
    // Format the response
    const formattedStudents = students.map(student => ({
      id: student._id,
      userId: student.userId._id,
      name: `${student.userId.firstName} ${student.userId.lastName}`,
      email: student.userId.email,
      phone: student.userId.phone || '',
      location: student.userId.location || '',
      department: student.userId.department || '',
      enrollmentDate: student.enrollmentDate,
      coursesEnrolled: student.coursesEnrolled.length,
      coursesList: student.coursesEnrolled.map(course => ({
        id: course._id,
        title: course.title
      })),
      status: student.status,
      progress: student.progress
    }));

    res.json(formattedStudents);
  } catch (error) {
    logger.error('Error fetching students:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch students' 
    });
  }
});

// Get single student details
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id)
      .populate('userId', '-password')
      .populate('coursesEnrolled');
    
    if (!student) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Student not found' 
      });
    }

    // Check if requester is admin or the student's own user
    if (req.user.role !== 'admin' && req.user._id.toString() !== student.userId._id.toString()) {
      return res.status(403).json({ 
        status: 'error',
        message: 'Not authorized to view this student' 
      });
    }

    // Format the response
    const formattedStudent = {
      id: student._id,
      userId: student.userId._id,
      name: `${student.userId.firstName} ${student.userId.lastName}`,
      email: student.userId.email,
      phone: student.userId.phone || '',
      location: student.userId.location || '',
      department: student.userId.department || '',
      enrollmentDate: student.enrollmentDate,
      coursesEnrolled: student.coursesEnrolled.length,
      coursesList: student.coursesEnrolled.map(course => ({
        id: course._id,
        title: course.title
      })),
      status: student.status,
      progress: student.progress,
      paymentProfile: student.paymentProfile || {
        totalCost: 0,
        downPayment: 0,
        amountFinanced: 0,
        paymentFrequency: 'monthly',
        totalPayments: 0,
        paymentAmount: 0,
        paymentDates: [],
        paymentHistory: []
      }
    };

    res.json(formattedStudent);
  } catch (error) {
    logger.error('Error fetching student:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch student details' 
    });
  }
});

// Create new student (admin only)
router.post('/', 
  auth, 
  authorize('admin'),
  validate('createStudent'),
  async (req, res) => {
    try {
      logger.info('Creating new student with data:', req.validatedData);
      
      const { 
        userId, 
        status, 
        enrollmentDate, 
        email, 
        firstName, 
        lastName,
        phone,
        location,
        department 
      } = req.validatedData;
      
      let user;
      
      // If userId is provided, use existing user
      if (userId) {
        user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ 
            status: 'error',
            message: 'User not found' 
          });
        }
        
        const existingStudent = await Student.findOne({ userId });
        if (existingStudent) {
          return res.status(400).json({ 
            status: 'error',
            message: 'This user already has a student record' 
          });
        }

        if (phone || location || department) {
          Object.assign(user, { phone, location, department });
          await user.save();
        }
      } 
      // Create new user if no userId provided
      else {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ 
            status: 'error',
            message: 'A user with this email already exists' 
          });
        }
        
        const tempPassword = Math.random().toString(36).slice(-8);
        user = await User.create({
          email,
          firstName,
          lastName,
          phone: phone || '',
          location: location || '',
          department: department || '',
          password: tempPassword,
          role: 'student'
        });
        
        logger.info(`Created user with temporary password: ${tempPassword}`);
        // TODO: Implement email service to send temporary password
      }

      const student = await Student.create({
        userId: user._id,
        status: status || 'Pending',
        enrollmentDate: enrollmentDate || new Date(),
        coursesEnrolled: [],
        progress: 0
      });

      if (user.role !== 'student') {
        user.role = 'student';
        await user.save();
      }

      const formattedStudent = {
        id: student._id,
        userId: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone || '',
        location: user.location || '',
        department: user.department || '',
        enrollmentDate: student.enrollmentDate,
        coursesEnrolled: 0,
        coursesList: [],
        status: student.status,
        progress: student.progress,
        paymentProfile: student.paymentProfile || {
          totalCost: 0,
          downPayment: 0,
          amountFinanced: 0,
          paymentFrequency: 'monthly',
          totalPayments: 0,
          paymentAmount: 0,
          paymentDates: [],
          paymentHistory: []
        }
      };

      res.status(201).json(formattedStudent);
    } catch (error) {
      logger.error('Error creating student:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to create student' 
      });
    }
});

// Update student (admin only)
router.put('/:id', 
  auth, 
  authorize('admin'),
  validate('updateStudent'),
  async (req, res) => {
    try {
      const { id } = req.params;
      logger.info(`Updating student ${id} with data:`, req.validatedData);
      
      const student = await Student.findById(id).populate('userId');
      if (!student) {
        return res.status(404).json({ 
          status: 'error',
          message: 'Student not found' 
        });
      }

      // Update student fields
      Object.assign(student, req.validatedData);
      
      // Special handling for payment profile to ensure it's properly updated
      if (req.validatedData.paymentProfile) {
        student.paymentProfile = {
          ...student.paymentProfile,
          ...req.validatedData.paymentProfile
        };
      }
      
      await student.save();

      // Update associated user fields if provided
      const userFields = ['firstName', 'lastName', 'phone', 'location', 'department'];
      const userUpdates = {};
      userFields.forEach(field => {
        if (req.validatedData[field]) {
          userUpdates[field] = req.validatedData[field];
        }
      });

      if (Object.keys(userUpdates).length > 0) {
        Object.assign(student.userId, userUpdates);
        await student.userId.save();
      }

      const formattedStudent = {
        id: student._id,
        userId: student.userId._id,
        name: `${student.userId.firstName} ${student.userId.lastName}`,
        email: student.userId.email,
        phone: student.userId.phone || '',
        location: student.userId.location || '',
        department: student.userId.department || '',
        enrollmentDate: student.enrollmentDate,
        coursesEnrolled: student.coursesEnrolled.length,
        status: student.status,
        progress: student.progress,
        paymentProfile: student.paymentProfile || {
          totalCost: 0,
          downPayment: 0,
          amountFinanced: 0,
          paymentFrequency: 'monthly',
          totalPayments: 0,
          paymentAmount: 0,
          paymentDates: [],
          paymentHistory: []
        }
      };

      res.json(formattedStudent);
    } catch (error) {
      logger.error('Error updating student:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to update student' 
      });
    }
});

// Enroll student in a course
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { courseId } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Student not found' 
      });
    }

    // Check if requester is admin or the student's own user
    if (req.user.role !== 'admin' && req.user._id.toString() !== student.userId.toString()) {
      return res.status(403).json({ 
        status: 'error',
        message: 'Not authorized to enroll this student' 
      });
    }

    // Check if already enrolled
    if (student.coursesEnrolled.includes(courseId)) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Student already enrolled in this course' 
      });
    }

    // Add course to enrolled courses
    student.coursesEnrolled.push(courseId);
    await student.save();

    res.json({ 
      status: 'success',
      message: 'Student enrolled successfully', 
      student 
    });
  } catch (error) {
    logger.error('Error enrolling student:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to enroll student' 
    });
  }
});

// Delete student (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await Student.findById(id).populate('userId');
    if (!student) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Student not found' 
      });
    }

    // Store the userId to delete the user after
    const userId = student.userId._id;

    // Delete student record
    await Student.findByIdAndDelete(id);
    
    // Also delete the associated user
    await User.findByIdAndDelete(userId);

    logger.info(`Deleted student ${id} and associated user ${userId}`);
    
    res.json({ 
      status: 'success',
      message: 'Student and associated user account deleted successfully' 
    });
  } catch (error) {
    logger.error('Error deleting student:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to delete student' 
    });
  }
});

module.exports = router;