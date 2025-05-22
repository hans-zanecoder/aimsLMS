/**
 * Seed script to add sample students to the database
 * Run this script directly with Node: node src/seedStudents.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function connectToDatabase() {
  // Try to connect to MongoDB Atlas first
  // Use the correct subdomain from MongoDB Compass
  const atlasURI = 'mongodb+srv://mongo:DIhlTnZkOm0Sb60L@aimaLMS-cluster.smycfpg.mongodb.net/aima-lms?retryWrites=true&w=majority';
  
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    console.log('Using connection string (first 20 chars):', atlasURI.substring(0, 20) + '...');
    console.log('Full database name from URI:', atlasURI.split('/').pop().split('?')[0]);
    
    await mongoose.connect(atlasURI);
    console.log('Connected to MongoDB Atlas!');
    console.log('Connected database name:', mongoose.connection.name);
    console.log('Connected to host:', mongoose.connection.host);
    return;
  } catch (err) {
    console.error('MongoDB Atlas connection error:', err);
    console.log('Falling back to in-memory MongoDB...');
  }

  // Fall back to in-memory MongoDB
  try {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('Connected to in-memory MongoDB!');
    console.log('Note: This is a temporary database that will be lost when the script ends.');
    return;
  } catch (err) {
    console.error('In-memory MongoDB error:', err);
    process.exit(1);
  }
}

// Sample student data
const sampleStudents = [
  {
    email: 'sarah@example.com',
    firstName: 'Sarah',
    lastName: 'Anderson',
    password: 'password123',
    phone: '555-123-4567',
    location: 'New York',
    department: 'Business',
    enrollmentDate: new Date('2024-01-15'),
    status: 'Active',
    progress: 75
  },
  {
    email: 'michael@example.com',
    firstName: 'Michael',
    lastName: 'Chen',
    password: 'password123',
    phone: '555-987-6543',
    location: 'San Francisco',
    department: 'Computer Science',
    enrollmentDate: new Date('2024-02-01'),
    status: 'Active',
    progress: 45
  },
  {
    email: 'emma@example.com',
    firstName: 'Emma',
    lastName: 'Wilson',
    password: 'password123',
    phone: '555-456-7890',
    location: 'Chicago',
    department: 'Psychology',
    enrollmentDate: new Date('2024-02-10'),
    status: 'Pending',
    progress: 0
  },
  {
    email: 'james@example.com',
    firstName: 'James',
    lastName: 'Rodriguez',
    password: 'password123',
    phone: '555-789-0123',
    location: 'Miami',
    department: 'Marketing',
    enrollmentDate: new Date('2024-01-20'),
    status: 'Active',
    progress: 90
  },
  {
    email: 'lisa@example.com',
    firstName: 'Lisa',
    lastName: 'Wang',
    password: 'password123',
    phone: '555-234-5678',
    location: 'Seattle',
    department: 'Design',
    enrollmentDate: new Date('2024-02-05'),
    status: 'Inactive',
    progress: 30
  },
  {
    email: 'mickey@disney.com',
    firstName: 'Mickey',
    lastName: 'Mouse',
    password: 'password123',
    phone: '555-111-2222',
    location: 'Orlando',
    department: 'Entertainment',
    enrollmentDate: new Date('2024-01-01'),
    status: 'Active',
    progress: 85
  }
];

// Function to seed students
async function seedStudents() {
  try {
    await connectToDatabase();
    
    // First, check if there are already students in the database
    const studentCount = await Student.countDocuments();
    
    if (studentCount > 0) {
      console.log(`Database already has ${studentCount} students. No seeding needed.`);
      return process.exit(0);
    }
    
    console.log('Starting to seed students...');
    
    // Create each student
    for (const studentData of sampleStudents) {
      // Check if user with this email already exists
      const existingUser = await User.findOne({ email: studentData.email });
      
      if (existingUser) {
        console.log(`User with email ${studentData.email} already exists, skipping...`);
        continue;
      }
      
      // Create a new user
      const hashedPassword = await bcrypt.hash(studentData.password, 10);
      const user = await User.create({
        email: studentData.email,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        password: hashedPassword,
        phone: studentData.phone,
        location: studentData.location,
        department: studentData.department,
        role: 'student'
      });
      
      // Create student profile linked to user
      const student = await Student.create({
        userId: user._id,
        enrollmentDate: studentData.enrollmentDate,
        status: studentData.status,
        progress: studentData.progress,
        coursesEnrolled: []
      });
      
      console.log(`Created student: ${user.firstName} ${user.lastName}`);
    }
    
    console.log('Student seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding students:', error);
    process.exit(1);
  }
}

// Run the seed function
seedStudents(); 