require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    
    if (!dbUri) {
      console.error('MongoDB URI not found in environment variables');
      process.exit(1);
    }
    
    console.log('Connecting to MongoDB:', dbUri);
    
    await mongoose.connect(dbUri);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    
    const dbName = mongoose.connection.name;
    console.log(`Database name: ${dbName}`);
    
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Find and clean up orphaned users
const cleanupOrphanedUsers = async () => {
  try {
    console.log('Starting cleanup of orphaned user records...');
    
    // Get all users with 'student' role
    const studentUsers = await User.find({ role: 'student' });
    console.log(`Found ${studentUsers.length} users with student role`);
    
    // Track statistics
    let orphanedCount = 0;
    let deletedCount = 0;
    
    // Check each user to see if they have an associated student record
    for (const user of studentUsers) {
      const student = await Student.findOne({ userId: user._id });
      
      if (!student) {
        orphanedCount++;
        console.log(`Found orphaned user: ${user.firstName} ${user.lastName} (${user.email})`);
        
        // Delete the orphaned user
        await User.findByIdAndDelete(user._id);
        deletedCount++;
        console.log(`Deleted orphaned user: ${user._id}`);
      }
    }
    
    console.log('Cleanup complete!');
    console.log(`Found ${orphanedCount} orphaned users`);
    console.log(`Deleted ${deletedCount} orphaned users`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
(async () => {
  const connected = await connectDB();
  
  if (connected) {
    await cleanupOrphanedUsers();
  }
})(); 