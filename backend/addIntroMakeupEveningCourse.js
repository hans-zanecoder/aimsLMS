const mongoose = require('mongoose');
const Course = require('./src/models/Course');
const Program = require('./src/models/Program');
const User = require('./src/models/User');
require('dotenv').config();

// MongoDB connection string - use the same one the backend server uses
// For development, we'll hardcode the connection for MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mongo:Mongodb123@allure-db.smycfpg.mongodb.net/aima-lms?retryWrites=true&w=majority';

async function addIntroMakeupEveningCourse() {
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    console.log('Using connection string (first 20 chars):', MONGODB_URI.substring(0, 20) + '...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Successfully connected to MongoDB Atlas!');
    console.log('Connected database name:', mongoose.connection.name);
    console.log('Connected to host:', mongoose.connection.host);
    
    // Find the Intro to Makeup Artistry program
    const program = await Program.findOne({ name: { $regex: /intro.*makeup/i } });
    if (!program) {
      console.error('Intro to Makeup Artistry program not found');
      return;
    }
    console.log('Found program:', program.name, program._id);
    
    // Find instructor Alina Santiago
    const instructorUser = await User.findOne({ 
      firstName: 'Alina', 
      lastName: 'Santiago',
      role: 'instructor'
    });
    
    if (!instructorUser) {
      console.error('Instructor Alina Santiago not found');
      return;
    }
    console.log('Found instructor:', instructorUser.firstName, instructorUser.lastName, instructorUser._id);
    
    // Check if a similar course already exists to avoid duplicates
    const existingCourse = await Course.findOne({
      programId: program._id,
      instructorId: instructorUser._id,
      classStartTime: '17:30',
      classDays: ['Monday']
    });
    
    if (existingCourse) {
      console.log('A similar evening course already exists:', existingCourse.title);
      console.log('Course details:', {
        startDate: existingCourse.startDate,
        endDate: existingCourse.endDate,
        classDays: existingCourse.classDays,
        classTime: `${existingCourse.classStartTime} - ${existingCourse.classEndTime}`
      });
      
      // Ask if the user wants to update the existing course
      console.log('Proceeding to update the course...');
    }
    
    // Set the course dates and calculate duration
    const startDate = new Date('2025-06-09');  // June 9, 2025 (Monday)
    const endDate = new Date('2025-07-14');    // July 14, 2025 (Monday)
    const totalWeeks = 6;
    const hoursPerWeek = 4;
    const totalDuration = totalWeeks * hoursPerWeek * 60; // Convert to minutes
    
    const courseData = {
      title: 'Intro to Makeup Artistry - Evening Class (Santa Ana)',
      description: 'Evening session of our intro to makeup artistry program covering beauty, bridal, and basic makeup techniques. Perfect for working professionals looking to start a career in makeup artistry.',
      instructorId: instructorUser._id,
      category: program.name,
      programId: program._id,
      campus: 'Santa Ana',
      duration: totalDuration,
      status: 'Published',
      level: 'Beginner',
      prerequisites: [],
      learningObjectives: [
        'Learn foundational makeup techniques',
        'Develop color theory knowledge',
        'Practice basic beauty and bridal makeup applications',
        'Build a starter portfolio'
      ],
      tags: ['makeup', 'evening', 'beginner', 'beauty'],
      price: 0,
      isFeatured: true,
      // Schedule fields
      startDate: startDate,
      endDate: endDate,
      classDays: ['Monday'],
      classStartTime: '17:30',  // 5:30pm in 24-hour format
      classEndTime: '21:30',    // 9:30pm in 24-hour format
      totalWeeks: totalWeeks,
      hoursPerWeek: hoursPerWeek
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
    console.log('Schedule: Mondays from', updatedCourse.classStartTime, 'to', updatedCourse.classEndTime);
    console.log('Total Duration:', updatedCourse.duration, 'minutes');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
  }
}

// Run the function
addIntroMakeupEveningCourse(); 