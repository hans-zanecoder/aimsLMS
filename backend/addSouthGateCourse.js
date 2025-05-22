const mongoose = require('mongoose');
const Course = require('./src/models/Course');
const Program = require('./src/models/Program');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mongo:Mongodb123@allure-db.smycfpg.mongodb.net/aima-lms?retryWrites=true&w=majority';

// Alina Santiago's instructor ID
const ALINA_INSTRUCTOR_ID = '682f151a99883ebb32c7f8b3';

async function addSouthGateIntroCourse() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');
    
    // Find the Intro to Makeup Artistry program
    const program = await Program.findOne({ name: { $regex: /intro.*makeup/i } });
    if (!program) {
      console.error('Intro to Makeup Artistry program not found');
      mongoose.disconnect();
      return;
    }
    
    console.log(`Found program: ${program.name} with ID: ${program._id}`);
    
    // Create the new course
    const newCourse = new Course({
      title: 'Intro to Makeup Artistry - South Gate Campus',
      description: 'Introduction to makeup artistry covering beauty fundamentals, skin preparation, and basic techniques. Classes held at our South Gate location for aspiring makeup artists.',
      instructorId: ALINA_INSTRUCTOR_ID,
      programId: program._id,
      campus: 'South Gate',
      category: 'Intro to Makeup Artistry',
      status: 'Published',
      level: 'Beginner',
      learningObjectives: [
        'Master makeup fundamentals',
        'Learn color theory and skin tone matching',
        'Practice basic beauty techniques',
        'Build a starter portfolio'
      ],
      tags: ['makeup', 'beginner', 'beauty', 'fundamentals'],
      isFeatured: true,
      startDate: new Date('2025-07-26'),
      endDate: new Date('2025-08-30'),
      classDays: ['Saturday'],
      classStartTime: '10:00 AM',
      classEndTime: '2:00 PM',
      totalWeeks: 6,
      hoursPerWeek: 4,
      duration: 6 * 4 * 60, // 6 weeks × 4 hours × 60 minutes
      modules: [
        {
          title: 'Introduction to Makeup Tools',
          description: 'Overview of essential makeup tools and products'
        },
        {
          title: 'Skin Preparation',
          description: 'Techniques for preparing skin for makeup application'
        },
        {
          title: 'Foundation and Concealing',
          description: 'Basic foundation and concealing techniques'
        },
        {
          title: 'Eye Makeup Basics',
          description: 'Introduction to eye makeup techniques'
        },
        {
          title: 'Lip and Cheek Application',
          description: 'Techniques for lip and cheek color application'
        },
        {
          title: 'Complete Makeup Look',
          description: 'Bringing it all together for a complete makeup look'
        }
      ]
    });
    
    const savedCourse = await newCourse.save();
    console.log('Successfully created new course:');
    console.log(`Title: ${savedCourse.title}`);
    console.log(`Campus: ${savedCourse.campus}`);
    console.log(`Start Date: ${savedCourse.startDate.toLocaleDateString()}`);
    console.log(`End Date: ${savedCourse.endDate.toLocaleDateString()}`);
    console.log(`Schedule: ${savedCourse.classDays.join(', ')} ${savedCourse.classStartTime} - ${savedCourse.classEndTime}`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error creating course:', error);
    await mongoose.disconnect();
  }
}

// Run the function
addSouthGateIntroCourse(); 