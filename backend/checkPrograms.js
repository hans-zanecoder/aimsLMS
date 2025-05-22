require('dotenv').config();
const mongoose = require('mongoose');
const Program = require('./src/models/Program');

async function checkPrograms() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all programs
    const programs = await Program.find({});
    console.log('\nTotal programs found:', programs.length);
    
    // Print each program
    programs.forEach((program, index) => {
      console.log(`\n${index + 1}. Program Details:`);
      console.log('- Name:', program.name);
      console.log('- Description:', program.description);
      console.log('- Duration:', program.durationValue, program.durationUnit);
      console.log('- Instruction Modes:', program.instructionModes);
      console.log('- Created At:', program.createdAt);
    });

    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
checkPrograms(); 