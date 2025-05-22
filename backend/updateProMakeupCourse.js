require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./src/models/Course');
const Program = require('./src/models/Program');
const User = require('./src/models/User');
const Instructor = require('./src/models/Instructor');

async function updateCourse() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Find the Professional Makeup Artistry program
    const program = await Program.findOne({ name: 'Professional Makeup Artistry' });
    if (!program) {
      console.error('Professional Makeup Artistry program not found');
      await mongoose.connection.close();
      return;
    }
    console.log('Found program:', program.name, `(${program._id})`);

    // 2. Find or create the instructor
    let instructorUser = await User.findOne({ 
      $or: [
        { email: 'alina.santiago@example.com' },
        { 
          firstName: 'Alina',
          lastName: 'Santiago'
        }
      ]
    });

    if (!instructorUser) {
      // Create the instructor user if not found
      instructorUser = await User.create({
        firstName: 'Alina',
        lastName: 'Santiago',
        email: 'alina.santiago@example.com',
        password: 'password123', // Temporary password
        role: 'instructor'
      });
      console.log('Created instructor user:', instructorUser.firstName, instructorUser.lastName);
    } else {
      console.log('Found instructor user:', instructorUser.firstName, instructorUser.lastName);
    }

    // 3. Find the course by title or create it if it doesn't exist
    let existingCourse = await Course.findOne({ title: 'Professional Makeup Artistry - Santa Ana Campus' });
    
    // Calculate total duration (14 weeks * 4 hours per week)
    const totalDuration = 14 * 4 * 60; // in minutes (14 weeks * 4 hours per week * 60 min/hour)

    // Parse dates
    const startDate = new Date('2025-01-11');
    const endDate = new Date('2025-04-26');

    const courseData = {
      title: 'Professional Makeup Artistry - Santa Ana Campus',
      description: 'Professional makeup artistry program covering beauty, bridal, editorial, and special effects makeup. Classes held at the Santa Ana campus.',
      instructorId: instructorUser._id,
      category: program.name,
      programId: program._id,
      campus: 'Santa Ana',
      duration: totalDuration,
      status: 'Published',
      level: 'All Levels',
      prerequisites: [],
      learningObjectives: [
        'Master professional makeup techniques',
        'Learn color theory and skin tone matching',
        'Develop skills in beauty, bridal, and special effects makeup',
        'Create a professional makeup portfolio'
      ],
      tags: ['makeup', 'professional', 'beauty', 'bridal', 'special effects'],
      price: 0,
      isFeatured: true,
      // Schedule fields
      startDate: startDate,
      endDate: endDate,
      classDays: ['Saturday'],
      classStartTime: '10:00 AM',
      classEndTime: '2:00 PM',
      totalWeeks: 14,
      hoursPerWeek: 4
    };

    let updatedCourse;
    
    if (existingCourse) {
      // Update existing course
      updatedCourse = await Course.findByIdAndUpdate(
        existingCourse._id,
        courseData,
        { new: true }
      );
      console.log('Successfully updated course:', updatedCourse.title);
    } else {
      // Create new course
      updatedCourse = await Course.create(courseData);
      console.log('Successfully created course:', updatedCourse.title);
    }

    console.log('Program ID:', updatedCourse.programId);
    console.log('Instructor ID:', updatedCourse.instructorId);
    console.log('Start Date:', updatedCourse.startDate);
    console.log('End Date:', updatedCourse.endDate);
    console.log('Class Days:', updatedCourse.classDays);
    console.log('Schedule: Saturdays from', updatedCourse.classStartTime, 'to', updatedCourse.classEndTime);
    console.log('Duration:', updatedCourse.totalWeeks, 'weeks,', updatedCourse.hoursPerWeek, 'hours per week');

  } catch (error) {
    console.error('Error updating course:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

updateCourse(); 